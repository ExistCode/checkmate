import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { textModel, DEFAULT_ANALYSIS_MAX_TOKENS, DEFAULT_ANALYSIS_TEMPERATURE } from '@/lib/ai';
import { parseOriginTracing, computeCredibilityFromUrl } from '@/lib/analysis/parseOriginTracing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content: string | undefined = body?.content;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }
    // Lightweight parser pass first
    const parsed = parseOriginTracing(content);

    // AI summarization & classification to normalize and enrich fields
    interface AiOutput {
      originTracing?: {
        hypothesizedOrigin?: string | null;
        firstSeenDates?: Array<{ source: string; date?: string; url?: string }> | null;
        propagationPaths?: string[] | null;
      } | null;
      beliefDrivers?: Array<{ name?: string; description?: string }>;
      sources?: Array<{ title?: string; url?: string }>;
      verdict?: 'verified' | 'misleading' | 'false' | 'unverified' | 'satire';
      claim?: string;
    }
    const prompt = `You are an origin-tracing and misinformation analysis assistant.

Task: Read the following analysis text and produce a compact JSON with:
- originTracing: { hypothesizedOrigin: string | null, firstSeenDates: Array<{source: string, date?: string, url?: string}> | null, propagationPaths: string[] | null }
- beliefDrivers: Array<{ name: string, description: string }>
- sources: Array<{ title: string, url: string }>
- verdict: one of [verified, misleading, false, unverified, satire]
- claim: the current claim summarized as one sentence

Keep arrays small (<=6 items each). Prefer credible sources.

TEXT START\n${content}\nTEXT END

Return ONLY valid JSON.`;

    let ai: AiOutput | null = null;
    try {
      const { text } = await generateText({
        model: textModel(),
        system: 'Extract structured origin-tracing data for visualization. Be precise and grounded in the text.',
        prompt,
        maxTokens: DEFAULT_ANALYSIS_MAX_TOKENS,
        temperature: DEFAULT_ANALYSIS_TEMPERATURE,
      });
      // Best-effort JSON parse
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsedObj = JSON.parse(text.slice(start, end + 1));
        ai = parsedObj as AiOutput;
      }
    } catch {
      // Fall through to parsed-only response
    }

    // Merge AI output with parsed fallback
    const aiOT: AiOutput = (ai ?? {}) as AiOutput;
    const merged = {
      originTracing: {
        hypothesizedOrigin: aiOT.originTracing?.hypothesizedOrigin ?? parsed.originTracing.hypothesizedOrigin ?? undefined,
        firstSeenDates: aiOT.originTracing?.firstSeenDates ?? parsed.originTracing.firstSeenDates ?? undefined,
        propagationPaths: aiOT.originTracing?.propagationPaths ?? parsed.originTracing.propagationPaths ?? undefined,
      },
      beliefDrivers: Array.isArray(aiOT.beliefDrivers) && aiOT.beliefDrivers.length
        ? aiOT.beliefDrivers.map((b: { name?: string; description?: string }) => ({ name: String(b.name || ''), description: String(b.description || '') }))
        : parsed.beliefDrivers,
      sources: Array.isArray(aiOT.sources) && aiOT.sources.length
        ? aiOT.sources.map((s: { url?: string; title?: string }) => ({
            url: String(s.url || ''),
            title: String(s.title || s.url || 'Source'),
            credibility: s.url ? computeCredibilityFromUrl(String(s.url)) : 60,
          }))
        : parsed.sources,
      verdict: aiOT.verdict ?? parsed.verdict,
      content,
      claim: typeof aiOT.claim === 'string' ? aiOT.claim : undefined,
    };

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate origin tracing data' },
      { status: 500 }
    );
  }
}


