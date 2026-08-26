import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicShareByToken } from '../../../infrastructure/persistence/publicShareRepository';
import { withPcsDatabase } from '../../../server/assessmentRuntime';
import { getSiteOrigin } from '../../../server/siteOrigin';
import styles from './share.module.css';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  let result = null;
  try {
    result = await withPcsDatabase((db) => getPublicShareByToken(db, token));
  } catch (error) {
    console.error('Failed to build public share metadata', error);
  }

  if (!result) {
    return {
      metadataBase: getSiteOrigin(),
      title: '共有リンクを利用できません | Personality Code System',
      description: 'このPCS共有リンクは無効化されたか、利用できません。',
      robots: { index: false, follow: false, nocache: true }
    };
  }

  const snapshot = result.snapshot;
  const displayName = snapshot.presentation.displayName;
  const title = displayName
    ? `${displayName} — ${snapshot.coreCode}`
    : `${snapshot.coreCode} — Personality Code System`;
  const description = snapshot.presentation.identitySentence
    ?? `Personality Code System の共有結果: ${snapshot.coreCode}`;
  const ogPath = `/api/share/og/v0.1/${token}`;

  return {
    metadataBase: getSiteOrigin(),
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ja_JP',
      images: [{ url: ogPath, width: 1200, height: 630, alt: `PCS ${snapshot.coreCode}` }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogPath]
    }
  };
}

export default async function PublicSharePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let result;
  try {
    result = await withPcsDatabase((db) => getPublicShareByToken(db, token));
  } catch (error) {
    console.error('Failed to render public share', error);
    result = null;
  }

  if (!result) {
    return (
      <main className={styles.page}>
        <header className={styles.header}><Link href="/" className={styles.brand}>PCS</Link><span>PUBLIC SHARE</span></header>
        <section className={styles.missing}>
          <p className={styles.eyebrow}>SHARE UNAVAILABLE</p>
          <h1>この共有リンクは利用できません</h1>
          <p>リンクが無効化されたか、有効な共有Snapshotが存在しません。</p>
          <Link href="/diagnosis" className={styles.button}>自分の診断を始める</Link>
        </section>
      </main>
    );
  }

  const snapshot = result.snapshot;
  const displayName = snapshot.presentation.displayName;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>PCS</Link>
        <span>PUBLIC SHARE · SANITIZED</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>PERSONALITY CODE SYSTEM</p>
        {displayName && <p className={styles.typeName}>{displayName}</p>}
        <h1>{snapshot.coreCode}</h1>
        {snapshot.presentation.identitySentence && (
          <p className={styles.identity}>{snapshot.presentation.identitySentence}</p>
        )}
        <p className={styles.note}>
          このページは本人が明示的に公開した共有Snapshotです。質問への回答、Trait Vector、
          Extended Code、Response Qualityなどの非公開診断データは含まれていません。
        </p>
      </section>

      <section className={styles.record}>
        <div><span>MODEL</span><strong>{snapshot.versions.assessmentModelVersion}</strong></div>
        <div><span>CODE SCHEMA</span><strong>{snapshot.versions.codeSchemaVersion}</strong></div>
        <div><span>CONTENT</span><strong>{snapshot.versions.contentVersion}</strong></div>
        <div><span>SHARE SCHEMA</span><strong>{snapshot.shareSchemaVersion}</strong></div>
      </section>

      <section className={styles.cta}>
        <p>同じ診断を自分でも受ける</p>
        <Link href="/diagnosis" className={styles.button}>診断を始める</Link>
      </section>
    </main>
  );
}
