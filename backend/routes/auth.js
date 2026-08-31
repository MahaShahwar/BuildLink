const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const EngineerProfile = require('../models/EngineerProfile');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a user (any role)
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').isIn(['customer', 'engineer', 'architect', 'company']).withMessage('Valid role is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email } = req.body;

    // Check duplicate
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create(req.body);
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/register/engineer
// @desc    Register an engineer with full profile
router.post('/register/engineer', [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('phone').notEmpty(),
  body('specialization').notEmpty(),
  body('licenseNumber').notEmpty(),
  body('yearsOfExperience').isInt({ min: 0 }),
  body('city').notEmpty(),
  body('state').notEmpty(),
  body('country').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: 'engineer',
    });

    // Create engineer profile
    const profile = await EngineerProfile.create({
      user: user._id,
      specialization: req.body.specialization,
      title: req.body.title || `${req.body.specialization.replace('_', ' ')}`,
      bio: req.body.bio || '',
      licenseNumber: req.body.licenseNumber,
      yearsOfExperience: req.body.yearsOfExperience,
      education: req.body.education || [],
      skills: req.body.skills || [],
      softwareProficiency: req.body.softwareProficiency || [],
      pricingModel: req.body.pricingModel || 'fixed',
      hourlyRate: req.body.hourlyRate,
      fixedRateRange: req.body.fixedRateRange,
      perSqftRate: req.body.perSqftRate,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      remoteAvailable: req.body.remoteAvailable ?? true,
      languages: req.body.languages || ['English'],
    });

    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      profile: {
        id: profile._id,
        specialization: profile.specialization,
        verificationStatus: profile.verificationStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = user.getSignedJwtToken();

    // Get engineer profile if applicable
    let profile = null;
    if (user.role === 'engineer' || user.role === 'architect') {
      profile = await EngineerProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      profile: profile ? {
        id: profile._id,
        specialization: profile.specialization,
        verificationStatus: profile.verificationStatus,
        rating: profile.rating,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'engineer' || user.role === 'architect') {
      profile = await EngineerProfile.findOne({ user: user._id });
    }

    res.json({ success: true, user, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
