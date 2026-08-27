import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'プライバシー説明（公開前ドラフト）',
  description: 'Personality Code System の現在の実装に基づくプライバシー説明ドラフト。',
  robots: { index: false, follow: false, nocache: true }
};

export default function PrivacyDraftPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>PCS</Link>
        <span className={styles.status}>PRIVACY · PRE-LAUNCH DRAFT</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>IMPLEMENTATION-GROUNDED DISCLOSURE</p>
        <h1>プライバシー説明</h1>
        <p className={styles.lead}>
          現在のPersonality Code Systemが、匿名診断データをどのように保存・共有・削除する設計かを説明する公開前ドラフトです。
        </p>
        <div className={styles.notice}>
          このページは最終Privacy Policyではありません。法務・管轄、運営者連絡先、同意文言、
          production backup / retention / monitoringの実環境確認が完了するまで公開ポリシーとして確定しません。
        </div>
      </section>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2>01 — 診断データ</h2>
          <div className={styles.body}>
            <p>アカウント登録なしで診断を開始できます。private sessionのBearer token自体はデータベースへ保存せず、サーバ側ではhashで照合します。</p>
            <ul>
              <li>質問への回答</li>
              <li>算出したTrait Score</li>
              <li>version付きの非公開Result Snapshot</li>
              <li>診断モデル・コンテンツ・asset version情報</li>
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <h2>02 — 公開共有</h2>
          <div className={styles.body}>
            <p>診断完了だけでは結果を公開しません。本人が共有操作を行った場合だけ、private resultとは別のsanitized public snapshotを作成します。</p>
            <p>公開snapshotにはraw answers、Trait Vector、Extended Code、Response Quality、private session credentialを含めません。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>03 — Analytics</h2>
          <div className={styles.body}>
            <p>現在のproduct analyticsはfirst-party限定で、回答値や完全なTrait Vectorを送らないallowlist方式です。第三者への診断データexportは標準で無効です。</p>
            <p>client/server error telemetryもfree-formの例外内容ではなく、固定category/surfaceのみを扱います。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>04 — 自己削除</h2>
          <div className={styles.body}>
            <p>同一ブラウザがprivate session capabilityを保持している場合、private result画面から匿名診断データの自己削除を実行できます。</p>
            <p>削除時は派生public shareを先に削除し、その後session、answers、Trait Scores、private Result Snapshot、session-bound analyticsを削除してcookieも破棄します。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>05 — Retention</h2>
          <div className={styles.body}>
            <p>現在のengineering baselineでは、放棄session 30日、completed raw answers 90日、completed private result / Trait Scores / session metadata 180日を基準にしたdry-run-first cleanupを実装しています。</p>
            <p>これは最終的な法的保存期間の約束ではありません。production schedulerと法務レビューが一致している証拠が公開前に必要です。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>06 — Backup restore</h2>
          <div className={styles.body}>
            <p>古いbackupには、backup取得後に利用者が削除したデータが残っている可能性があります。そのためrestore成功だけではpublic trafficへ戻せない設計方針です。</p>
            <p>productionでは削除履歴のreplayまたは同等措置、retention cleanup、削除・失効済みshareが復活しない証拠が必要です。現在このproduction証拠は未完です。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>07 — Calibration</h2>
          <div className={styles.body}>
            <p>通常のproduct analyticsを心理測定のcalibration datasetとして流用しません。calibration collection/exportは明示的同意、目的、環境分離、retention、operator authorization等が確定するまで無効です。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>08 — 公開前に残る事項</h2>
          <div className={styles.body}>
            <ul>
              <li>最終法務・管轄レビュー</li>
              <li>運営者情報とprivacy/security問い合わせ窓口</li>
              <li>production retention schedulerとbackup provider挙動</li>
              <li>production log / monitoring / secret store / database権限の実環境確認</li>
              <li>必要な同意UIと文言</li>
            </ul>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <Link href="/">← Personality Code System</Link>
        <Link href="/terms">利用条件・診断上の制約ドラフト →</Link>
      </footer>
    </main>
  );
}
