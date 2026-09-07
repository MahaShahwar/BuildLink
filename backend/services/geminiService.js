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
11. Every room MUST have at least one door. Doors connect rooms or lead to corridors.
12. Rooms along exterior walls MUST have windows (1-2 per exterior wall). Interior rooms have no windows.
13. Door "position" is 0-1 fraction along that wall (0.5=center). Door "width" is 2.5-3ft. Window "width" is 3-4ft.
14. Bathrooms have small windows (2ft). Bedrooms and living rooms have larger windows (4ft).

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
          "color": "hex_color_for_room_type",
          "doors": [
            { "wall": "bottom|top|left|right", "position": 0.5, "width": 3 }
          ],
          "windows": [
            { "wall": "bottom|top|left|right", "position": 0.5, "width": 3 }
          ]
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

/**
 * AI Risk Analysis — identify construction risks for a project
 */
async function analyzeProjectRisks(projectData) {
  const { title, description, location, nlpParsedRequirements: req, budget, estimatedCost } = projectData;

  const prompt = `You are BuildLink AI — an expert construction risk analyst for Pakistan.

Analyze this residential construction project and identify potential risks:

Project: "${title}"
Description: "${description}"
Location: ${location?.city || 'Unknown'}, ${location?.state || ''}, Pakistan
Plot Size: ${req?.plotSize?.value || 'Unknown'} ${req?.plotSize?.unit || 'marla'}
Floors: ${req?.floors || 'Unknown'}
Bedrooms: ${req?.bedrooms || 'Unknown'}, Bathrooms: ${req?.bathrooms || 'Unknown'}
Style: ${req?.style || 'Unknown'}
Special Features: ${req?.specialFeatures?.join(', ') || 'None'}
Budget: PKR ${budget?.min || 0} - ${budget?.max || 0}
AI Estimated Cost: PKR ${estimatedCost?.min || 0} - ${estimatedCost?.max || 0}

Return a JSON object with this exact structure:
{
  "overallRiskLevel": "low" | "medium" | "high",
  "budgetRisk": {
    "level": "low" | "medium" | "high",
    "message": "brief explanation about budget adequacy"
  },
  "risks": [
    {
      "category": "structural" | "environmental" | "regulatory" | "budget" | "timeline" | "material" | "design",
      "severity": "low" | "medium" | "high",
      "title": "Short risk title",
      "description": "2-3 sentence explanation specific to this project and location",
      "mitigation": "Practical recommendation to address this risk"
    }
  ],
  "recommendations": [
    "Top practical recommendation for this project"
  ]
}

Include 4-6 risks relevant to the specific location and project type in Pakistan.
Focus on practical, location-specific risks (e.g., water table in Lahore, seismic in Islamabad, heat in Karachi).
Return ONLY the JSON, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * AI Material Breakdown — generate detailed material list with quantities and costs
 */
async function generateMaterialBreakdown(projectData) {
  const { title, description, location, nlpParsedRequirements: req, estimatedCost } = projectData;

  const prompt = `You are BuildLink AI — a construction material estimator for Pakistan.

Generate a detailed material breakdown for this residential construction project:

Project: "${title}"
Description: "${description}"
Location: ${location?.city || 'Unknown'}, Pakistan
Plot Size: ${req?.plotSize?.value || 5} ${req?.plotSize?.unit || 'marla'}
Built-up Area: ${req?.builtUpArea?.value || 'Unknown'} ${req?.builtUpArea?.unit || 'sqft'}
Floors: ${req?.floors || 1}
Bedrooms: ${req?.bedrooms || 3}, Bathrooms: ${req?.bathrooms || 2}
Style: ${req?.style || 'modern'}
Special Features: ${req?.specialFeatures?.join(', ') || 'None'}
Estimated Cost: PKR ${estimatedCost?.min || 0} - ${estimatedCost?.max || 0}

Return a JSON object with this exact structure:
{
  "summary": "One line summary of material requirements",
  "categories": [
    {
      "name": "Category name (e.g., Structural, Electrical, Plumbing, Finishing)",
      "icon": "emoji",
      "items": [
        {
          "material": "Material name",
          "quantity": "Amount with unit (e.g., 350 bags, 12 tons)",
          "unitCost": "PKR per unit estimate",
          "totalCost": estimated total in PKR as number,
          "grade": "Recommended grade/brand type",
          "notes": "Brief note if relevant"
        }
      ],
      "subtotal": category total in PKR as number
    }
  ],
  "grandTotal": total of all materials in PKR as number,
  "tips": [
    "2-3 money-saving tips specific to this location and project"
  ]
}

Include these categories: Structural (cement, steel, bricks, sand, crush), Electrical, Plumbing, Finishing (tiles, paint, fixtures), Woodwork (doors, windows), and Miscellaneous.
Use current 2024-2025 Pakistan market rates. Be specific with quantities.
Return ONLY the JSON, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text.trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * AI Timeline Generation — create project milestones with durations
 */
function generateProjectTimeline(projectData) {
  const { location } = projectData;
  const reqs = projectData.requirements || {};
  const req = projectData.nlpParsedRequirements || {};
  const floors = reqs.floors || req.floors || 1;
  const city = location?.city || 'Unknown';
  const projectType = projectData.projectType || 'residential';

  // Scale duration based on project complexity
  const isLarge = floors >= 3 || projectType === 'commercial' || projectType === 'industrial';
  const scale = isLarge ? 1.5 : 1;

  const milestones = [
    {
      title: 'Site Analysis & Client Brief',
      description: `Site visit and survey of the ${reqs.plotSize || 'N/A'} ${reqs.plotUnit || 'marla'} plot in ${city}. Coordinate geotechnical soil testing, document existing site conditions, and finalize the client requirements brief for a ${floors}-floor ${projectType} project.`,
      durationDays: Math.round(7 * scale),
      deliverables: ['Site Visit Report', 'Geotechnical Soil Test Report', 'Client Requirements Document', 'Site Survey & Measurements'],
      costPercentage: 8,
    },
    {
      title: 'Conceptual Design',
      description: `Develop 2-3 initial design concepts with mood boards, preliminary sketches, and concept floor plan layouts. Present options to client for feedback and selection.`,
      durationDays: Math.round(10 * scale),
      deliverables: ['Design Concept Options (2-3)', 'Mood Boards', 'Preliminary Sketches', 'Concept Floor Plans'],
      costPercentage: 12,
    },
    {
      title: 'Detailed Architectural Drawings',
      description: `Prepare final architectural drawings based on the approved concept — detailed floor plans for all ${floors} floors, building elevations, cross-sections, and 3D rendered views.`,
      durationDays: Math.round(14 * scale),
      deliverables: ['Final Floor Plans (all floors)', 'Building Elevations', 'Cross-Section Drawings', '3D Renders & Visualizations'],
      costPercentage: 20,
    },
    {
      title: 'Structural Engineering Design',
      description: `Design the complete structural system — foundation type, beam/column layouts, slab designs, and load calculations suitable for the ${city} seismic zone and soil conditions.`,
      durationDays: Math.round(10 * scale),
      deliverables: ['Structural Drawings', 'Foundation Design', 'Beam & Column Layout', 'Load Calculation Report', 'Steel/Concrete Specifications'],
      costPercentage: 18,
    },
    {
      title: 'MEP Design',
      description: `Prepare mechanical, electrical, and plumbing design layouts — electrical wiring diagrams, plumbing supply & drainage plans, and HVAC system design if applicable.`,
      durationDays: Math.round(10 * scale),
      deliverables: ['Electrical Wiring Layout', 'Plumbing Layout (Supply & Drainage)', 'HVAC Design Drawings', 'Fire Safety Layout'],
      costPercentage: 15,
    },
    {
      title: 'Cost Estimation & BOQ',
      description: `Prepare a detailed bill of quantities with material specifications, vendor rate analysis, and a comprehensive cost breakdown report for the entire project.`,
      durationDays: Math.round(7 * scale),
      deliverables: ['Bill of Quantities (BOQ)', 'Material Specifications', 'Cost Breakdown Report', 'Vendor Rate Analysis'],
      costPercentage: 10,
    },
    {
      title: 'Regulatory Submission',
      description: `Compile and submit building permit application to ${city === 'Lahore' ? 'LDA' : city === 'Islamabad' ? 'CDA' : city === 'Multan' ? 'MDA' : 'local authority'}. Prepare NOC applications and all required documentation for approval.`,
      durationDays: Math.round(14 * scale),
      deliverables: ['Building Permit Application', 'NOC Application Documents', 'Authority Submission Package', 'Compliance Checklist'],
      costPercentage: 7,
    },
    {
      title: 'Final Design Package Handover',
      description: `Compile the complete design package — all approved architectural, structural, and MEP drawings with specifications. Deliver construction-ready documentation to client.`,
      durationDays: Math.round(5 * scale),
      deliverables: ['Complete Design Package', 'Construction-Ready Drawings', 'Specifications Document', 'Design Approval Certificate'],
      costPercentage: 10,
    },
  ];

  const totalDays = milestones.reduce((sum, m) => sum + m.durationDays, 0);
  const totalWeeks = Math.ceil(totalDays / 7);

  let currentWeek = 1;
  const phases = milestones.map((m, i) => {
    const durationWeeks = Math.ceil(m.durationDays / 7);
    const phase = {
      name: m.title,
      icon: ['📋', '🎨', '📐', '🏗️', '⚡', '💰', '📝', '📦'][i],
      durationWeeks,
      startWeek: currentWeek,
      milestones: [m],
    };
    currentWeek += durationWeeks;
    return phase;
  });

  return {
    success: true,
    data: {
      totalDurationWeeks: totalWeeks,
      phases,
      criticalPath: [
        'Client approval on conceptual design before detailed drawings',
        'Soil test results needed before structural design',
        `${city === 'Lahore' ? 'LDA' : city === 'Islamabad' ? 'CDA' : city === 'Multan' ? 'MDA' : 'Local authority'} approval timeline may vary`,
        'Structural design depends on finalized architectural drawings',
      ],
      designNotes: `Design timeline for a ${floors}-floor ${projectType} project in ${city}. All deliverables are documents and drawings — no physical construction is included.`,
    },
  };
}

/**
 * Voice/Text to Project — parse natural language (Urdu/English) into structured project data
 */
async function parseVoiceToProject(text) {
  const prompt = `You are BuildLink AI — a construction project assistant for Pakistan. The user has described their dream project in natural language (could be in Urdu, English, or a mix of both — Roman Urdu included). Parse their description and extract structured project data.

User's description: "${text}"

Return ONLY valid JSON with this exact structure (use English for all values):
{
  "title": "A short descriptive project title in English",
  "description": "A clean 1-2 sentence project description in English",
  "projectType": "residential" | "commercial" | "industrial" | "renovation" | "interior" | "other",
  "customProjectType": "only if projectType is other, describe it",
  "purpose": "family_home" | "rental_property" | "investment" | "personal_villa" | "office_space" | "retail_shop" | "warehouse" | "restaurant" | "showroom" | "factory" | "full_renovation" | "room_addition" | "kitchen_remodel" | "home_office" | "living_room" | "bedroom_design" | "kitchen_design" | "other",
  "location": {
    "city": "city name if mentioned, otherwise empty string",
    "state": "Punjab" | "Sindh" | "KPK" | "Balochistan" | "Islamabad" | "",
    "country": "Pakistan"
  },
  "floors": number (default 1),
  "rooms": number (default 3),
  "bathrooms": number (default 2),
  "plotSize": "number as string, e.g. '5' or '10'",
  "plotUnit": "marla" | "kanal" | "sqft" | "sqm",
  "style": "modern" | "traditional" | "contemporary" | "minimalist" | "islamic" | "colonial" | "mediterranean" | "farmhouse" | "",
  "budgetMin": number or null (in PKR),
  "budgetMax": number or null (in PKR),
  "features": ["feature IDs from this list: parking, garden, boundary_wall, servant_quarter, rooftop, solar_panels, rainwater_harvesting, smart_home, security_system, swimming_pool, home_theater, gym, elevator, basement, open_kitchen, store_room, laundry_room, balcony, terrace, walk_in_closet, double_height_ceiling, central_ac, water_filtration, backup_generator, intercom"],
  "customFeatures": ["any features mentioned that don't match the list above"],
  "structuralType": "rcc" | "steel" | "loadbearing",
  "timelineWeeks": number or null,
  "confidence": 0.0 to 1.0 (how confident you are in the parsing)
}

Rules:
- If something is not mentioned, use sensible defaults for Pakistan
- Convert Urdu numbers to digits (e.g. "تین" = 3, "پانچ" = 5)
- Convert budget mentions like "50 lakh" = 5000000, "1 crore" = 10000000, "20 lac" = 2000000
- "marla", "مرلہ", "kanal", "کنال" are plot units
- Understand Roman Urdu: "ghar" = house, "dukan" = shop, "plaza" = commercial, "kamray" = rooms, "manzil" = floor
- Return ONLY the JSON, no markdown fences`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    const responseText = response.text.trim();
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return { success: true, data: JSON.parse(cleaned) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { analyzeProjectWithAI, aiMatchEngineers, askConstructionAI, generateFloorPlan, amendFloorPlan, analyzeProjectRisks, generateMaterialBreakdown, generateProjectTimeline, parseVoiceToProject };
