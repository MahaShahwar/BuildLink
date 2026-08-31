/**
 * ML-based Engineer Matching Engine
 * Scores and ranks engineers based on project requirements
 * using weighted multi-factor scoring algorithm.
 */

const EngineerProfile = require('../models/EngineerProfile');

// Feature weights for matching score calculation
const WEIGHTS = {
  specializationMatch: 0.25,
  locationProximity: 0.15,
  experienceScore: 0.15,
  ratingScore: 0.15,
  availabilityScore: 0.10,
  priceScore: 0.10,
  responseTimeScore: 0.05,
  deliveryRateScore: 0.05,
};

/**
 * Calculate match score between a project and an engineer
 */
function calculateMatchScore(project, engineer) {
  let score = 0;

  // 1. Specialization match
  const specMap = {
    residential: ['architect', 'civil_engineer', 'autocad_specialist'],
    commercial: ['architect', 'structural_engineer', 'civil_engineer'],
    industrial: ['structural_engineer', 'civil_engineer'],
    renovation: ['architect', 'interior_designer'],
    interior: ['interior_designer', 'architect'],
  };
  const idealSpecs = specMap[project.projectType] || [];
  if (idealSpecs.includes(engineer.specialization)) {
    score += WEIGHTS.specializationMatch * (idealSpecs.indexOf(engineer.specialization) === 0 ? 1 : 0.7);
  }

  // 2. Location proximity
  if (project.location?.city?.toLowerCase() === engineer.city?.toLowerCase()) {
    score += WEIGHTS.locationProximity;
  } else if (engineer.remoteAvailable) {
    score += WEIGHTS.locationProximity * 0.6;
  }

  // 3. Experience score (diminishing returns after 15 years)
  const expScore = Math.min(engineer.yearsOfExperience / 15, 1);
  score += WEIGHTS.experienceScore * expScore;

  // 4. Rating score
  score += WEIGHTS.ratingScore * (engineer.rating / 5);

  // 5. Availability
  if (engineer.availability === 'available') score += WEIGHTS.availabilityScore;
  else if (engineer.availability === 'busy') score += WEIGHTS.availabilityScore * 0.3;

  // 6. Price competitiveness (lower is better, within budget)
  if (project.budget?.max && engineer.fixedRateRange?.max) {
    const priceRatio = 1 - (engineer.fixedRateRange.min / project.budget.max);
    score += WEIGHTS.priceScore * Math.max(0, Math.min(priceRatio, 1));
  } else {
    score += WEIGHTS.priceScore * 0.5; // neutral
  }

  // 7. Response time (lower is better, normalize against 48h)
  const responseScore = Math.max(0, 1 - engineer.responseTime / 48);
  score += WEIGHTS.responseTimeScore * responseScore;

  // 8. On-time delivery rate
  score += WEIGHTS.deliveryRateScore * (engineer.onTimeDeliveryRate / 100);

  return Math.round(score * 100);
}

/**
 * Find and rank matching engineers for a project
 */
async function findMatches(project, limit = 10) {
  // Pre-filter candidates from DB
  const candidates = await EngineerProfile.find({
    verificationStatus: 'verified',
    availability: { $ne: 'unavailable' },
  }).populate('user', 'firstName lastName email avatar');

  // Score each candidate
  const scored = candidates.map(eng => ({
    engineer: eng,
    score: calculateMatchScore(project, eng),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

module.exports = { calculateMatchScore, findMatches };
