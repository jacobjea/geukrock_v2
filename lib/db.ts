import "server-only";

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __geukrockPool: Pool | undefined;
}

function getConnectionString() {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing POSTGRES_URL or DATABASE_URL.");
  }

  return connectionString;
}

function createPool() {
  return new Pool({
    connectionString: getConnectionString(),
    max: 10,
  });
}

export const db =
  globalThis.__geukrockPool ?? (globalThis.__geukrockPool = createPool());

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return db.query<T>(text, params);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
