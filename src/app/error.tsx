'use client';

import { useEffect } from 'react';
import { sendClientProductEvent } from './_analytics/client';

export default function ErrorBoundary({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void sendClientProductEvent('client_error', {
      category: 'unexpected-ui-error',
      surface: 'app'
    });
  }, []);

  return (
    <main>
      <section className="shell section" aria-labelledby="app-error-title">
        <p className="sectionIndex">ERROR</p>
        <h1 id="app-error-title">画面を表示できませんでした。</h1>
        <p>診断データやエラー内容そのものは分析イベントへ送信しません。</p>
        <button type="button" className="primaryButton" onClick={reset}>
          再試行
        </button>
      </section>
    </main>
  );
}
