/**
 * NLP Cost Estimation Service
 * Parses natural language project descriptions into structured requirements
 * and generates localized cost estimates.
 */

// Base rates per sq ft by region (PKR)
const REGIONAL_RATES = {
  lahore: { grey: 2800, finished: 4500, luxury: 7000 },
  karachi: { grey: 3000, finished: 4800, luxury: 7500 },
  islamabad: { grey: 3200, finished: 5200, luxury: 8000 },
  peshawar: { grey: 2500, finished: 4000, luxury: 6000 },
  default: { grey: 2800, finished: 4500, luxury: 7000 },
};

// NLP keyword mappings for parsing descriptions
const STRUCTURE_KEYWORDS = {
  residential: ['house', 'home', 'villa', 'bungalow', 'apartment', 'flat', 'residence', 'cottage'],
  commercial: ['office', 'shop', 'mall', 'plaza', 'commercial', 'warehouse', 'showroom'],
  industrial: ['factory', 'plant', 'workshop', 'industrial', 'manufacturing'],
};

const STYLE_KEYWORDS = {
  modern: ['modern', 'contemporary', 'minimalist', 'sleek'],
  traditional: ['traditional', 'classic', 'colonial', 'heritage'],
  luxury: ['luxury', 'premium', 'high-end', 'designer', 'lavish'],
};

const FEATURE_KEYWORDS = {
  basement: ['basement', 'cellar', 'underground'],
  rooftop: ['rooftop', 'terrace', 'roof garden'],
  pool: ['pool', 'swimming'],
  solar: ['solar', 'renewable', 'green energy'],
  garden: ['garden', 'lawn', 'landscaping'],
  elevator: ['elevator', 'lift'],
  parking: ['parking', 'garage', 'carport'],
};

/**
 * Parse a natural language description into structured requirements
 */
function parseRequirements(description) {
  const text = description.toLowerCase();
  const parsed = {
    structureType: 'residential',
    style: 'modern',
    specialFeatures: [],
    floors: 1,
    bedrooms: 3,
    bathrooms: 2,
  };

  // Detect structure type
  for (const [type, keywords] of Object.entries(STRUCTURE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      parsed.structureType = type;
      break;
    }
  }

  // Detect style
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      parsed.style = style;
      break;
    }
  }

  // Detect features
  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      parsed.specialFeatures.push(feature);
    }
  }

  // Extract numbers
  const floorMatch = text.match(/(\d+)\s*(?:floor|stor(?:e?y|ies))/);
  if (floorMatch) parsed.floors = parseInt(floorMatch[1]);

  const bedroomMatch = text.match(/(\d+)\s*(?:bed(?:room)?s?)/);
  if (bedroomMatch) parsed.bedrooms = parseInt(bedroomMatch[1]);

  const bathMatch = text.match(/(\d+)\s*(?:bath(?:room)?s?)/);
  if (bathMatch) parsed.bathrooms = parseInt(bathMatch[1]);

  const areaMatch = text.match(/(\d+)\s*(?:sq\.?\s*(?:ft|feet)|square\s*feet|marla|kanal)/);
  if (areaMatch) {
    const value = parseInt(areaMatch[1]);
    const unit = areaMatch[0].includes('kanal') ? 'kanal' : areaMatch[0].includes('marla') ? 'marla' : 'sqft';
    parsed.plotSize = { value, unit };
  }

  return parsed;
}

/**
 * Generate a localized cost estimate based on parsed requirements
 */
function estimateCost(parsedRequirements, city = 'default') {
  const rates = REGIONAL_RATES[city.toLowerCase()] || REGIONAL_RATES.default;

  // Determine quality tier from style
  let ratePerSqft = rates.finished;
  if (parsedRequirements.style === 'luxury') ratePerSqft = rates.luxury;
  if (parsedRequirements.style === 'traditional') ratePerSqft = rates.grey;

  // Estimate area if not provided
  let areaSqft = 1500; // default
  if (parsedRequirements.plotSize) {
    const { value, unit } = parsedRequirements.plotSize;
    if (unit === 'marla') areaSqft = value * 272;
    else if (unit === 'kanal') areaSqft = value * 5445;
    else areaSqft = value;
  } else {
    areaSqft = (parsedRequirements.bedrooms || 3) * 350 + 500;
  }

  const totalArea = areaSqft * (parsedRequirements.floors || 1);
  const baseCost = totalArea * ratePerSqft;

  // Feature cost additions
  let featureCost = 0;
  const features = parsedRequirements.specialFeatures || [];
  if (features.includes('basement')) featureCost += totalArea * 0.3 * ratePerSqft;
  if (features.includes('pool')) featureCost += 800000;
  if (features.includes('solar')) featureCost += 500000;
  if (features.includes('elevator')) featureCost += 1500000;
  if (features.includes('rooftop')) featureCost += 400000;

  const subtotal = baseCost + featureCost;

  const breakdown = {
    materials: Math.round(subtotal * 0.55),
    labor: Math.round(subtotal * 0.25),
    design: Math.round(subtotal * 0.08),
    permits: Math.round(subtotal * 0.02),
    contingency: Math.round(subtotal * 0.10),
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    min: Math.round(total * 0.85),
    max: Math.round(total * 1.15),
    currency: 'PKR',
    breakdown,
    generatedAt: new Date(),
    confidence: 0.75,
  };
}

module.exports = { parseRequirements, estimateCost };
