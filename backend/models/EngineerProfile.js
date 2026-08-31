const mongoose = require('mongoose');

const EngineerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Professional info
  specialization: {
    type: String,
    enum: [
      'civil_engineer',
      'structural_engineer',
      'architect',
      'interior_designer',
      'autocad_specialist',
      'geotechnical_engineer',
      'environmental_engineer',
    ],
    required: [true, 'Specialization is required'],
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  bio: {
    type: String,
    maxlength: 1000,
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
  },
  licenseDocument: {
    type: String, // file path
    default: '',
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: 0,
    max: 60,
  },
  education: [{
    degree: String,
    institution: String,
    year: Number,
  }],
  certifications: [{
    name: String,
    issuingBody: String,
    year: Number,
    document: String,
  }],

  // Skills & software
  skills: [{ type: String }],
  softwareProficiency: [{
    type: String,
    enum: [
      'AutoCAD', 'Revit', 'SketchUp', 'ETABS', 'SAP2000',
      'STAAD.Pro', 'SolidWorks', 'Rhino', '3ds Max',
      'Lumion', 'ArchiCAD', 'Civil 3D', 'Tekla', 'SAFE',
    ],
  }],

  // Pricing
  pricingModel: {
    type: String,
    enum: ['fixed', 'hourly', 'per_sqft'],
    default: 'fixed',
  },
  hourlyRate: { type: Number, min: 0 },
  fixedRateRange: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
  },
  perSqftRate: { type: Number, min: 0 },

  // Location & availability
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  serviceRadius: { type: Number, default: 50 }, // km
  remoteAvailable: { type: Boolean, default: true },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available',
  },
  turnaroundDays: { type: Number, default: 14 },
  languages: [{ type: String }],

  // Portfolio
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    projectType: String,
    completionYear: Number,
  }],

  // AI matching metadata
  matchScore: { type: Number, default: 0 },
  completedProjects: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 }, // avg hours
  onTimeDeliveryRate: { type: Number, default: 100 }, // percentage

  // Verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

EngineerProfileSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

// Index for AI matching queries
EngineerProfileSchema.index({ specialization: 1, city: 1, availability: 1, rating: -1 });
EngineerProfileSchema.index({ matchScore: -1 });

module.exports = mongoose.model('EngineerProfile', EngineerProfileSchema);
