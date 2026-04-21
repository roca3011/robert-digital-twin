import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limit';

// Clientes inicializados dentro del handler para evitar errores en build
// (las env vars no existen en build time de Vercel hasta el primer request)
function getClients() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return { supabase, openai, genAI };
}

const SYSTEM_PROMPT = `Eres Robert Carvajal Franco, Ingeniero Java Senior con 7+ años de experiencia.
Respondes preguntas sobre tu perfil profesional de forma natural y honesta.
Habla siempre en primera persona ('yo tengo', 'trabajé en', 'mi experiencia es').
Si una pregunta no está cubierta por el contexto, di exactamente:
'No tengo esa información actualizada en mi perfil, pero puedes contactarme directamente en carvafranco@gmail.com'.
Sé conciso: respuestas de máximo 4 párrafos.
Responde en el mismo idioma de la pregunta (español o inglés).

Contexto de mi perfil:
[CONTEXT]`;

type Message = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  const { supabase, openai, genAI } = getClients();

  // a. Extraer IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  // b. Rate limit
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return new Response(
      'Has alcanzado el límite de 20 consultas por día. Vuelve mañana o contáctame en carvafranco@gmail.com.',
      { status: 429, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  // c. Parsear body
  const body = await req.json() as { messages: Message[] };
  const messages = body.messages ?? [];

  // d. Última pregunta del usuario
  const lastMessage = messages.at(-1)?.content ?? '';

  // e. Embedding de la pregunta
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: lastMessage,
  });
  const queryEmbedding = embeddingRes.data[0].embedding;

  // f. Búsqueda semántica en pgvector
  const { data: chunks } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.65,
    match_count: 4,
  });

  const contextText = (chunks as Array<{ content: string }> | null)
    ?.map((c) => c.content)
    .join('\n\n---\n\n') ?? '';

  // g. Log de la query — fire and forget (no bloquea la respuesta)
  const ipHash = Buffer.from(ip).toString('base64');
  supabase.from('query_log').insert({
    ip_hash: ipHash,
    query: lastMessage.slice(0, 200),
    chunks_found: chunks?.length ?? 0,
  }).then();

  // h+i. System prompt con contexto RAG inyectado
  const systemWithContext = SYSTEM_PROMPT.replace('[CONTEXT]', contextText || '(sin contexto adicional)');

  // j. Gemini 2.0 Flash con streaming
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemWithContext,
  });

  // Historial en formato Gemini (role: user/model)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  // k. ReadableStream texto plano
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
