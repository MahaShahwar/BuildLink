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
  description: { type: String, default: '' },
  nlpParsedRequirements: {
    structureType: String,
    purpose: String,
    floors: Number,
    bedrooms: Number,
    bathrooms: Number,
    plotSize: { value: Number, unit: String },
    builtUpArea: { value: Number, unit: String },
    style: String,
    sustainability: [String],
    specialFeatures: [String],
  },
  requirements: {
    floors: Number,
    rooms: Number,
    bathrooms: Number,
    plotSize: String,
    plotUnit: String,
    structuralType: String,
    style: String,
    features: [String],
    customFeatures: [String],
  },
  purpose: String,
  projectType: {
    type: String,
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
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'revised', 'rejected', 'paid', 'disputed'],
      default: 'pending',
    },
    dueDate: Date,
    startedAt: Date,
    submittedAt: Date,
    approvedAt: Date,
    milestoneDeliverables: [String],
    revisionComment: String,
    revisionHistory: [{
      comment: String,
      by: { type: String, enum: ['customer', 'engineer'] },
      at: { type: Date, default: Date.now },
    }],
  }],

  // Engineer applications
  applications: [{
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'EngineerProfile' },
    coverLetter: String,
    proposedBudget: Number,
    proposedTimeline: Number, // days
    status: {
      type: String,
      enum: ['pending', 'selected', 'accepted', 'declined', 'withdrawn'],
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

  // Deliverables (engineer uploads)
  deliverables: [{
    filename: String,
    storedName: String,
    path: String,
    size: Number,
    fileType: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploaderRole: { type: String, enum: ['customer', 'engineer'] },
    uploaderName: String,
    milestone: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Escrow Payment System
  escrow: {
    status: { type: String, enum: ['unfunded', 'funded', 'partially_released', 'fully_released', 'refunded'], default: 'unfunded' },
    totalAmount: { type: Number, default: 0 },
    releasedAmount: { type: Number, default: 0 },
    fundedAt: Date,
    paymentMethod: { type: String, default: 'bank_transfer' },
    transactions: [{
      type: { type: String, enum: ['deposit', 'release', 'refund'] },
      amount: Number,
      milestone: String,
      note: String,
      createdAt: { type: Date, default: Date.now },
    }],
  },
  escrowTotal: { type: Number, default: 0 },
  escrowReleased: { type: Number, default: 0 },

  // AI Risk Analysis (cached)
  riskAnalysis: { type: mongoose.Schema.Types.Mixed },

  // AI Material Breakdown (cached)
  materialBreakdown: { type: mongoose.Schema.Types.Mixed },

  // AI matching data
  matchedEngineers: [{
    engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'EngineerProfile' },
    score: Number,
    matchedAt: Date,
  }],

  // AI-generated timeline (cached)
  aiTimeline: { type: mongoose.Schema.Types.Mixed },

  // Ratings & Reviews
  ratings: {
    customerToEngineer: {
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      ratedAt: Date,
    },
    engineerToCustomer: {
      rating: { type: Number, min: 1, max: 5 },
      review: String,
      ratedAt: Date,
    },
  },

  // Messages between customer & engineer
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['customer', 'engineer'] },
    text: String,
    type: { type: String, enum: ['message', 'rate_proposal', 'rate_accepted', 'system'], default: 'message' },
    rateProposal: { amount: Number, currency: { type: String, default: 'PKR' }, rateType: { type: String, enum: ['hourly', 'weekly', 'monthly', 'fixed'], default: 'fixed' } },
    sentAt: { type: Date, default: Date.now },
  }],

  // Agreed rate after negotiation
  agreedRate: {
    amount: Number,
    rateType: { type: String, enum: ['hourly', 'weekly', 'monthly', 'fixed'], default: 'fixed' },
    currency: { type: String, default: 'PKR' },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    finalizedAt: Date,
  },
  rateFinalized: { type: Boolean, default: false },

  completedAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProjectSchema.index({ status: 1, 'location.city': 1 });

module.exports = mongoose.model('Project', ProjectSchema);
