const mongoose = require('mongoose');

const ConstructionBidSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Smart bid details
  totalCost: { type: Number, required: true },
  costBreakdown: {
    materials: Number,
    labor: Number,
    equipment: Number,
    overhead: Number,
    profit: Number,
  },
  laborPlan: {
    crewSize: Number,
    supervisors: Number,
    estimatedManHours: Number,
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    durationWeeks: Number,
  },
  milestones: [{
    title: String,
    cost: Number,
    durationDays: Number,
  }],
  proposal: String,
  attachments: [String],

  // AI vetting score
  vetScore: { type: Number, default: 0, min: 0, max: 100 },
  vetFactors: {
    priceCompetitiveness: Number,
    companyRating: Number,
    timelineRealism: Number,
    pastPerformance: Number,
  },

  status: {
    type: String,
    enum: ['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    default: 'submitted',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ConstructionBid', ConstructionBidSchema);
