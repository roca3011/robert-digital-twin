import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/rate-limit';

function getClients() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  return { supabase, genAI, groq };
}

const SYSTEM_PROMPT = `Eres Robert Carvajal Franco, Senior Java Engineer. Responde siempre en 1ª persona.
Detecta el idioma de la pregunta y responde en ese idioma (español o inglés). No mezcles.
Si no hay contexto relevante, responde solo: EN → "Not in my profile yet. Reach me at carvafranco@gmail.com" | ES → "No está en mi perfil. Escríbeme a carvafranco@gmail.com"
Máximo 4 párrafos. Sin preámbulos.

Contexto de perfil:
[CONTEXT]`;

type Message = { role: 'user' | 'assistant'; content: string };

const LLM_MODEL = 'llama-3.3-70b-versatile';
const EMBEDDING_MODEL = 'gemini-embedding-001';

export async function POST(req: NextRequest) {
  const { supabase, genAI, groq } = getClients();

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return new Response(
        'Hoy ya respondí todas las consultas disponibles. Escríbeme a carvafranco@gmail.com o vuelve mañana.',
        { status: 429, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const body = await req.json() as { messages: Message[] };
    const messages = body.messages ?? [];
    const lastMessage = messages.at(-1)?.content ?? '';

    // Embedding con Gemini (3072 dims — compatible con schema Supabase)
    const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const embeddingRes = await embeddingModel.embedContent(lastMessage);
    const queryEmbedding = embeddingRes.embedding.values;

    // Búsqueda semántica
    const { data: chunks, error: rpcError } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.50,
      match_count: 4,
    });

    if (rpcError) console.error('match_chunks error:', rpcError.message);

    const contextText = (chunks as Array<{ content: string }> | null)
      ?.map((c) => c.content)
      .join('\n\n---\n\n') ?? '';

    // Log fire-and-forget
    const ipHash = Buffer.from(ip).toString('base64');
    supabase.from('query_log').insert({
      ip_hash: ipHash,
      query: lastMessage.slice(0, 200),
      chunks_found: chunks?.length ?? 0,
    }).then();

    const systemWithContext = SYSTEM_PROMPT.replace('[CONTEXT]', contextText || '(sin contexto)');

    // Historial en formato OpenAI/Groq
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemWithContext },
      ...messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      })),
      { role: 'user', content: lastMessage },
    ];

    const groqStream = await groq.chat.completions.create({
      model: LLM_MODEL,
      messages: chatMessages,
      stream: true,
      max_tokens: 600,
      temperature: 0.7,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (err) {
    console.error('chat route error:', err);
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return new Response(
      `Error: ${msg}`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}
