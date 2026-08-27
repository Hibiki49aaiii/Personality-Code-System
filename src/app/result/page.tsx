import Link from "next/link";
import { cookies } from "next/headers";
import { getPrivateRenderedAssessmentResult } from "../../application/assessment/serverAssessmentService";
import { ASSESSMENT_SESSION_COOKIE } from "../../server/assessmentCookie";
import { withPcsDatabase } from "../../server/assessmentRuntime";
import { recordServerProductEventBestEffort } from "../../server/productAnalytics";
import ShareControls from "./ShareControls";
import { CuratedFallbackArtwork } from "../../components/illustration/CuratedFallbackArtwork";
import { DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION } from "../../domain/illustration/fallbackAsset";
import styles from "./result.module.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const domainLabels: Record<string, string> = {
  "core-identity": "コア",
  "trait-overview": "Trait Overview",
  thinking: "思考",
  emotion: "感情",
  action: "行動",
  "relationships-love": "関係・恋愛",
  work: "仕事",
  stress: "ストレス",
  communication: "コミュニケーション",
  "decision-making": "意思決定",
  learning: "学習",
  "leadership-derived": "リーダーシップ",
  risk: "リスク",
  creativity: "創造性",
  "hidden-strengths": "隠れた強み",
  adversarial: "敵対的分析",
  growth: "成長",
  "personal-manual": "取扱説明書"
};

export default async function ResultPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ASSESSMENT_SESSION_COOKIE)?.value;

  if (!token) return <MissingResult message="このブラウザに診断セッションがありません。" />;

  let result;
  try {
    result = await withPcsDatabase(async (db) => {
      const rendered = await getPrivateRenderedAssessmentResult(db, token);
      if (rendered) {
        await recordServerProductEventBestEffort(db, {
          name: "result_viewed",
          privateToken: token,
          properties: {}
        });
      }
      return rendered;
    });
  } catch (error) {
    console.error("Failed to render private assessment result", error);
    return <MissingResult message="診断結果を読み込めませんでした。セッションの有効期限またはサーバ状態を確認してください。" />;
  }

  if (!result) return <MissingResult message="まだ確定済みの診断結果がありません。" />;

  const snapshot = result.snapshot;
  const illustrationAssetVersion = "assets" in snapshot
    ? snapshot.assets.illustrationAssetVersion
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>PCS</Link>
        <div className={styles.headerMeta}><span>PRIVATE RESULT</span><strong>{snapshot.versions.assessmentModelVersion}</strong></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>DETERMINISTIC DEVELOPMENT RESULT</p>
          <h1>{snapshot.personalityCode.coreCode}</h1>
          <p className={styles.extendedCode}>{snapshot.personalityCode.extendedCode}</p>
          <p className={styles.lead}>
            これは開発中の固定モデルによる結果です。科学的妥当性や人口希少性を確定したものではありません。
            同一回答・同一versionでは同一スコア、コード、Interaction、Content Moduleが再現されます。
          </p>
        </div>
        {illustrationAssetVersion === DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION && (
          <figure className={styles.heroArtwork}>
            <CuratedFallbackArtwork />
            <figcaption>{illustrationAssetVersion}</figcaption>
          </figure>
        )}
      </section>

      <section className={styles.metaGrid} aria-label="結果メタデータ">
        <div><span>CORE BOUNDARY</span><strong>{snapshot.personalityCode.nearBoundaryCount} / 6 near</strong></div>
        <div><span>ACTIVE INTERACTIONS</span><strong>{snapshot.interactionActiveIds.length}</strong></div>
        <div><span>RESPONSE QUALITY</span><strong>{snapshot.responseQuality.flags.length ? snapshot.responseQuality.flags.join(", ") : "no flag"}</strong></div>
        <div><span>SNAPSHOT</span><strong>{snapshot.snapshotSchemaVersion}</strong></div>
      </section>

      <section className={styles.traits}>
        <div className={styles.sectionHeading}><span>01</span><h2>Trait Vector</h2></div>
        <div className={styles.traitGrid}>
          {snapshot.traitScores.map((trait) => (
            <article className={styles.traitCard} key={trait.traitId}>
              <div><strong>{trait.traitId}</strong><span>{(trait.scoreBp / 100).toFixed(2)}</span></div>
              <div
                className={styles.traitTrack}
                role="meter"
                aria-label={`${trait.traitId} Trait score`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={trait.scoreBp / 100}
                aria-valuetext={`${(trait.scoreBp / 100).toFixed(2)} / 100`}
              >
                <span aria-hidden="true" style={{ width: `${trait.scoreBp / 100}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.dossier}>
        <div className={styles.sectionHeading}><span>02</span><h2>Result Dossier</h2></div>
        <div className={styles.modules}>
          {result.sections.map((section) => (
            <article className={styles.module} key={section.domain}>
              <div className={styles.moduleMeta}><span>{domainLabels[section.domain] ?? section.domain}</span><small>{section.domain}</small></div>
              {section.modules.map((module) => (
                <div key={module.id} className={styles.moduleBody}><p>{module.text}</p><code>{module.id}</code></div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <ShareControls coreCode={snapshot.personalityCode.coreCode} />

      <section className={styles.versionBlock}>
        <h2>Reproducibility record</h2>
        <dl>
          {Object.entries(snapshot.versions).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          {illustrationAssetVersion && <div><dt>illustrationAssetVersion</dt><dd>{illustrationAssetVersion}</dd></div>}
          <div><dt>snapshotId</dt><dd>{result.snapshotId}</dd></div>
          <div><dt>createdAt</dt><dd>{result.createdAt}</dd></div>
        </dl>
      </section>
    </main>
  );
}

function MissingResult({ message }: { message: string }) {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/" className={styles.brand}>PCS</Link><div className={styles.headerMeta}><span>PRIVATE RESULT</span></div></header>
      <section className={styles.missing}><p>{message}</p><Link href="/diagnosis" className={styles.primaryLink}>診断へ進む</Link></section>
    </main>
  );
}
