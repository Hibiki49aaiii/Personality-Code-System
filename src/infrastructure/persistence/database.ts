import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as assessmentSchema from './schema';
import * as sharingSchema from './sharingSchema';
import * as analyticsSchema from './analyticsSchema';
import * as securitySchema from './securitySchema';
import * as calibrationSchema from './calibrationSchema';

const schema = {
  ...assessmentSchema,
  ...sharingSchema,
  ...analyticsSchema,
  ...securitySchema,
  ...calibrationSchema
};

export type PcsDatabase = PostgresJsDatabase<typeof schema>;

export interface PcsDatabaseConnection {
  db: PcsDatabase;
  close: () => Promise<void>;
}

export function createPcsDatabaseConnection(databaseUrl: string): PcsDatabaseConnection {
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error('A valid PostgreSQL DATABASE_URL is required');
  }

  const client = postgres(databaseUrl, {
    max: 10,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: true
  });

  return {
    db: drizzle(client, { schema }),
    close: async () => {
      await client.end({ timeout: 5 });
    }
  };
}
