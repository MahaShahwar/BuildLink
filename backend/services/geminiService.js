const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Parse project description using Gemini AI and generate cost estimate
 */
async function analyzeProjectWithAI(description, city = 'Lahore') {
  const prompt = `You are an expert construction cost estimator for Pakistan. Analyze this project description and return ONLY valid JSON (no markdown, no code fences, no extra text).

Project Description: "${description}"
City: "${city}"

Return this exact JSON structure:
{
  "parsedRequirements": {
    "structureType": "residential|commercial|industrial|renovation|interior",
    "purpose": "brief purpose description",
    "floors": number,
    "bedrooms": number,
    "bathrooms": number,
    "plotSize": { "value": number, "unit": "sqft|marla|kanal" },
    "builtUpArea": { "value": number, "unit": "sqft" },
    "style": "modern|traditional|luxury|minimalist|contemporary",
    "sustainability": ["list of green features if mentioned"],
    "specialFeatures": ["basement", "rooftop", "pool", "garden", "elevator", "parking", "solar", etc]
  },
  "estimatedCost": {
    "min": number_in_PKR,
    "max": number_in_PKR,
    "currency": "PKR",
    "breakdown": {
      "materials": number_in_PKR,
      "labor": number_in_PKR,
      "design": number_in_PKR,
      "permits": number_in_PKR,
      "contingency": number_in_PKR
    },
    "confidence": number_between_0_and_1,
    "assumptions": "brief text about what you assumed"
  },
  "recommendations": ["2-3 brief expert recommendations for the project"],
  "estimatedTimeline": {
    "designWeeks": number,
    "constructionMonths": number,
    "totalMonths": number
  }
}

Use current 2026 Pakistan construction rates for ${city}. Grey structure ~PKR 3000-4000/sqft, finished ~PKR 5000-7000/sqft, luxury ~PKR 8000-12000/sqft. If details are missing, make reasonable assumptions for a typical Pakistani residential project and note them.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text.trim();

    // Clean response — remove markdown fences if present
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * AI-powered engineer matching — score and explain why an engineer fits a project
 */
async function aiMatchEngineers(projectDetails, engineers) {
  if (!engineers.length) return [];

  const engineerSummaries = engineers.map((eng, i) => ({
    index: i,
    name: `${eng.user?.firstName || ''} ${eng.user?.lastName || ''}`.trim(),
    specialization: eng.specialization,
    experience: eng.yearsOfExperience,
    city: eng.city,
    rating: eng.rating,
    completedProjects: eng.completedProjects,
    software: eng.softwareProficiency,
    pricingModel: eng.pricingModel,
    hourlyRate: eng.hourlyRate,
    fixedRateRange: eng.fixedRateRange,
    remoteAvailable: eng.remoteAvailable,
    availability: eng.availability,
    responseTime: eng.responseTime,
    onTimeDeliveryRate: eng.onTimeDeliveryRate,
  }));

  const prompt = `You are an AI matching engine for a construction platform. Score and rank these engineers for the given project. Return ONLY valid JSON (no markdown, no code fences).

Project:
- Type: ${projectDetails.projectType || 'residential'}
- Description: ${projectDetails.description || 'N/A'}
- City: ${projectDetails.location?.city || 'Not specified'}
- Budget: ${projectDetails.budget?.min || 'N/A'} - ${projectDetails.budget?.max || 'N/A'} PKR

Engineers:
${JSON.stringify(engineerSummaries, null, 2)}

Return this JSON:
{
  "rankings": [
    {
      "index": engineer_index_number,
      "score": number_0_to_100,
      "matchReason": "1-2 sentence explanation of why this engineer is a good fit",
      "strengths": ["strength1", "strength2"],
      "concerns": ["concern1"] or []
    }
  ]
}

Rank by: specialization match (30%), location proximity (20%), experience (20%), rating (15%), availability & price (15%). Return top engineers sorted by score descending.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.rankings || [];
  } catch (error) {
    console.error('Gemini Match Error:', error.message);
    return [];
  }
}

/**
 * AI chat — answer construction-related questions
 */
