import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;
let useMemoryFallback = false;

const rawUrl = process.env.DATABASE_URL || '';
const isPlaceholder = rawUrl.includes('usuario:contrase') || rawUrl.includes('ep-xyz') || !rawUrl;

if (!isPlaceholder) {
  try {
    pool = new Pool({
      connectionString: rawUrl,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    });
  } catch (err) {
    console.warn('⚠️ No se pudo inicializar la conexión con Neon PostgreSQL. Usando almacenamiento local.');
    useMemoryFallback = true;
  }
} else {
  console.log('ℹ️ DATABASE_URL contiene valores de ejemplo. Usando almacenamiento en memoria activo (los datos persisten mientras el servidor esté activo).');
  useMemoryFallback = true;
}

export { pool, useMemoryFallback };

export async function testConnection(): Promise<{ connected: boolean; provider: string; message: string }> {
  if (pool && !useMemoryFallback) {
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT NOW() as current_time, version()');
      client.release();
      return {
        connected: true,
        provider: 'Neon PostgreSQL (Cloud)',
        message: `Conectado exitosamente a Neon. Hora del servidor: ${res.rows[0].current_time}`
      };
    } catch (err: any) {
      console.warn('⚠️ Error al conectar con Neon:', err.message);
      return {
        connected: false,
        provider: 'Almacenamiento Local / Fallback',
        message: `No se pudo conectar a Neon (${err.message}). La API responderá usando el almacén local.`
      };
    }
  }

  return {
    connected: true,
    provider: 'Almacenamiento Local / Modo Demo',
    message: 'Modo seguro activo. Los datos se procesan y analizan localmente hasta configurar tu URL real de Neon en .env.'
  };
}
