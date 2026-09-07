const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Project = require('../models/Project');
const EngineerProfile = require('../models/EngineerProfile');
const { protect, authorize } = require('../middleware/auth');
const { analyzeProjectWithAI, aiMatchEngineers, askConstructionAI, analyzeProjectRisks, generateMaterialBreakdown, generateProjectTimeline, parseVoiceToProject } = require('../services/geminiService');
// Fallback to rule-based if Gemini fails
const { parseRequirements, estimateCost } = require('../services/nlpCostEstimator');

const router = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|dwg|dxf|svg|doc|docx|zip|rar/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype === 'application/octet-stream';
    cb(null, ext || mime);
  },
});

// @route   POST /api/projects/voice-to-project
// @desc    Parse voice/text description into structured project data
router.post('/voice-to-project', protect, authorize('customer'), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a longer description (at least 10 characters)' });
    }

    const result = await parseVoiceToProject(text.trim());
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

    // Mark as selected — engineer still needs to accept
    app.status = 'selected';
    await project.save();

    res.json({ success: true, message: 'Engineer selected! Waiting for engineer to accept.', data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/projects/:id/decline-application
// @desc    Customer declines an engineer's application
router.put('/:id/decline-application', protect, authorize('customer'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, customer: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { applicationId } = req.body;
    const app = project.applications.id(applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    app.status = 'declined';
    await project.save();

    res.json({ success: true, message: 'Application declined', data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/:id/invite-engineer
// @desc    Customer invites an engineer to their project
router.post('/:id/invite-engineer', protect, authorize('customer'), async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, customer: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.assignedEngineer) {
      return res.status(400).json({ success: false, message: 'Project already has an assigned engineer' });
    }

    const { engineerId, message } = req.body;
    if (!engineerId) return res.status(400).json({ success: false, message: 'Engineer ID is required' });

    // Check if engineer already has an application on this project
    const existing = project.applications.find(a => a.engineer.toString() === engineerId);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This engineer already has an application on this project' });
    }

    // Add as an invitation (using the applications array with a special status)
    project.applications.push({
      engineer: engineerId,
      coverLetter: message || 'Invited by project owner',
      status: 'pending',
      appliedAt: new Date(),
    });
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('customer', 'firstName lastName email')
      .populate({
        path: 'applications.engineer',
        populate: { path: 'user', select: 'firstName lastName email' },
      });

    res.json({ success: true, message: 'Engineer invited successfully!', data: updated });
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

// @route   GET /api/projects/:id/risk-analysis
// @desc    AI-powered risk analysis for a project
router.get('/:id/risk-analysis', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Return cached result if exists
    if (project.riskAnalysis && project.riskAnalysis.generatedAt) {
      return res.json({ success: true, data: project.riskAnalysis, cached: true });
    }

    const result = await analyzeProjectRisks(project);
    if (result.success) {
      // Cache the result on the project
      project.riskAnalysis = { ...result.data, generatedAt: new Date() };
      await project.save();
      res.json({ success: true, data: project.riskAnalysis });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id/material-breakdown
// @desc    AI-powered material breakdown for a project
router.get('/:id/material-breakdown', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Return cached result if exists
    if (project.materialBreakdown && project.materialBreakdown.generatedAt) {
      return res.json({ success: true, data: project.materialBreakdown, cached: true });
    }

    const result = await generateMaterialBreakdown(project);
    if (result.success) {
      project.materialBreakdown = { ...result.data, generatedAt: new Date() };
      await project.save();
      res.json({ success: true, data: project.materialBreakdown });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id/timeline
// @desc    AI-generated project timeline
router.get('/:id/timeline', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const forceRegenerate = req.query.regenerate === 'true';

    if (project.aiTimeline?.generatedAt && !forceRegenerate) {
      return res.json({ success: true, data: project.aiTimeline, cached: true });
    }

    const result = await generateProjectTimeline(project);
    if (result.success) {
      project.aiTimeline = { ...result.data, generatedAt: new Date() };
      // Auto-populate milestones from AI timeline (replace if regenerating)
      if (result.data.phases) {
        project.milestones = result.data.phases.flatMap(phase =>
          phase.milestones.map(m => ({
            title: m.title,
            description: m.description,
            status: 'pending',
            milestoneDeliverables: m.deliverables || [],
          }))
        );
      }
      await project.save();
      res.json({ success: true, data: project.aiTimeline });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/projects/:id/milestones/:milestoneId/status
// @desc    Update milestone status (engineer submits, customer approves)
router.put('/:id/milestones/:milestoneId/status', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    const { status, comment } = req.body;
    const isCustomer = req.user.id === project.customer.toString();
    const isEngineer = project.assignedEngineer && req.user.role === 'engineer';

    // Find milestone index for sequential check
    const milestoneIndex = project.milestones.findIndex(m => m._id.toString() === req.params.milestoneId);

    // === ENGINEER ACTIONS ===
    if (isEngineer && status === 'in_progress') {
      // Can only start if previous milestone is approved (sequential)
      if (milestone.status !== 'pending' && milestone.status !== 'revised') {
        return res.status(400).json({ success: false, message: 'Can only start pending or revised milestones' });
      }
      if (milestoneIndex > 0) {
        const prev = project.milestones[milestoneIndex - 1];
        if (prev.status !== 'approved' && prev.status !== 'paid') {
          return res.status(400).json({ success: false, message: 'Complete the previous milestone first' });
        }
      }
      milestone.status = 'in_progress';
      milestone.startedAt = new Date();
    }
    else if (isEngineer && status === 'submitted') {
      if (milestone.status !== 'in_progress') {
        return res.status(400).json({ success: false, message: 'Can only submit milestones that are in progress' });
      }
      milestone.status = 'submitted';
      milestone.submittedAt = new Date();
      if (comment) {
        if (!milestone.revisionHistory) milestone.revisionHistory = [];
        milestone.revisionHistory.push({ comment, by: 'engineer', at: new Date() });
      }
    }
    // === CUSTOMER ACTIONS ===
    else if (isCustomer && status === 'approved') {
      if (milestone.status !== 'submitted') {
        return res.status(400).json({ success: false, message: 'Can only approve submitted milestones' });
      }
      milestone.status = 'approved';
      milestone.approvedAt = new Date();

      // Auto-release escrow funds for this milestone
      if (project.escrow?.status === 'funded' || project.escrow?.status === 'partially_released') {
        const totalMilestones = project.milestones.length;
        const releaseAmount = Math.round(project.escrow.totalAmount / totalMilestones);
        project.escrow.releasedAmount = (project.escrow.releasedAmount || 0) + releaseAmount;
        const approvedCount = project.milestones.filter(m => m.status === 'approved').length;
        project.escrow.status = approvedCount >= totalMilestones ? 'fully_released' : 'partially_released';
        project.escrow.transactions.push({
          type: 'release',
          amount: releaseAmount,
          milestone: milestone.title,
          note: `Released for milestone: ${milestone.title}`,
          createdAt: new Date(),
        });
      }
    }
    else if (isCustomer && status === 'revised') {
      // Customer requests revision with comment
      if (milestone.status !== 'submitted') {
        return res.status(400).json({ success: false, message: 'Can only request revision on submitted milestones' });
      }
      if (!comment) {
        return res.status(400).json({ success: false, message: 'Please provide revision feedback' });
      }
      milestone.status = 'revised';
      milestone.revisionComment = comment;
      if (!milestone.revisionHistory) milestone.revisionHistory = [];
      milestone.revisionHistory.push({ comment, by: 'customer', at: new Date() });
    }
    else if (isCustomer && status === 'rejected') {
      if (milestone.status !== 'submitted') {
        return res.status(400).json({ success: false, message: 'Can only reject submitted milestones' });
      }
      milestone.status = 'rejected';
      if (comment) {
        milestone.revisionComment = comment;
        if (!milestone.revisionHistory) milestone.revisionHistory = [];
        milestone.revisionHistory.push({ comment, by: 'customer', at: new Date() });
      }
    }
    else {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    await project.save();
    res.json({ success: true, data: project.milestones, message: `Milestone ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/projects/:id/complete
// @desc    Mark project as completed
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isCustomer = req.user.id === project.customer.toString();
    if (!isCustomer) return res.status(403).json({ success: false, message: 'Only project owner can complete' });

    if (project.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Project must be in progress to complete' });
    }

    project.status = 'completed';
    project.completedAt = new Date();
    await project.save();
    res.json({ success: true, data: project, message: 'Project marked as completed!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/:id/rate
// @desc    Rate the other party after project completion
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedEngineer');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only rate after project completion' });
    }

    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    const isCustomer = req.user.id === project.customer.toString();

    if (isCustomer) {
      if (project.ratings?.customerToEngineer?.rating) {
        return res.status(400).json({ success: false, message: 'Already rated' });
      }
      if (!project.ratings) project.ratings = {};
      project.ratings.customerToEngineer = { rating, review, ratedAt: new Date() };

      // Update engineer's average rating (use findByIdAndUpdate to skip full validation)
      if (project.assignedEngineer) {
        const eng = project.assignedEngineer;
        const totalRatings = (eng.totalRatings || 0) + 1;
        const newRating = ((eng.rating || 0) * (totalRatings - 1) + rating) / totalRatings;
        const EngineerProfile = require('../models/EngineerProfile');
        await EngineerProfile.findByIdAndUpdate(eng._id, {
          $set: {
            rating: Math.round(newRating * 10) / 10,
            totalRatings,
            completedProjects: (eng.completedProjects || 0) + 1,
          }
        });
      }
    } else {
      if (project.ratings?.engineerToCustomer?.rating) {
        return res.status(400).json({ success: false, message: 'Already rated' });
      }
      if (!project.ratings) project.ratings = {};
      project.ratings.engineerToCustomer = { rating, review, ratedAt: new Date() };
    }

    await project.save();
    res.json({ success: true, message: 'Rating submitted!', data: project.ratings });
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

// ===================== MESSAGING =====================

// @route   GET /api/projects/:id/messages
// @desc    Get project messages
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('messages.sender', 'name role');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project.messages || [], rateFinalized: project.rateFinalized, agreedRate: project.agreedRate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/:id/messages
// @desc    Send a message in project chat
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    const senderRole = req.user.role === 'engineer' || req.user.role === 'architect' ? 'engineer' : 'customer';
    project.messages.push({ sender: req.user._id, senderRole, text: text.trim(), type: 'message' });
    await project.save();

    const populated = await Project.findById(project._id).populate('messages.sender', 'name role');
    res.json({ success: true, data: populated.messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/:id/propose-rate
// @desc    Propose a rate for the project
router.post('/:id/propose-rate', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.rateFinalized) return res.status(400).json({ success: false, message: 'Rate already finalized' });

    const { amount, rateType } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    const validTypes = ['hourly', 'weekly', 'monthly', 'fixed'];
    const type = validTypes.includes(rateType) ? rateType : 'fixed';
    const typeLabel = { hourly: '/hour', weekly: '/week', monthly: '/month', fixed: ' (Fixed)' };

    const senderRole = req.user.role === 'engineer' || req.user.role === 'architect' ? 'engineer' : 'customer';

    // Save the pending rate proposal on the project
    project.agreedRate = { amount, rateType: type, currency: 'PKR', proposedBy: req.user._id };

    // Add a rate_proposal message
    project.messages.push({
      sender: req.user._id,
      senderRole,
      text: `Proposed a rate of PKR ${amount.toLocaleString()}${typeLabel[type]}`,
      type: 'rate_proposal',
      rateProposal: { amount, currency: 'PKR', rateType: type },
    });
    await project.save();

    const populated = await Project.findById(project._id).populate('messages.sender', 'name role');
    res.json({ success: true, data: populated.messages, agreedRate: project.agreedRate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/:id/accept-rate
// @desc    Accept the proposed rate — finalizes the deal
router.post('/:id/accept-rate', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.rateFinalized) return res.status(400).json({ success: false, message: 'Rate already finalized' });
    if (!project.agreedRate?.amount) return res.status(400).json({ success: false, message: 'No rate proposed yet' });

    // Can't accept your own proposal
    if (project.agreedRate.proposedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot accept your own proposal. The other party must accept.' });
    }

    const senderRole = req.user.role === 'engineer' || req.user.role === 'architect' ? 'engineer' : 'customer';

    project.agreedRate.acceptedBy = req.user._id;
    project.agreedRate.finalizedAt = new Date();
    project.rateFinalized = true;
    project.status = 'in_progress';

    project.messages.push({
      sender: req.user._id,
      senderRole,
      text: `Accepted the rate of PKR ${project.agreedRate.amount.toLocaleString()}. Rate finalized! 🎉`,
      type: 'rate_accepted',
    });
    await project.save();

    const populated = await Project.findById(project._id).populate('messages.sender', 'name role');
    res.json({ success: true, data: populated.messages, rateFinalized: true, agreedRate: project.agreedRate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== ESCROW PAYMENT =====================

// @route   POST /api/projects/:id/fund-escrow
// @desc    Customer funds escrow with the agreed rate
router.post('/:id/fund-escrow', protect, authorize('customer'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!project.rateFinalized) return res.status(400).json({ success: false, message: 'Rate not finalized yet' });
    if (project.escrow?.status === 'funded' || project.escrow?.status === 'partially_released') {
      return res.status(400).json({ success: false, message: 'Escrow already funded' });
    }

    const amount = project.agreedRate.amount;
    const { paymentMethod } = req.body;

    project.escrow = {
      status: 'funded',
      totalAmount: amount,
      releasedAmount: 0,
      fundedAt: new Date(),
      paymentMethod: paymentMethod || 'bank_transfer',
      transactions: [{
        type: 'deposit',
        amount,
        note: `Escrow funded — ${project.agreedRate.rateType || 'fixed'} rate`,
        createdAt: new Date(),
      }],
    };

    // Add system message to chat
    project.messages.push({
      sender: req.user._id,
      senderRole: 'customer',
      text: `💰 Escrow funded with PKR ${amount.toLocaleString()}. The engineer can now start work securely.`,
      type: 'system',
    });

    await project.save();
    res.json({ success: true, data: project.escrow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id/escrow
// @desc    Get escrow details
router.get('/:id/escrow', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project.escrow || { status: 'unfunded', totalAmount: 0, releasedAmount: 0, transactions: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== DELIVERABLES / FILE UPLOADS =====================

// @route   POST /api/projects/:id/deliverables
// @desc    Upload a deliverable file
router.post('/:id/deliverables', protect, upload.single('file'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const deliverable = {
      filename: req.file.originalname,
      storedName: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      uploaderRole: req.user.role === 'engineer' || req.user.role === 'architect' ? 'engineer' : 'customer',
      uploaderName: req.user.name || `${req.user.firstName} ${req.user.lastName}`,
      milestone: req.body.milestone || '',
      description: req.body.description || '',
      uploadedAt: new Date(),
    };

    // Push directly and save to avoid Mongoose cast issues
    project.deliverables.push(deliverable);
    await project.save();

    res.json({ success: true, data: project.deliverables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id/deliverables
// @desc    Get all deliverables for a project
router.get('/:id/deliverables', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project.deliverables || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/projects/:id/deliverables/:deliverableId
// @desc    Delete a deliverable
router.delete('/:id/deliverables/:deliverableId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.deliverables = (project.deliverables || []).filter(
      d => d._id.toString() !== req.params.deliverableId
    );
    await project.save();
    res.json({ success: true, data: project.deliverables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