async function askConstructionAI(question, projectContext = '') {
  const prompt = `You are BuildLink AI — a helpful construction advisor for Pakistan. Answer concisely and practically.

${projectContext ? `Project Context: ${projectContext}` : ''}

User Question: "${question}"

Keep your answer under 200 words. Focus on practical advice relevant to Pakistan's construction industry. Include cost estimates in PKR where relevant.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return { success: true, answer: response.text.trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * AI-powered floor plan generation — produces structured room layout data
 */
async function generateFloorPlan(requirements) {
  const {
    floors = 1, bedrooms = 3, bathrooms = 2,
    plotSize, plotUnit = 'marla', style = 'modern',
    specialFeatures = [], description = '',
    kitchens = 1, livingRooms = 1,
    amendments = '',
  } = requirements;

  // Convert plot to sqft for layout math
  const plotSqft = plotUnit === 'marla' ? (plotSize || 5) * 272.25
    : plotUnit === 'kanal' ? (plotSize || 1) * 5445
    : plotSize || 1500;

  // Usable footprint ~ 65% of plot (setbacks)
  const footprint = Math.round(plotSqft * 0.65);

  const prompt = `You are an expert Pakistani residential architect and AutoCAD specialist. Generate a detailed floor plan layout as ONLY valid JSON (no markdown, no code fences).

Project Requirements:
- Plot: ${plotSize || 5} ${plotUnit} (≈${Math.round(plotSqft)} sqft total, ≈${footprint} sqft buildable after setbacks)
- Floors: ${floors}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Kitchens: ${kitchens}
- Living/Drawing rooms: ${livingRooms}
- Style: ${style}
- Special features: ${specialFeatures.join(', ') || 'none'}
- Description: ${description || 'Standard residential house'}
${amendments ? `- AMENDMENTS: ${amendments}` : ''}

IMPORTANT LAYOUT RULES:
1. All rooms must fit within the buildable footprint (≈${footprint} sqft per floor)
2. Use a grid-based layout. The total plot should be represented as a rectangle.
3. For a typical 5 marla plot: width ≈ 25ft, depth ≈ 50ft. For 10 marla: width ≈ 35ft, depth ≈ 65ft. For 1 kanal: width ≈ 50ft, depth ≈ 90ft. Scale proportionally.
4. Each room needs x, y, width, height in FEET. x=0 y=0 is top-left corner.
5. Rooms should NOT overlap. Leave corridors/circulation space.
6. Front of house (y=0 side) typically has porch/entrance. Back has kitchen/utility.
7. Master bedroom should be largest bedroom.
8. Attach bathrooms to bedrooms where possible.
9. Include a staircase room if floors > 1.
10. Include car porch at front if plot allows.

Return this JSON structure:
{
  "plotDimensions": { "width": number_feet, "depth": number_feet },
  "totalArea": number_sqft,
  "floors": [
    {
      "floorNumber": 1,
      "label": "Ground Floor",
      "rooms": [
        {
          "id": "room_1",
          "name": "Master Bedroom",
          "type": "bedroom|bathroom|kitchen|living|dining|drawing|staircase|porch|garage|store|lobby|corridor|balcony|laundry|servant_quarter",
          "x": number_feet_from_left,
          "y": number_feet_from_top,
          "width": number_feet,
          "height": number_feet,
          "area": number_sqft,
          "features": ["attached bath", "walk-in closet"],
          "color": "hex_color_for_room_type"
        }
      ]
    }
  ],
  "designNotes": [
    "3-4 brief architecture notes about the design choices"
  ],
  "suggestions": [
    "2-3 improvement suggestions the client could consider"
  ]
}

Color guide: bedrooms=#E3F2FD, bathrooms=#E8F5E9, kitchen=#FFF3E0, living/drawing=#F3E5F5, dining=#FCE4EC, staircase=#ECEFF1, porch/garage=#F5F5F5, lobby/corridor=#FAFAFA, store=#EFEBE9, balcony=#E0F7FA, laundry=#F1F8E9, servant_quarter=#FBE9E7.

Make the layout practical and livable for a Pakistani family. Ensure proper ventilation and natural light by placing rooms along exterior walls.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini Floor Plan Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * AI-powered design amendment — modify an existing floor plan based on user feedback
 */
async function amendFloorPlan(currentPlan, amendment) {
  const prompt = `You are an expert Pakistani residential architect. A client wants to modify their existing floor plan.

Current Floor Plan:
${JSON.stringify(currentPlan, null, 2)}

Client's Requested Change:
"${amendment}"

Apply the requested changes to the floor plan. Keep rooms that aren't affected. Maintain proper layout rules:
- No overlapping rooms
- Rooms must fit within plot dimensions (${currentPlan.plotDimensions?.width}ft × ${currentPlan.plotDimensions?.depth}ft)
- Maintain corridors/circulation
- Keep the design practical

Return the COMPLETE updated floor plan in the EXACT same JSON structure as the input (with all floors, all rooms, plotDimensions, totalArea, designNotes, suggestions). Return ONLY valid JSON, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Gemini Amend Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { analyzeProjectWithAI, aiMatchEngineers, askConstructionAI, generateFloorPlan, amendFloorPlan };
