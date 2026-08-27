import { DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION } from '../../domain/illustration/fallbackAsset';

export function CuratedFallbackArtwork({
  width = '100%',
  height = '100%',
  decorative = false
}: {
  width?: number | string;
  height?: number | string;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 480 480"
      width={width}
      height={height}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'PCS development fallback illustration'}
      data-asset-version={DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION}
    >
      <rect x="18" y="18" width="444" height="444" rx="32" fill="#e7dfd2" />
      <rect x="54" y="54" width="372" height="372" rx="22" fill="#f4efe5" stroke="#1c2521" strokeWidth="4" />
      <path d="M92 146H388M92 240H388M92 334H388" stroke="#c3b8a9" strokeWidth="3" />
      <path d="M146 92V388M240 92V388M334 92V388" stroke="#c3b8a9" strokeWidth="3" />
      <circle cx="240" cy="240" r="112" fill="#f4efe5" stroke="#b74631" strokeWidth="8" />
      <circle cx="240" cy="240" r="34" fill="#1c2521" />
      <path d="M240 112L272 208L368 240L272 272L240 368L208 272L112 240L208 208Z" fill="none" stroke="#1c2521" strokeWidth="10" strokeLinejoin="round" />
      <path d="M240 150L256 224L330 240L256 256L240 330L224 256L150 240L224 224Z" fill="#d6c9b8" stroke="#b74631" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="112" cy="112" r="12" fill="#b74631" />
      <circle cx="368" cy="112" r="12" fill="#1c2521" />
      <circle cx="112" cy="368" r="12" fill="#1c2521" />
      <circle cx="368" cy="368" r="12" fill="#b74631" />
    </svg>
  );
}
