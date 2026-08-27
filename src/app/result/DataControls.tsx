'use client';

import { useState } from 'react';
import styles from './data-controls.module.css';

export default function DataControls() {
  const [state, setState] = useState<'idle' | 'confirming' | 'deleting' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function deleteData() {
    setState('deleting');
    setMessage('');
    try {
      const response = await fetch('/api/assessment/data', {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json() as {
        deleted?: boolean;
        deletedPublicShareCount?: number;
        message?: string;
      };
      if (!response.ok || data.deleted !== true) {
        throw new Error(data.message || '診断データを削除できませんでした。');
      }

      const shares = data.deletedPublicShareCount ?? 0;
      setMessage(`診断データを削除しました。公開共有 ${shares} 件も削除しました。`);
      window.location.assign('/');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '診断データを削除できませんでした。');
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="data-control-heading">
      <div className={styles.heading}>
        <div>
          <p>DATA CONTROL</p>
          <h2 id="data-control-heading">保存された診断データ</h2>
        </div>
        <span>OWNER CAPABILITY REQUIRED</span>
      </div>

      <p className={styles.description}>
        このブラウザのprivate sessionに紐づく回答、Trait Score、非公開Result Snapshot、
        session-bound analytics、そこから作成した公開共有Snapshotを削除できます。
        この操作は取り消せません。
      </p>

      {state !== 'confirming' && state !== 'deleting' ? (
        <button className={styles.deleteButton} type="button" onClick={() => { setState('confirming'); setMessage(''); }}>
          診断データを削除
        </button>
      ) : (
        <div className={styles.confirmation} role="group" aria-label="診断データ削除の確認">
          <strong>本当に削除しますか？</strong>
          <p>private resultと、この結果から作成した公開共有リンクは利用できなくなります。</p>
          <div className={styles.actions}>
            <button
              className={styles.confirmDelete}
              type="button"
              onClick={deleteData}
              disabled={state === 'deleting'}
            >
              {state === 'deleting' ? '削除中…' : '削除を確定'}
            </button>
            <button
              className={styles.cancel}
              type="button"
              onClick={() => { setState('idle'); setMessage(''); }}
              disabled={state === 'deleting'}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <p className={styles.status} aria-live="polite">{message}</p>
    </section>
  );
}
