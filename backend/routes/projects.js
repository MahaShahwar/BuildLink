const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const EngineerProfile = require('../models/EngineerProfile');
const { protect, authorize } = require('../middleware/auth');
const { analyzeProjectWithAI, aiMatchEngineers, askConstructionAI } = require('../services/geminiService');
// Fallback to rule-based if Gemini fails
const { parseRequirements, estimateCost } = require('../services/nlpCostEstimator');

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a project with AI cost estimation
router.post('/', protect, authorize('customer'), [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('projectType').isIn(['residential', 'commercial', 'industrial', 'renovation', 'interior']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, projectType, location, budget, timeline, status } = req.body;
    const projectStatus = status === 'draft' ? 'draft' : 'posted';

    // Try Gemini AI first, fall back to rule-based
    let nlpParsed, costEstimate, aiRecommendations, aiTimeline;

    const aiResult = await analyzeProjectWithAI(description, location?.city);

    if (aiResult.success) {
      nlpParsed = aiResult.data.parsedRequirements;
      costEstimate = {
        ...aiResult.data.estimatedCost,
        generatedAt: new Date(),
      };
      aiRecommendations = aiResult.data.recommendations;
      aiTimeline = aiResult.data.estimatedTimeline;
    } else {
      // Fallback to rule-based
      nlpParsed = parseRequirements(description);
      costEstimate = estimateCost(nlpParsed, location?.city);
    }

    const project = await Project.create({
      customer: req.user.id,
      title,
      description,
      projectType,
      nlpParsedRequirements: nlpParsed,
      estimatedCost: costEstimate,
      location,
      budget,
      timeline,
      status: projectStatus,
    });

    res.status(201).json({
      success: true,
      data: project,
      aiPowered: aiResult.success,
      recommendations: aiRecommendations || [],
      estimatedTimeline: aiTimeline || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/my
// @desc    Get customer's own projects
router.get('/my', protect, async (req, res) => {
  try {
    const projects = await Project.find({ customer: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project with populated applications
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('applications.engineer', 'user specialization title rating yearsOfExperience city')
      .populate('assignedEngineer', 'user specialization title rating yearsOfExperience city');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Deep populate engineer's user info
    if (project.applications?.length > 0) {
      await Project.populate(project, {
        path: 'applications.engineer.user',
        select: 'firstName lastName email',
        model: 'User',
      });
    }
    if (project.assignedEngineer) {
      await Project.populate(project, {
        path: 'assignedEngineer.user',
        select: 'firstName lastName email',
        model: 'User',
      });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/projects/:id/status
// @desc    Update project status (draft -> posted, etc.)
router.put('/:id/status', protect, authorize('customer'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, customer: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { status } = req.body;
    const allowed = { draft: ['posted', 'cancelled'], posted: ['cancelled'] };
    if (!allowed[project.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot change from ${project.status} to ${status}` });
    }

    project.status = status;
    await project.save();
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/projects/:id/select-engineer
// @desc    Customer selects/accepts an engineer's application
router.put('/:id/select-engineer', protect, authorize('customer'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, customer: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { applicationId } = req.body;
    const app = project.applications.id(applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    // Accept this application, decline others
    project.applications.forEach(a => {
      a.status = a._id.toString() === applicationId ? 'accepted' : 'declined';
    });
    project.assignedEngineer = app.engineer;
    project.status = 'in_progress';
    await project.save();

    res.json({ success: true, message: 'Engineer selected!', data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id/match-engineers
// @desc    Get AI-matched engineers for a project
router.get('/:id/match-engineers', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get all verified engineers
    const engineers = await EngineerProfile.find({
      verificationStatus: 'verified',
      availability: { $ne: 'unavailable' },
    }).populate('user', 'firstName lastName email avatar');

    // Use Gemini AI for matching
    const aiRankings = await aiMatchEngineers(project, engineers);

    let matches;
    if (aiRankings.length > 0) {
      matches = aiRankings.map(rank => ({
        engineer: engineers[rank.index],
        score: rank.score,
        matchReason: rank.matchReason,
        strengths: rank.strengths,
        concerns: rank.concerns,
      })).filter(m => m.engineer); // filter invalid indices
    } else {
      // Fallback: simple score-based sort
      matches = engineers.map(eng => ({
        engineer: eng,
        score: Math.round(eng.rating * 20),
        matchReason: 'Matched based on availability and rating.',
        strengths: [eng.specialization],
        concerns: [],
      })).sort((a, b) => b.score - a.score).slice(0, 10);
    }

    // Save matched engineers to project
    project.matchedEngineers = matches.map(m => ({
      engineer: m.engineer._id,
      score: m.score,
      matchedAt: new Date(),
    }));
    await project.save();

    res.json({ success: true, data: matches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/estimate
// @desc    Quick AI cost estimate (no auth required)
router.post('/estimate', [
  body('description').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { description, city } = req.body;

    // Try Gemini AI
    const aiResult = await analyzeProjectWithAI(description, city);

    if (aiResult.success) {
      res.json({
        success: true,
        aiPowered: true,
        parsedRequirements: aiResult.data.parsedRequirements,
        estimate: aiResult.data.estimatedCost,
        recommendations: aiResult.data.recommendations,
        estimatedTimeline: aiResult.data.estimatedTimeline,
      });
    } else {
      // Fallback to rule-based
      const parsed = parseRequirements(description);
      const estimate = estimateCost(parsed, city);
      res.json({
        success: true,
        aiPowered: false,
        parsedRequirements: parsed,
        estimate,
        recommendations: [],
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/ask-ai
// @desc    Ask construction AI a question
router.post('/ask-ai', [
  body('question').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { question, projectContext } = req.body;
    const result = await askConstructionAI(question, projectContext);

    if (result.success) {
      res.json({ success: true, answer: result.answer });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
