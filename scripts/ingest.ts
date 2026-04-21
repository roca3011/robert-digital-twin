import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local no existe, continúa con variables de entorno del sistema
  }
}

loadEnv();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // service key para escritura
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chunking por párrafos — mantiene coherencia semántica vs chunking por tokens
function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length < 60) continue; // descarta títulos y líneas vacías

    if ((current + '\n\n' + trimmed).length > 800) {
      if (current) chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? current + '\n\n' + trimmed : trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536 dims, $0.02/M tokens
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

async function ingestFile(filePath: string, fileName: string): Promise<number> {
  const text = readFileSync(filePath, 'utf-8');
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    console.log(`  ${fileName}: 0 chunks (archivo vacío o solo títulos)`);
    return 0;
  }

  // Borra chunks anteriores del mismo archivo — permite re-indexar sin duplicados
  const { error: deleteError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('source_file', fileName);

  if (deleteError) throw new Error(`Error borrando chunks de ${fileName}: ${deleteError.message}`);

  // Genera embeddings en batch (máx 2048 inputs por llamada OpenAI)
  const embeddings = await embedTexts(chunks);

  const rows = chunks.map((content, i) => ({
    content,
    source_file: fileName,
    embedding: embeddings[i],
    metadata: { char_count: content.length },
  }));

  const { error: insertError } = await supabase.from('knowledge_chunks').insert(rows);
  if (insertError) throw new Error(`Error insertando chunks de ${fileName}: ${insertError.message}`);

  console.log(`  ${fileName}: ${chunks.length} chunks`);
  return chunks.length;
}

async function main() {
  console.log('\nIniciando ingesta de knowledge base...\n');

  // Validar variables de entorno
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Variables faltantes en .env.local: ${missing.join(', ')}`);
    process.exit(1);
  }

  const knowledgeDir = join(process.cwd(), 'knowledge');
  const files = readdirSync(knowledgeDir).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    console.error('❌ No hay archivos .md en la carpeta knowledge/');
    process.exit(1);
  }

  let total = 0;
  for (const file of files) {
    total += await ingestFile(join(knowledgeDir, file), file);
  }

  console.log(`\n✓ Total: ${total} chunks indexados en Supabase\n`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
