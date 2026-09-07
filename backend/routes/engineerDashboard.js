const express = require('express');
const Project = require('../models/Project');
const EngineerProfile = require('../models/EngineerProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/engineer/available-projects
// @desc    Get all open projects an engineer can apply to
router.get('/available-projects', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const profile = await EngineerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { projectType, city, sortBy, page = 1, limit = 12 } = req.query;

    const filter = { status: 'posted' };
    if (projectType) filter.projectType = projectType;
    if (city) filter['location.city'] = new RegExp(city, 'i');

    const sort = {};
    if (sortBy === 'budget') sort['budget.max'] = -1;
    else if (sortBy === 'newest') sort.createdAt = -1;
    else sort.createdAt = -1;

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('customer', 'firstName lastName avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: projects, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/engineer/apply/:projectId
// @desc    Engineer applies/bids on a project
router.post('/apply/:projectId', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const profile = await EngineerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Check if already applied
    const alreadyApplied = project.applications?.some(
      a => a.engineer.toString() === profile._id.toString()
    );
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'Already applied to this project' });
    }

    // Add application
    if (!project.applications) project.applications = [];
    project.applications.push({
      engineer: profile._id,
      coverLetter: req.body.coverLetter || '',
      proposedBudget: req.body.proposedBudget || null,
      proposedTimeline: req.body.proposedTimeline || null,
      status: 'pending',
      appliedAt: new Date(),
    });

    await project.save();

    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/engineer/my-requests
// @desc    Get projects where the engineer has been requested/matched
router.get('/my-requests', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const profile = await EngineerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Find projects where this engineer is in matchedEngineers or assignedEngineer
    const projects = await Project.find({
      $or: [
        { 'matchedEngineers.engineer': profile._id },
        { assignedEngineer: profile._id },
        { 'applications.engineer': profile._id },
      ],
    })
      .populate('customer', 'firstName lastName email avatar phone')
      .sort({ updatedAt: -1 });

    // Categorize
    const requests = projects.map(p => {
      const application = p.applications?.find(
        a => a.engineer.toString() === profile._id.toString()
      );
      const isAssigned = p.assignedEngineer?.toString() === profile._id.toString();

      return {
        project: p,
        applicationStatus: application?.status || null,
        isAssigned,
        appliedAt: application?.appliedAt || null,
      };
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/engineer/respond/:projectId
// @desc    Engineer accepts or declines a project request
router.put('/respond/:projectId', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'decline'
    if (!['accept', 'decline', 'withdraw'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept, decline, or withdraw' });
    }

    const profile = await EngineerProfile.findOne({ user: req.user.id });
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const app = project.applications?.find(
      a => a.engineer.toString() === profile._id.toString()
    );
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    if (action === 'accept') {
      // Engineer can only accept if customer has selected them
      if (app.status !== 'selected') {
        return res.status(400).json({ success: false, message: 'You can only accept after the customer selects you' });
      }
      app.status = 'accepted';
      project.assignedEngineer = profile._id;
      project.status = 'in_progress';
      // Decline all other applications
      project.applications.forEach(a => {
        if (a.engineer.toString() !== profile._id.toString() && a.status !== 'withdrawn') {
          a.status = 'declined';
        }
      });
    } else if (action === 'decline') {
      // Engineer declines customer's selection
      if (app.status !== 'selected') {
        return res.status(400).json({ success: false, message: 'Nothing to decline' });
      }
      app.status = 'declined';
    } else if (action === 'withdraw') {
      // Engineer withdraws their own pending application
      project.applications = project.applications.filter(
        a => a.engineer.toString() !== profile._id.toString()
      );
    }

    await project.save();

    const messages = { accept: 'Project accepted! You can now start working.', decline: 'Project declined.', withdraw: 'Application withdrawn.' };
    res.json({
      success: true,
      message: messages[action],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/engineer/active-projects
// @desc    Get projects the engineer is currently working on
router.get('/active-projects', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const profile = await EngineerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const projects = await Project.find({
      assignedEngineer: profile._id,
      status: { $in: ['in_progress', 'review'] },
    })
      .populate('customer', 'firstName lastName email avatar phone')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/engineer/submit-milestone/:projectId/:milestoneIndex
// @desc    Submit a milestone deliverable
router.put('/submit-milestone/:projectId/:milestoneIndex', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const idx = parseInt(req.params.milestoneIndex);
    if (!project.milestones[idx]) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    project.milestones[idx].status = 'submitted';
    project.milestones[idx].submittedAt = new Date();
    if (req.body.deliverables) {
      project.milestones[idx].milestoneDeliverables = req.body.deliverables;
    }

    await project.save();

    res.json({ success: true, message: 'Milestone submitted for review' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/engineer/stats
// @desc    Get engineer dashboard stats
router.get('/stats', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const profile = await EngineerProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const activeProjects = await Project.countDocuments({
      assignedEngineer: profile._id,
      status: { $in: ['in_progress', 'review'] },
    });

    const completedProjects = await Project.countDocuments({
      assignedEngineer: profile._id,
      status: 'completed',
    });

    const pendingRequests = await Project.countDocuments({
      'applications.engineer': profile._id,
      'applications.status': 'pending',
    });

    const availableProjects = await Project.countDocuments({ status: 'posted' });

    res.json({
      success: true,
      data: {
        activeProjects,
        completedProjects,
        pendingRequests,
        availableProjects,
        totalEarnings: profile.totalEarnings || 0,
        rating: profile.rating || 0,
        reviewCount: profile.reviewCount || 0,
        verificationStatus: profile.verificationStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
