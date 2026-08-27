'use client';

import { useMemo, useState } from 'react';
import { sendClientProductEvent } from '../_analytics/client';
import styles from './share-controls.module.css';

interface ShareControlsProps {
  coreCode: string;
}

interface CreateShareResponse {
  shareUrl?: string;
  error?: string;
  message?: string;
}

export default function ShareControls({ coreCode }: ShareControlsProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'creating' | 'ready' | 'revoking' | 'revoked' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const shareText = useMemo(
    () => `Personality Code System — ${coreCode}`,
    [coreCode]
  );

  async function createShare() {
    void sendClientProductEvent('share_initiated');
    setState('creating');
    setMessage('');
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json() as CreateShareResponse;
      if (!response.ok || !data.shareUrl) {
        throw new Error(data.message || '共有リンクを作成できませんでした。');
      }
      setShareUrl(data.shareUrl);
      setState('ready');
      setMessage('公開用の共有リンクを作成しました。診断回答やTrait Vectorは公開されません。');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '共有リンクを作成できませんでした。');
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    void sendClientProductEvent('share_method_selected', { method: 'copy' });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage('共有リンクをコピーしました。');
    } catch {
      setMessage('コピーできませんでした。リンクを長押ししてコピーしてください。');
    }
  }

  async function nativeShare() {
    if (!shareUrl || typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      setMessage('このブラウザは端末共有に対応していません。X・LINE・リンクコピーを利用してください。');
      return;
    }
    void sendClientProductEvent('share_method_selected', { method: 'web-share' });
    try {
      await navigator.share({
        title: shareText,
        text: shareText,
        url: shareUrl
      });
    } catch {
      // User cancellation is not an application error.
    }
  }

  async function revokeShares() {
    setState('revoking');
    setMessage('');
    try {
      const response = await fetch('/api/share', {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json() as { revokedCount?: number; message?: string };
      if (!response.ok) throw new Error(data.message || '共有リンクを無効化できませんでした。');
      const count = data.revokedCount ?? 0;
      setShareUrl(null);
      setState('revoked');
      setMessage(`${count}件の公開共有リンクを無効化しました。`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '共有リンクを無効化できませんでした。');
    }
  }

  const shareToken = shareUrl ? shareUrl.split('/').filter(Boolean).at(-1) ?? null : null;
  const portraitCardHref = shareToken ? `/api/share/card/v0.1/${shareToken}` : null;
  const xHref = shareUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    : '#';
  const lineHref = shareUrl
    ? `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`
    : '#';

  return (
    <section className={styles.panel} aria-labelledby="share-heading">
      <div className={styles.heading}>
        <div>
          <p>SOCIAL EXPORT</p>
          <h2 id="share-heading">結果を共有</h2>
        </div>
        <span>OPT-IN PUBLIC SNAPSHOT</span>
      </div>

      <p className={styles.description}>
        診断結果は初期状態では非公開です。共有操作をしたときだけ、Core Codeと固定versionだけを含む
        公開Snapshotを別に作成します。147件の回答、Trait Vector、Extended Codeは共有しません。
      </p>

      {!shareUrl ? (
        <button
          className={styles.primary}
          type="button"
          onClick={createShare}
          disabled={state === 'creating' || state === 'revoking'}
        >
          {state === 'creating' ? '共有リンクを作成中…' : '公開共有リンクを作成'}
        </button>
      ) : (
        <div className={styles.ready}>
          <a className={styles.url} href={shareUrl} target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
          <div className={styles.actions}>
            <button type="button" onClick={nativeShare}>端末で共有</button>
            <a href={xHref} target="_blank" rel="noreferrer" onClick={() => void sendClientProductEvent('share_method_selected', { method: 'x' })}>X</a>
            <a href={lineHref} target="_blank" rel="noreferrer" onClick={() => void sendClientProductEvent('share_method_selected', { method: 'line' })}>LINE</a>
            <button type="button" onClick={copyLink}>リンクをコピー</button>
            {portraitCardHref && (
              <a href={portraitCardHref} download={`pcs-${coreCode}-portrait.png`} onClick={() => void sendClientProductEvent('share_method_selected', { method: 'portrait-card' })}>縦型画像</a>
            )}
          </div>
          <button
            className={styles.revoke}
            type="button"
            onClick={revokeShares}
            disabled={state === 'revoking'}
          >
            {state === 'revoking' ? '無効化中…' : 'この結果の公開リンクをすべて無効化'}
          </button>
        </div>
      )}

      <p className={styles.status} aria-live="polite">{message}</p>
    </section>
  );
}
