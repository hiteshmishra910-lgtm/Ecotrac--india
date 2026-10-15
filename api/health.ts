import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  setHeader: (name: string, value: string | string[]) => this;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  return res.status(200).json({
    status: 'ok',
    environment: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    geminiConfigured,
    geminiModel: 'gemini-3.8-flash',
    supabaseConfigured,
  });
}
