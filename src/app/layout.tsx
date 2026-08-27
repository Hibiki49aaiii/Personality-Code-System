import type { Metadata, Viewport } from "next";
import { getSiteOrigin } from "../server/siteOrigin";
import { isPublicIndexingAllowed } from "../server/deploymentGate";
import WebVitalsAnalytics from "./WebVitalsAnalytics";
import "./globals.css";

const publicIndexingAllowed = isPublicIndexingAllowed();

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  title: {
    default: "Personality Code System",
    template: "%s | Personality Code System",
  },
  description:
    "16タイプでは終わらない、高解像度の性格コード診断。思考、感情、行動、恋愛、仕事、ストレス耐性まで多軸で可視化します。",
  applicationName: "Personality Code System",
  robots: publicIndexingAllowed
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Personality Code System",
    description: "あなたを、16種類では終わらせない。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personality Code System",
    description: "あなたを、16種類では終わらせない。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2efe7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body><WebVitalsAnalytics />{children}</body>
    </html>
  );
}
