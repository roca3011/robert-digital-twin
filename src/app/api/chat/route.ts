import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limit';

function getClients() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return { supabase, genAI };
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

const LLM_MODEL = 'gemma-3-4b-it';

export async function POST(req: NextRequest) {
  const { supabase, genAI } = getClients();

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

  // e. Embedding con gemini-embedding-001 (3072 dims, gratuito)
  const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const embeddingRes = await embeddingModel.embedContent(lastMessage);
  const queryEmbedding = embeddingRes.embedding.values;

  // f. Búsqueda semántica en pgvector
  const { data: chunks } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: 0.50,
    match_count: 4,
  });

  const contextText = (chunks as Array<{ content: string }> | null)
    ?.map((c) => c.content)
    .join('\n\n---\n\n') ?? '';

  // g. Log — fire and forget
  const ipHash = Buffer.from(ip).toString('base64');
  supabase.from('query_log').insert({
    ip_hash: ipHash,
    query: lastMessage.slice(0, 200),
    chunks_found: chunks?.length ?? 0,
  }).then();

  // h+i. System prompt inyectado como primer mensaje del historial
  // (gemma no soporta systemInstruction, pero todos los modelos soportan este patrón)
  const systemWithContext = SYSTEM_PROMPT.replace('[CONTEXT]', contextText || '(sin contexto adicional)');

  const systemTurn = [
    { role: 'user' as const,  parts: [{ text: systemWithContext }] },
    { role: 'model' as const, parts: [{ text: 'Entendido. Soy Robert Carvajal Franco y responderé preguntas sobre mi perfil profesional.' }] },
  ];

  const conversationHistory = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }));

  const model = genAI.getGenerativeModel({ model: LLM_MODEL });
  const chat = model.startChat({ history: [...systemTurn, ...conversationHistory] });
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
