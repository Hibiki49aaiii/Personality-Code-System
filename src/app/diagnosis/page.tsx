"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./diagnosis.module.css";

const prototypeItems = [
  {
    id: "verification-01",
    domain: "THINK / VERIFICATION",
    statement: "重要な判断では、信頼している人の説明でも自分で根拠を確認したい。",
  },
  {
    id: "boundary-01",
    domain: "RELATION / BOUNDARY",
    statement: "親しい相手であっても、自分の時間や判断を当然のように要求されると抵抗を感じる。",
  },
  {
    id: "novelty-01",
    domain: "ACTION / NOVELTY",
    statement: "十分に理解したテーマより、まだ構造が分からないテーマに強く惹かれる。",
  },
] as const;

const choices = [
  [1, "まったく違う"],
  [2, "やや違う"],
  [3, "どちらでもない"],
  [4, "やや当てはまる"],
  [5, "非常に当てはまる"],
] as const;

export default function DiagnosisPrototype() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const item = prototypeItems[index];
  const selected = answers[item.id];

  const progress = useMemo(() => ((index + 1) / prototypeItems.length) * 100, [index]);

  function choose(value: number) {
    setAnswers((current) => ({ ...current, [item.id]: value }));
  }

  function next() {
    if (!selected) return;
    if (index < prototypeItems.length - 1) setIndex((current) => current + 1);
  }

  function previous() {
    if (index > 0) setIndex((current) => current - 1);
  }

  const finished = index === prototypeItems.length - 1 && Boolean(selected);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>PCS</Link>
        <div className={styles.headerMeta}>
          <span>ASSESSMENT PROTOTYPE</span>
          <strong>{String(index + 1).padStart(2, "0")} / {String(prototypeItems.length).padStart(2, "0")}</strong>
        </div>
      </header>

      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className={styles.content}>
        <div className={styles.questionMeta}>
          <span>{item.domain}</span>
          <span>PROTOTYPE ITEM</span>
        </div>

        <h1>{item.statement}</h1>

        <div className={styles.choices} role="radiogroup" aria-label="回答を選択">
          {choices.map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={`${styles.choice} ${selected === value ? styles.selected : ""}`}
              onClick={() => choose(value)}
              role="radio"
              aria-checked={selected === value}
            >
              <span className={styles.choiceNumber}>{value}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <button type="button" onClick={previous} disabled={index === 0} className={styles.backButton}>
            ← 戻る
          </button>
          {finished ? (
            <Link className={styles.nextButton} href="/">プロトタイプを終了</Link>
          ) : (
            <button type="button" onClick={next} disabled={!selected} className={styles.nextButton}>
              次へ →
            </button>
          )}
        </div>

        <p className={styles.prototypeNote}>
          現在の質問はUI検証用です。正式な診断項目・重み・コード生成規則は、心理測定モデルの確定後にバージョン管理して実装します。
        </p>
      </section>
    </main>
  );
}
