import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: '利用条件・診断上の制約（公開前ドラフト）',
  description: 'Personality Code System の現在の開発状態と診断上の制約に関する公開前ドラフト。',
  robots: { index: false, follow: false, nocache: true }
};

export default function TermsDraftPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>PCS</Link>
        <span className={styles.status}>TERMS / LIMITATIONS · PRE-LAUNCH DRAFT</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>SERVICE & DIAGNOSTIC LIMITATIONS</p>
        <h1>利用条件・診断上の制約</h1>
        <p className={styles.lead}>
          現在の開発版PCSをどのように解釈すべきかを、実装とmodel statusに合わせて明示するドラフトです。
        </p>
        <div className={styles.notice}>
          このページは最終Terms of Serviceではありません。公開前に運営者情報、適用条件、
          法務レビュー等を確定します。
        </div>
      </section>

      <div className={styles.sections}>
        <section className={styles.section}>
          <h2>01 — 開発状態</h2>
          <div className={styles.body}>
            <p>現在のC01D Core Codeとassessment-dev-v0.3はdevelopment / beta段階です。C01Dは <code>public_use=false</code> で、production/public activation gateも閉じています。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>02 — 医療・臨床用途ではない</h2>
          <div className={styles.body}>
            <p>PCSは医療・臨床診断ではありません。精神疾患、発達特性その他の医学的状態を診断するためのものとして扱いません。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>03 — 妥当性の主張範囲</h2>
          <div className={styles.body}>
            <p>同一回答・同一versionから同一score/code/contentを再現するdeterministic engineeringは実装されていますが、それは心理測定としての科学的妥当性を意味しません。</p>
            <p>Phase 5のcalibration / statistical reviewが完了するまで「科学的に検証済み」「高精度」等の主張を行いません。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>04 — 64 codeについて</h2>
          <div className={styles.body}>
            <p>現在の6 binary axesから64通りのdevelopment codeが到達可能ですが、64種類の自然な人格類型が実証されたという意味ではありません。</p>
            <p>人口割合・希少性も理論上の組合せ数から推定しません。将来表示する場合も、model/sample/time/scopeを限定した実測distributionだけを対象にします。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>05 — AI runtime</h2>
          <div className={styles.body}>
            <p>診断score、code、result module selection、share snapshotのruntime生成にLLMや生成AI APIを必要としません。versioned deterministic rules/assetsを使用します。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>06 — 結果の扱い</h2>
          <div className={styles.body}>
            <p>結果は傾向を記述するための開発中のmodel outputであり、能力・価値・道徳性・将来を決定する判定として扱いません。Response Qualityも嘘発見器ではありません。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>07 — Versioning</h2>
          <div className={styles.body}>
            <p>item、scoring、Core/Extended Code、Interaction、content、assetはversionを分離します。意味の変更を既存versionへ上書きせず、historical resultが元versionへ結び付く設計を維持します。</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>08 — 公開前に残る事項</h2>
          <div className={styles.body}>
            <p>最終的な利用条件、運営者情報、問い合わせ先、適用範囲その他の法的条項は法務レビュー後に確定します。このドラフトを最終契約条件として扱いません。</p>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <Link href="/">← Personality Code System</Link>
        <Link href="/privacy">プライバシー説明ドラフト →</Link>
      </footer>
    </main>
  );
}
