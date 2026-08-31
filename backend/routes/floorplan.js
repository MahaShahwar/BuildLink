const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { generateFloorPlan, amendFloorPlan } = require('../services/geminiService');

const router = express.Router();

// @route   POST /api/floorplan/generate
// @desc    Generate AI floor plan from requirements (standalone, no project needed)
router.post('/generate', protect, async (req, res) => {
  try {
    const result = await generateFloorPlan(req.body);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/floorplan/project/:projectId/generate
// @desc    Generate floor plan for a specific project and save it
router.post('/project/:projectId/generate', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Build requirements from project data + any overrides from body
    const requirements = {
      floors: req.body.floors || project.nlpParsedRequirements?.floors || 1,
      bedrooms: req.body.bedrooms || project.nlpParsedRequirements?.bedrooms || 3,
      bathrooms: req.body.bathrooms || project.nlpParsedRequirements?.bathrooms || 2,
      plotSize: req.body.plotSize || project.nlpParsedRequirements?.plotSize?.value || 5,
      plotUnit: req.body.plotUnit || project.nlpParsedRequirements?.plotSize?.unit || 'marla',
      style: req.body.style || project.nlpParsedRequirements?.style || 'modern',
      specialFeatures: req.body.specialFeatures || project.nlpParsedRequirements?.specialFeatures || [],
      description: project.description,
      ...req.body, // allow override of anything
    };

    const result = await generateFloorPlan(requirements);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    // Save to project
    const version = (project.floorPlans?.length || 0) + 1;
    if (!project.floorPlans) project.floorPlans = [];
    project.floorPlans.push({
      version,
      planData: result.data,
      amendment: null,
      generatedAt: new Date(),
    });
    project.activeFloorPlan = result.data;
    await project.save();

    res.json({
      success: true,
      data: result.data,
      version,
      projectId: project._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/floorplan/project/:projectId/amend
// @desc    Amend existing floor plan with AI
router.post('/project/:projectId/amend', protect, async (req, res) => {
  try {
    const { amendment } = req.body;
    if (!amendment) return res.status(400).json({ success: false, message: 'Amendment text is required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!project.activeFloorPlan) {
      return res.status(400).json({ success: false, message: 'No floor plan to amend. Generate one first.' });
    }

    const result = await amendFloorPlan(project.activeFloorPlan, amendment);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    // Save new version
    const version = (project.floorPlans?.length || 0) + 1;
    project.floorPlans.push({
      version,
      planData: result.data,
      amendment,
      generatedAt: new Date(),
    });
    project.activeFloorPlan = result.data;
    await project.save();

    res.json({
      success: true,
      data: result.data,
      version,
      amendment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/floorplan/project/:projectId
// @desc    Get current floor plan + history
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .select('activeFloorPlan floorPlans title');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    res.json({
      success: true,
      data: {
        activePlan: project.activeFloorPlan,
        history: (project.floorPlans || []).map(fp => ({
          version: fp.version,
          amendment: fp.amendment,
          generatedAt: fp.generatedAt,
        })),
        projectTitle: project.title,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
