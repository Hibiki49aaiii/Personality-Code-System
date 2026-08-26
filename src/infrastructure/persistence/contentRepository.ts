import { asc, eq } from 'drizzle-orm';
import type { ContentModule } from '../../domain/assessment/contentComposer';
import type { PcsDatabase } from './database';
import { contentModules, contentVersions } from './schema';

export class ContentRepositoryError extends Error {
  constructor(
    public readonly code: 'CONTENT_VERSION_NOT_FOUND' | 'CONTENT_VERSION_CORRUPT',
    message: string
  ) {
    super(message);
    this.name = 'ContentRepositoryError';
  }
}

export async function getContentModulesForVersion(
  db: PcsDatabase,
  contentVersion: string,
  locale: string
): Promise<ContentModule[]> {
  const [version] = await db
    .select({ locale: contentVersions.locale })
    .from(contentVersions)
    .where(eq(contentVersions.contentVersion, contentVersion))
    .limit(1);

  if (!version) {
    throw new ContentRepositoryError(
      'CONTENT_VERSION_NOT_FOUND',
      `Content version ${contentVersion} does not exist`
    );
  }
  if (version.locale !== locale) {
    throw new ContentRepositoryError(
      'CONTENT_VERSION_CORRUPT',
      `Content version ${contentVersion} locale mismatch`
    );
  }

  const rows = await db
    .select({
      moduleId: contentModules.moduleId,
      moduleJson: contentModules.moduleJson
    })
    .from(contentModules)
    .where(eq(contentModules.contentVersion, contentVersion))
    .orderBy(asc(contentModules.moduleId));

  if (rows.length === 0) {
    throw new ContentRepositoryError(
      'CONTENT_VERSION_CORRUPT',
      `Content version ${contentVersion} has no modules`
    );
  }

  return rows.map((row) => {
    const module = row.moduleJson as ContentModule;
    if (
      !module ||
      typeof module !== 'object' ||
      module.id !== row.moduleId ||
      module.content_version !== contentVersion ||
      module.locale !== locale
    ) {
      throw new ContentRepositoryError(
        'CONTENT_VERSION_CORRUPT',
        `Content module ${row.moduleId} metadata does not match its storage identity`
      );
    }
    return module;
  });
}
