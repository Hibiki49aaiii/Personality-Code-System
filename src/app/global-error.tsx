'use client';

import { useEffect } from 'react';
import { sendClientProductEvent } from './_analytics/client';

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void sendClientProductEvent('client_error', {
      category: 'unexpected-ui-error',
      surface: 'root'
    });
  }, []);

  return (
    <html lang="ja">
      <body>
        <main>
          <section aria-labelledby="root-error-title">
            <p>PERSONALITY CODE SYSTEM</p>
            <h1 id="root-error-title">ページを表示できませんでした。</h1>
            <p>再試行しても復旧しない場合は、時間を置いてアクセスしてください。</p>
            <button type="button" onClick={reset}>再試行</button>
          </section>
        </main>
      </body>
    </html>
  );
}
