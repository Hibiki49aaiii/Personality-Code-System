"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./diagnosis.module.css";

type AssessmentItem = {
  id: string;
  position: number;
  text: string;
  required: boolean;
};

type AssessmentState = {
  status: "in_progress" | "completed";
  modelVersion: string;
  locale: string;
  expiresAt: string;
  responseScale: {
    version: string;
    values: ReadonlyArray<{ value: number; label: string }>;
  };
  items: AssessmentItem[];
  answers: Array<{ itemId: string; value: number }>;
};

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "診断データの取得に失敗しました。");
  }
  return data as T;
}

export default function DiagnosisPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentState | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        let response = await fetch("/api/assessment/session", { cache: "no-store" });
        if (response.status === 401 || response.status === 410) {
          response = await fetch("/api/assessment/session", { method: "POST", cache: "no-store" });
        }
        const state = await readJson<AssessmentState>(response);
        if (cancelled) return;
        if (state.status === "completed") {
          router.replace("/result");
          return;
        }

        const answerMap = Object.fromEntries(state.answers.map((answer) => [answer.itemId, answer.value]));
        const firstUnanswered = state.items.findIndex((item) => answerMap[item.id] === undefined);
        setAssessment(state);
        setAnswers(answerMap);
        setIndex(firstUnanswered >= 0 ? firstUnanswered : Math.max(0, state.items.length - 1));
      } catch (bootError) {
        if (!cancelled) {
          setError(bootError instanceof Error ? bootError.message : "診断を開始できませんでした。");
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (!assessment) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>PCS</Link>
          <div className={styles.headerMeta}><span>ASSESSMENT</span></div>
        </header>
        <section className={styles.content}>
          <p className={error ? styles.errorText : styles.loadingText}>
            {error ?? "診断モデルと保存済み回答を読み込んでいます…"}
          </p>
          {error ? <Link className={styles.nextButton} href="/">トップへ戻る</Link> : null}
        </section>
      </main>
    );
  }

  const item = assessment.items[index];
  if (!item) {
    return <main className={styles.page}><section className={styles.content}><p className={styles.errorText}>診断項目がありません。</p></section></main>;
  }

  const selected = answers[item.id];
  const progress = assessment.items.length === 0 ? 0 : (answeredCount / assessment.items.length) * 100;
  const allRequiredAnswered = assessment.items.every((entry) => !entry.required || answers[entry.id] !== undefined);
  const isLast = index === assessment.items.length - 1;

  async function choose(value: number) {
    if (saving || submitting) return;
    const previous = answers[item.id];
    setError(null);
    setAnswers((current) => ({ ...current, [item.id]: value }));
    setSaving(true);
    try {
      const response = await fetch("/api/assessment/answer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, value })
      });
      await readJson<{ ok: true }>(response);
    } catch (saveError) {
      setAnswers((current) => {
        const next = { ...current };
        if (previous === undefined) delete next[item.id];
        else next[item.id] = previous;
        return next;
      });
      setError(saveError instanceof Error ? saveError.message : "回答を保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (!allRequiredAnswered || saving || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/assessment/complete", { method: "POST" });
      await readJson<{ ok: true }>(response);
      router.push("/result");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "診断結果を確定できませんでした。");
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>PCS</Link>
        <div className={styles.headerMeta}>
          <span>REVIEWED DEVELOPMENT ASSESSMENT</span>
          <strong>{String(index + 1).padStart(3, "0")} / {String(assessment.items.length).padStart(3, "0")}</strong>
        </div>
      </header>

      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className={styles.content}>
        <div className={styles.questionMeta}>
          <span>QUESTION {String(item.position).padStart(3, "0")}</span>
          <span>{answeredCount} ANSWERED · {assessment.modelVersion}</span>
        </div>

        <h1>{item.text}</h1>

        <div className={styles.choices} role="radiogroup" aria-label="回答を選択" aria-busy={saving}>
          {assessment.responseScale.values.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              className={`${styles.choice} ${selected === value ? styles.selected : ""}`}
              onClick={() => void choose(value)}
              role="radio"
              aria-checked={selected === value}
              disabled={saving || submitting}
            >
              <span className={styles.choiceNumber}>{value}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0 || saving || submitting}
            className={styles.backButton}
          >
            ← 戻る
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!allRequiredAnswered || saving || submitting}
              className={styles.nextButton}
            >
              {submitting ? "確定中…" : allRequiredAnswered ? "診断結果を確定" : `未回答 ${assessment.items.length - answeredCount}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((current) => Math.min(assessment.items.length - 1, current + 1))}
              disabled={selected === undefined || saving || submitting}
              className={styles.nextButton}
            >
              次へ →
            </button>
          )}
        </div>

        {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
        <p className={styles.prototypeNote}>
          回答は匿名セッションに保存され、戻って変更できます。現在は検証用の reviewed model です。Core Code・Interaction・結果文は固定されたversionから決定論的に生成され、実行時AIは使用しません。
        </p>
      </section>
    </main>
  );
}
