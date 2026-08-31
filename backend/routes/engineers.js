const express = require('express');
const EngineerProfile = require('../models/EngineerProfile');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/engineers
// @desc    Browse/filter engineers directory
router.get('/', async (req, res) => {
  try {
    const {
      specialization, city, minRating, maxPrice,
      availability, sortBy, page = 1, limit = 12,
    } = req.query;

    const filter = { verificationStatus: 'verified' };

    if (specialization) filter.specialization = specialization;
    if (city) filter.city = new RegExp(city, 'i');
    if (availability) filter.availability = availability;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxPrice) filter['fixedRateRange.max'] = { $lte: parseInt(maxPrice) };

    const sort = {};
    if (sortBy === 'rating') sort.rating = -1;
    else if (sortBy === 'experience') sort.yearsOfExperience = -1;
    else if (sortBy === 'price') sort['fixedRateRange.min'] = 1;
    else sort.matchScore = -1;

    const total = await EngineerProfile.countDocuments(filter);
    const engineers = await EngineerProfile.find(filter)
      .populate('user', 'firstName lastName email avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: engineers.length,
      total,
      pages: Math.ceil(total / limit),
      data: engineers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/engineers/me
// @desc    Get own engineer profile by user ID (auto-create if missing)
router.get('/me', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    let engineer = await EngineerProfile.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email avatar phone');

    if (!engineer) {
      // Auto-create a blank profile for engineers who registered without one
      const u = req.user;
      engineer = await EngineerProfile.create({
        user: req.user.id,
        specialization: 'civil_engineer',
        title: `${u.firstName || ''} ${u.lastName || ''} - Engineer`.trim(),
        licenseNumber: 'PENDING',
        yearsOfExperience: 0,
        city: 'Not set',
        state: 'Not set',
        country: 'Pakistan',
      });
      engineer = await EngineerProfile.findById(engineer._id)
        .populate('user', 'firstName lastName email avatar phone');
    }

    res.json({ success: true, data: engineer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/engineers/:id
router.get('/:id', async (req, res) => {
  try {
    const engineer = await EngineerProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar phone');

    if (!engineer) {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    res.json({ success: true, data: engineer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/engineers/profile
// @desc    Update own profile
router.put('/profile', protect, authorize('engineer', 'architect'), async (req, res) => {
  try {
    const profile = await EngineerProfile.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
