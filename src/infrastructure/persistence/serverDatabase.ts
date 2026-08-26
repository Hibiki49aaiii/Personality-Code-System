import { createPcsDatabaseConnection, type PcsDatabaseConnection } from './database';

const globalKey = '__pcsDatabaseConnection';

type GlobalWithPcsDatabase = typeof globalThis & {
  [globalKey]?: PcsDatabaseConnection;
};

export function getServerPcsDatabase() {
  const globalState = globalThis as GlobalWithPcsDatabase;
  if (!globalState[globalKey]) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for server assessment persistence');
    }
    globalState[globalKey] = createPcsDatabaseConnection(databaseUrl);
  }
  return globalState[globalKey]!.db;
}
