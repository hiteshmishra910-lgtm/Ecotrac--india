import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Increase JSON payload limit for camera photo uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper to initialize Google GenAI SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check and environment verification endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );

  const supabaseConfigured = Boolean(
    process.env.VITE_SUPABASE_URL &&
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY &&
    !process.env.VITE_SUPABASE_URL.includes('your-project') &&
    !process.env.VITE_SUPABASE_PUBLISHABLE_KEY.includes('your-supabase-anon-key')
  );

  res.json({
    status: 'ok',
    service: 'EcoTrack India Backend',
    timestamp: new Date().toISOString(),
    geminiConfigured,
    geminiModel: 'gemini-3.8-flash',
    supabaseConfigured,
    supabaseUrl: process.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing',
  });
});

// Waste classification endpoint using Google Gemini Vision
app.post('/api/scan/classify', async (req: Request, res: Response) => {
  try {
    const { image, mimeType } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Base64 image data is required in the request body.',
      });
    }

    // Check if Gemini API key is configured
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY_MISSING',
        message:
          'GEMINI_API_KEY environment variable is missing or empty. Please configure GEMINI_API_KEY in .env or the Secrets panel to enable real computer vision waste classification.',
      });
    }

    // Process base64 data (strip data URL prefix if present)
    let cleanBase64 = image;
    let detectedMime = mimeType || 'image/jpeg';

    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      detectedMime = matches[1];
      cleanBase64 = matches[2];
    }

    // Allowed image MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(detectedMime.toLowerCase())) {
      detectedMime = 'image/jpeg';
    }

    // Payload size guard (approx 15MB)
    if (cleanBase64.length > 20 * 1024 * 1024) {
      return res.status(413).json({
        error: 'IMAGE_TOO_LARGE',
        message: 'Uploaded image exceeds the 15MB size limit. Please capture a lower resolution photo.',
      });
    }

    const promptText = `
You are an expert municipal solid waste classification, recycling, and object detection computer vision model deployed for EcoTrack India (following Swachh Bharat Mission segregation guidelines).

Analyze this photograph carefully.
FIRST, determine if the image contains garbage/waste or if it is a human / non-waste scene:
A. If a PERSON / HUMAN is the primary subject (e.g., human face, selfie, person standing with no waste), return:
   - "category": "Unknown or uncertain"
   - "specificLabel": "Human detected"
   - "confidence": 0.95
   - "isUncertain": true
   - "recommendedDisposal": "Human detected. Please point camera directly at waste items or discarded packaging to classify."
   - "recyclingGuidelines": "Not Applicable"
   - "estimatedWeightKg": 0
   - "hazardWarning": "None"
   - "visualCues": "Person detected as primary subject. No waste identified."

B. If the image contains NO GARBAGE / NO WASTE AT ALL (e.g. empty floor, wall, sky, animal, car with no trash):
   - "category": "Unknown or uncertain"
   - "specificLabel": "No garbage detected"
   - "confidence": 0.90
   - "isUncertain": true
   - "recommendedDisposal": "No garbage detected in this photograph. Please capture a clear photo of waste or recyclable materials."
   - "recyclingGuidelines": "Not Applicable"
   - "estimatedWeightKg": 0
   - "hazardWarning": "None"
   - "visualCues": "No discarded objects or waste materials observed in frame."

C. Otherwise, if WASTE/DISCARDED MATERIAL IS PRESENT, classify strictly into EXACTLY ONE of the following valid categories:
1. "Plastic" (bottles, polythene bags, packaging, rigid containers, wraps)
2. "Metal" (beverage cans, tin food cans, aluminum foil, iron scrap, utensils)
3. "Paper and cardboard" (cardboard packaging, cartons, newspapers, books, office paper)
4. "Glass" (bottles, jars, broken glassware, window shards)
5. "Organic/wet waste" (kitchen food leftovers, fruit & vegetable peels, egg shells, garden waste)
6. "Electronic waste" (batteries, charger cords, printed circuit boards, phone parts, electronic gadgets)
7. "General/mixed waste" (multilayer packaging, sanitary waste, soiled diapers, sweepings, inert dust)
8. "Unknown or uncertain" (ONLY if the image is too blurry, unidentifiable, completely dark, or ambiguous)

Return a single JSON object with the following fields:
{
  "category": "one of the 8 categories above exactly",
  "specificLabel": "precise item name (e.g., '1L PET Plastic Water Bottle', 'Crushed Aluminum Beverage Can', 'Banana and Orange Peels', 'Corrugated Cardboard Box', 'Human detected', 'No garbage detected')",
  "confidence": <number between 0.05 and 0.99 indicating model confidence>,
  "isUncertain": <boolean: true if confidence is below 0.60, or if human/no garbage detected, false otherwise>,
  "recommendedDisposal": "concrete step-by-step instructions for collector or resident (e.g., 'Empty remaining liquids, rinse, crush flat to save space, and place into Blue Dry Waste bin')",
  "recyclingGuidelines": "Indian municipal segregation guideline (specify bin color: Blue Bin for Dry Recyclables, Green Bin for Wet Compostable Organic Waste, Red/Black Bin for Domestic Hazardous/E-waste)",
  "estimatedWeightKg": <estimated average weight in kilograms, e.g., 0.04 for bottle, 0.25 for can, 0.50 for box>,
  "hazardWarning": "brief note on any safety hazards for the sanitation collector (e.g., 'Sharp metal edge - use puncture resistant gloves', 'Potential biohazard', or 'None')",
  "visualCues": "brief 1-sentence note of what features in the image confirmed this classification"
}

Ensure the output is strictly valid JSON without preamble or explanation.
`;

    // Call Gemini Vision with model fallback support for high availability
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response.text) {
          responseText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} call failed or overloaded, attempting fallback:`, err?.message || err);
        // Continue to next candidate model
      }
    }

    if (!responseText) {
      throw lastError || new Error('The vision model returned an empty response. Please retry capturing the image.');
    }

    let parsedResult;
    try {
      // Clean up markdown code blocks if wrapped
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsedResult = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText, parseErr);
      return res.status(502).json({
        error: 'AI_PARSE_ERROR',
        message: 'Failed to parse AI classification result. Raw output: ' + responseText.slice(0, 150),
      });
    }

    // Validate category
    const validCategories = [
      'Plastic',
      'Metal',
      'Paper and cardboard',
      'Glass',
      'Organic/wet waste',
      'Electronic waste',
      'General/mixed waste',
      'Unknown or uncertain',
    ];

    if (!validCategories.includes(parsedResult.category)) {
      parsedResult.category = 'Unknown or uncertain';
      parsedResult.isUncertain = true;
    }

    // Check for Human detected or No garbage detected labels
    const isHumanOrNoGarbage =
      parsedResult.specificLabel === 'Human detected' ||
      parsedResult.specificLabel === 'No garbage detected';

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        category: parsedResult.category,
        specificLabel: parsedResult.specificLabel || parsedResult.category,
        confidence: typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 0.85,
        isUncertain: isHumanOrNoGarbage || Boolean(parsedResult.isUncertain),
        recommendedDisposal: parsedResult.recommendedDisposal || 'Segregate into designated collection bin.',
        recyclingGuidelines: parsedResult.recyclingGuidelines || 'Follow Swachh Bharat segregation norms.',
        estimatedWeightKg: typeof parsedResult.estimatedWeightKg === 'number' ? parsedResult.estimatedWeightKg : 0.1,
        hazardWarning: parsedResult.hazardWarning || 'None',
        visualCues: parsedResult.visualCues || 'Visual characteristics matched standard waste taxonomy.',
      },
    });
  } catch (error: any) {
    console.error('Error during waste classification:', error);
    return res.status(500).json({
      error: 'CLASSIFICATION_FAILED',
      message: error?.message || 'Internal server error while analyzing waste image with Gemini Vision.',
    });
  }
});

// Start Express server and mount Vite dev middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[EcoTrack India] Vite middleware attached in development mode.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoTrack India] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[EcoTrack India] Fatal server startup error:', err);
  process.exit(1);
});
