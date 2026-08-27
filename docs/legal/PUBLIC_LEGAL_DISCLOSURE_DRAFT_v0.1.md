# PCS Public Legal / Privacy Disclosure Draft v0.1

> Status: **DRAFT — factual implementation disclosure only; not legally approved for public launch**
> Locale: ja-JP
> Source contract: `data/legal/legal-disclosure-v0.1-dev.json`

## 1. サービスの位置づけ

Personality Code System（PCS）は、回答内容をバージョン管理された決定論的ルールで集計し、複数の性格傾向を可視化するWebサービスとして開発されています。

PCSの結果は医療・臨床診断ではありません。精神疾患、発達障害、知能、犯罪性、虚偽性、採用適性、恋愛の運命、将来行動の保証を判定するものではありません。

現在のCore Code / C01Dは開発中の非公開スキーマであり、科学的に妥当性が確認された固定的な64分類であるとは主張しません。

## 2. AI利用

本番の診断・採点・タイプ判定・結果文章選択は、同じ回答と同じモデル/コンテンツバージョンから同じ結果を得られる決定論的処理を前提としています。本番診断結果の生成にAI/LLM APIキーや生成モデルを必要としません。

開発時の文章作成支援等にツールが使われる場合でも、公開資産は通常のバージョン管理されたコンテンツとしてレビュー・保存される方針です。

## 3. アカウントと本人情報

通常の診断開始にアカウント登録は必要ありません。

現在の通常診断フローでは、実名、メールアドレス、電話番号、郵便住所、正確な位置情報、勤務先、健康履歴、政治・宗教上の属性、性生活情報、生体メディアを標準では収集しません。

## 4. 診断データ

匿名診断の進行を再開し、回答と結果を同一ブラウザのセッションに結び付けるため、ブラウザには高エントロピーの不透明なセッショントークンを保存します。データベースにはその生トークンではなくハッシュを保存する設計です。

回答データと派生結果は別々に保存されます。公開共有用データにも、生の質問回答、完全なTrait Vector、Extended Code、Response Quality等の非公開診断情報を含めない設計です。

## 5. 現在の開発用保存期間

以下は現在の**開発・設計上の基準**であり、最終的な公開Privacy Policy上の約束ではありません。公開前に実際の運用・法務・バックアップ仕様と一致させます。

- 未完了の匿名セッション/下書き回答: 30日基準
- 完了後の生回答: 90日基準
- 非公開の派生結果Snapshot: 180日基準
- セッション非紐付けproduct events: 30日基準
- セッション紐付けproduct events: 90日基準
- 公開共有Snapshot: 現在は明示的な失効/将来ポリシーまで
- calibration dataset: 標準では作成しない
- database backup: 35日というengineering baselineはあるが、実production providerの復旧仕様は未確定

30/90/180日の診断データ基準については、開発リポジトリ内にdry-run-firstの削除コマンドとPostgreSQL統合テストがあります。ただし、これはproduction schedulerが実際に稼働している証拠ではありません。公開前に実デプロイ環境の定期実行、失敗監視、backup restore時の削除済みデータ取扱いを一致させます。

## 6. 公開共有

診断を完了しただけでは結果は公開されません。ユーザーが明示的に共有操作を行った場合にのみ、別の公開共有Snapshotと推測困難な共有URLを作成します。

現在の設計では公開共有リンクは失効できます。公開共有Snapshotは、非公開診断セッションのBearer tokenとは別のCapabilityを使用します。

## 7. Analytics / performance / error telemetry

現在のproduct analyticsはfirst-party経路を使用し、生の回答値、完全なTrait Vector、Extended Code、自由記述のエラーメッセージ/stack、private capability tokenを通常イベントに送らない契約です。

Web Vitalsは現在、LCP / INP / CLS / TTFB の種類と good / needs-improvement / poor のbucketまでに縮約し、生の測定値・IDをproduct eventとして送らない設計です。

第三者analyticsへの診断データexportは標準で無効です。

## 8. Calibration / research use

心理測定上のcalibrationは通常のproduct analyticsとは分離します。回答レベルのcalibration exportは、明示的な参加/同意、保存・削除方針、operator authorization、legal/privacy review等が成立するまで実装・有効化しない方針です。

## 9. 削除・失効

現在の公開共有リンクには失効機能があります。

同一ブラウザが保持するprivate session bearer cookieで所有権を確認できる場合、private result画面から匿名診断データの自己削除を実行できます。削除操作は二段階確認を要求し、成功時には匿名セッション、その回答、Trait Score、非公開Result Snapshot、session-bound product analytics、およびそのResult Snapshotから作成された公開共有Snapshotを削除します。削除後はprivate session cookieも破棄されます。

共有Snapshotを先に削除してから親sessionを削除するため、private sourceを消した後に公開共有だけ残る状態を作らない設計です。

この自己削除機能はproduction上の最終Retention/Privacy Policyを確定するものではありません。database backupに既に含まれたデータのrestore/deletion behavior、production retention scheduler、法的な保存義務・例外、privacy/security requestの連絡先は公開前に実環境と法務レビューで確定する必要があります。

## 10. Terms of Use draft principles

公開Termsは少なくとも以下を明示する必要があります。

- PCSは自己理解・情報提供を目的とする非臨床サービスであること
- 医療、雇用、信用、法的判断等の高影響決定をPCS結果だけで行うことを前提にしないこと
- サービス/モデル/名称/コンテンツはバージョン更新され得ること
- 古い結果は取得時のモデル/コンテンツバージョンに紐付くこと
- 不正アクセス、過剰な自動リクエスト、共有Capabilityの悪用等を禁止すること
- availabilityや完全無欠の測定精度を保証しないこと
- 適用法、準拠法、事業者表示、責任制限等の法的条項は公開地域/事業形態の法務レビュー後に確定すること

## 11. 公開前に必ず確定する事項

- 最終Privacy Policy
- 最終Terms of Use
- 最終診断limitations文面
- cookie/analytics consentの要否と実挙動
- 最終retention/deletion方針とproduction retention scheduler
- production backup保存・restore時の削除済みデータ取扱い
- calibrationを開始する場合の別同意
- privacy/security requestの実在する連絡先
- 事業者情報・準拠法・責任制限等の法的条項

この草案は実装の事実関係を先に固定するためのものであり、法的助言または公開可能な最終約款を意味しません。
