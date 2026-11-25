import pg from 'pg';
pg.types.setTypeParser(pg.types.builtins.DATE,(value)=>value);
const globalDb = globalThis as unknown as { lexiPool?: pg.Pool };
export function pool(): pg.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing.');
  if (!globalDb.lexiPool) globalDb.lexiPool = new pg.Pool({ connectionString: url, max: 10 });
  return globalDb.lexiPool;
}
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, values: unknown[] = []): Promise<T[]> {
  const result = await pool().query<T>(sql, values);
  return result.rows;
}
