const express = require('express');
const User = require('../models/User');
const EngineerProfile = require('../models/EngineerProfile');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Platform overview statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalEngineers,
      totalProjects,
      activeProjects,
      completedProjects,
      pendingVerifications,
      verifiedEngineers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: { $in: ['engineer', 'architect'] } }),
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['posted', 'matched', 'in_progress', 'review'] } }),
      Project.countDocuments({ status: 'completed' }),
      EngineerProfile.countDocuments({ verificationStatus: 'pending' }),
      EngineerProfile.countDocuments({ verificationStatus: 'verified' }),
    ]);

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Projects by status
    const projectsByStatus = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue potential (sum of estimated costs)
    const revenuePipeline = await Project.aggregate([
      { $match: { 'estimatedCost.min': { $exists: true } } },
      { $group: { _id: null, totalMin: { $sum: '$estimatedCost.min' }, totalMax: { $sum: '$estimatedCost.max' } } },
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, customers: totalCustomers, engineers: totalEngineers, recentSignups },
        projects: {
          total: totalProjects, active: activeProjects, completed: completedProjects,
          byStatus: projectsByStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        },
        engineers: { pendingVerifications, verified: verifiedEngineers },
        revenue: revenuePipeline[0] || { totalMin: 0, totalMax: 0 },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/admin/users/:id/toggle-active
// @desc    Activate/deactivate a user
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin' });
    // Also remove engineer profile if exists
    await EngineerProfile.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/engineers
// @desc    Get all engineer profiles with user info
router.get('/engineers', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.verificationStatus = status;

    let engineers = EngineerProfile.find(query)
      .populate('user', 'firstName lastName email phone isActive createdAt')
      .populate('verifiedBy', 'firstName lastName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await EngineerProfile.countDocuments(query);
    const data = await engineers;

    // Filter by search on populated fields
    let filtered = data;
    if (search) {
      const s = search.toLowerCase();
      filtered = data.filter(e =>
        e.user?.firstName?.toLowerCase().includes(s) ||
        e.user?.lastName?.toLowerCase().includes(s) ||
        e.user?.email?.toLowerCase().includes(s) ||
        e.city?.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      data: filtered,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/admin/engineers/:id/verify
// @desc    Verify or reject an engineer
router.put('/engineers/:id/verify', async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be verified or rejected' });
    }

    const engineer = await EngineerProfile.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!engineer) return res.status(404).json({ success: false, message: 'Engineer not found' });

    engineer.verificationStatus = status;
    engineer.verifiedAt = new Date();
    engineer.verifiedBy = req.user._id;
    await engineer.save();

    // Also update user's isVerified flag
    await User.findByIdAndUpdate(engineer.user._id, { isVerified: status === 'verified' });

    res.json({ success: true, data: engineer, message: `Engineer ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/admin/projects
// @desc    Get all projects
router.get('/projects', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('customer', 'firstName lastName email')
      .populate({ path: 'assignedEngineer', populate: { path: 'user', select: 'firstName lastName email' } })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: projects,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/admin/projects/:id
// @desc    Delete a project
router.delete('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/admin/create-admin
// @desc    Create an admin account (seed route — only works if no admin exists)
router.post('/seed', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Admin already exists' });

    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'BuildLink',
      email: req.body.email || 'admin@buildlink.com',
      password: req.body.password || 'Admin@12345',
      phone: req.body.phone || '+923000000000',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    res.json({ success: true, message: 'Admin created', data: { email: admin.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
