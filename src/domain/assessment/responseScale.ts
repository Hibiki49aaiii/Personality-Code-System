import type { LikertValue } from './scoring';

export const LIKERT_5_JA_V01 = {
  version: 'likert-5-ja-v0.1',
  locale: 'ja-JP',
  values: [
    { value: 1, label: 'まったく当てはまらない' },
    { value: 2, label: 'あまり当てはまらない' },
    { value: 3, label: 'どちらともいえない' },
    { value: 4, label: 'やや当てはまる' },
    { value: 5, label: 'とても当てはまる' }
  ] as const satisfies readonly { value: LikertValue; label: string }[]
} as const;

export type Likert5JaV01 = typeof LIKERT_5_JA_V01;
