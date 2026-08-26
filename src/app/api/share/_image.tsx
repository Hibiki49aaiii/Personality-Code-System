import { ImageResponse } from 'next/og';
import type { ShareSnapshotV01 } from '../../../domain/sharing/shareSnapshot';

export const SHARE_OG_TEMPLATE_VERSION = 'share-og-v0.1-dev';
export const SHARE_PORTRAIT_TEMPLATE_VERSION = 'share-portrait-v0.1-dev';

type ShareImageKind = 'og' | 'portrait';

function dimensions(kind: ShareImageKind) {
  return kind === 'og'
    ? { width: 1200, height: 630 }
    : { width: 1080, height: 1350 };
}

export function renderShareImage(snapshot: ShareSnapshotV01, kind: ShareImageKind): ImageResponse {
  const { width, height } = dimensions(kind);
  const isPortrait = kind === 'portrait';
  const templateVersion = isPortrait ? SHARE_PORTRAIT_TEMPLATE_VERSION : SHARE_OG_TEMPLATE_VERSION;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f1f0e9',
          color: '#1c2521',
          padding: isPortrait ? '76px 70px' : '54px 64px',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: isPortrait ? 38 : 28, fontWeight: 800, letterSpacing: '0.08em' }}>PCS</div>
          <div style={{ fontSize: isPortrait ? 21 : 17, letterSpacing: '0.12em', color: '#65706a' }}>
            PUBLIC SHARE
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {snapshot.presentation.displayName ? (
            <div style={{ fontSize: isPortrait ? 42 : 30, fontWeight: 650, marginBottom: 18 }}>
              {snapshot.presentation.displayName}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              fontSize: isPortrait ? 170 : 150,
              fontWeight: 800,
              lineHeight: 0.9,
              letterSpacing: '-0.055em'
            }}
          >
            {snapshot.coreCode}
          </div>
          {snapshot.presentation.identitySentence ? (
            <div
              style={{
                display: 'flex',
                maxWidth: isPortrait ? 820 : 900,
                marginTop: 28,
                fontSize: isPortrait ? 32 : 24,
                lineHeight: 1.45,
                color: '#3e4944'
              }}
            >
              {snapshot.presentation.identitySentence}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                maxWidth: 780,
                marginTop: 28,
                fontSize: isPortrait ? 28 : 22,
                lineHeight: 1.5,
                color: '#4f5a54'
              }}
            >
              Personality Code System — sanitized shared result
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid #c9cbc4',
            paddingTop: 20,
            fontSize: isPortrait ? 20 : 16,
            color: '#66716b'
          }}
        >
          <div>{snapshot.versions.assessmentModelVersion}</div>
          <div>{templateVersion}</div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60',
        'X-PCS-Share-Template': templateVersion
      }
    }
  );
}

export function unavailableShareImage(kind: ShareImageKind): ImageResponse {
  const { width, height } = dimensions(kind);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f0e9',
          color: '#1c2521',
          fontSize: kind === 'portrait' ? 44 : 34,
          fontFamily: 'sans-serif'
        }}
      >
        PCS — SHARE UNAVAILABLE
      </div>
    ),
    { width, height, status: 404, headers: { 'Cache-Control': 'no-store' } }
  );
}
