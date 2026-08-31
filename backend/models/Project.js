const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedEngineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EngineerProfile',
  },

  // NLP-parsed project details
  title: { type: String, required: true },
  description: { type: String, required: true },
  nlpParsedRequirements: {
    structureType: String,    // residential, commercial, industrial
    purpose: String,
    floors: Number,
    bedrooms: Number,
    bathrooms: Number,
    plotSize: { value: Number, unit: String },
    builtUpArea: { value: Number, unit: String },
    style: String,            // modern, traditional, minimalist
    sustainability: [String],
    specialFeatures: [String],
  },
  projectType: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'renovation', 'interior'],
    required: true,
  },
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: { lat: Number, lng: Number },
  },

  // AI cost estimation
  estimatedCost: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'PKR' },
    breakdown: {
      materials: Number,
      labor: Number,
      design: Number,
      permits: Number,
      contingency: Number,
    },
    generatedAt: Date,
    confidence: Number, // 0-1
  },

  budget: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'PKR' },
  },
  timeline: {
    expectedStart: Date,
    expectedEnd: Date,
    durationWeeks: Number,
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'posted', 'matched', 'in_progress', 'review', 'completed', 'cancelled', 'disputed'],
    default: 'draft',
  },
  phase: {
    type: String,
    enum: ['design', 'construction', 'completed'],
    default: 'design',
  },

  // Milestones
  milestones: [{
    title: String,
    description: String,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'paid', 'disputed'],
      default: 'pending',
    },
    dueDate: Date,
    submittedAt: Date,
    approvedAt: Date,
    deliverables: [String],
  }],

  // Engineer applications
  applications: [{
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'EngineerProfile' },
    coverLetter: String,
    proposedBudget: Number,
    proposedTimeline: Number, // days
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'withdrawn'],
      default: 'pending',
    },
    appliedAt: { type: Date, default: Date.now },
  }],

  // AI-generated floor plans
  floorPlans: [{
    version: { type: Number, default: 1 },
    planData: { type: mongoose.Schema.Types.Mixed }, // full JSON from Gemini
    amendment: String, // what change was requested
    generatedAt: { type: Date, default: Date.now },
  }],
  activeFloorPlan: { type: mongoose.Schema.Types.Mixed }, // current plan

  // Files
  attachments: [{
    filename: String,
    path: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  // Escrow
  escrowTotal: { type: Number, default: 0 },
  escrowReleased: { type: Number, default: 0 },

  // AI matching data
  matchedEngineers: [{
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'EngineerProfile' },
    score: Number,
    matchedAt: Date,
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProjectSchema.index({ status: 1, 'location.city': 1 });

module.exports = mongoose.model('Project', ProjectSchema);
