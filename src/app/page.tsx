import LandingAnalytics from "./LandingAnalytics";

const traitRows = [
  ["SYSTEM THINKING", 96],
  ["VERIFICATION", 98],
  ["AUTONOMY", 91],
  ["RELATIONAL DEPTH", 87],
] as const;

const evidence = [
  ["147", "QUESTIONS", "開発用のレビュー済み候補項目"],
  ["21", "TRAITS", "直接測定する特性を連続値で保持"],
  ["PRIVATE", "BY DEFAULT", "完了しただけでは公開されない"],
  ["RULES", "VERSIONED", "採点・コード・表示ルールを固定"],
] as const;

const domains = [
  ["01", "思考", "THINKING", "情報をどう分解し、何を根拠として判断するか。"],
  ["02", "感情", "AFFECT", "感情をどう認識し、処理し、他者へ伝えるか。"],
  ["03", "行動", "ACTION", "実行、継続、探索、最適化のバランス。"],
  ["04", "恋愛", "RELATION", "親密さ、境界、相互性、関係への投資の深さ。"],
  ["05", "仕事", "WORK", "自律性、実行、最適化、リスク判断、派生プロフィール。"],
  ["06", "ストレス", "STRESS", "不確実性や制御不能な状況への反応。"],
] as const;

const adversarialPairs = [
  ["検証する", "疑い続けて意思決定が遅れる"],
  ["最適化する", "完了より改善を優先し続ける"],
  ["深く関わる", "距離を取る判断が遅れる"],
] as const;

const privacySteps = [
  ["01", "START", "アカウント不要", "診断開始のために氏名・メールアドレスの入力を要求しません。"],
  ["02", "RESULT", "PRIVATE FIRST", "診断を完了しただけでは公開URLは作られません。"],
  ["03", "SHARE", "EXPLICIT EXPORT", "共有を選んだときだけ、サニタイズされた公開スナップショットを作ります。"],
] as const;

export default function Home() {
  return (
    <main className="landingPage">
      <LandingAnalytics />
      <header className="siteHeader shell">
        <a className="brand" href="#top" aria-label="Personality Code System home">
          <span className="brandMark" aria-hidden="true">PC</span>
          <span className="brandText">Personality Code System</span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#method">診断設計</a>
          <a href="#domains">分析項目</a>
          <a href="#privacy">プライバシー</a>
          <a href="#share">共有</a>
        </nav>
        <a className="headerCta" href="/diagnosis">診断を試す</a>
      </header>

      <section className="hero shell" id="top">
        <div className="heroCopy">
          <div className="heroStatusLine">
            <p className="eyebrow">HIGH-RESOLUTION PERSONALITY ASSESSMENT</p>
            <span>DEVELOPMENT MODEL · JA</span>
          </div>
          <h1>あなたを、<br />16種類では終わらせない。</h1>
          <p className="heroLead">
            思考、感情、行動、関係性、仕事、ストレスなどの傾向を連続値で測定し、
            タイプ名より先に「どこが、どの程度、どう違うか」を読みます。
            これは医療・臨床診断ではありません。
          </p>
          <div className="heroActions">
            <a className="primaryButton primaryButtonStack" href="/diagnosis">
              <span>診断を試す</span>
              <small>ACCOUNT NOT REQUIRED</small>
            </a>
            <a className="textLink" href="#method">診断の構造を見る <span aria-hidden="true">↘</span></a>
          </div>
          <div className="heroPrivacyNote">
            <strong>PRIVATE FIRST</strong>
            <span>アカウント不要。診断完了だけでは公開されず、共有は自分で選びます。</span>
          </div>
        </div>

        <div className="profileSpecimen" aria-label="Development sample personality result">
          <div className="specimenTopline">
            <span>DEVELOPMENT SAMPLE</span>
            <span>C01D / NON-PUBLIC</span>
          </div>
          <div className="specimenFolio">RESULT DOSSIER · 01 / 06</div>
          <div className="specimenCode">SVAEND</div>
          <div className="specimenTitle">VERIFICATION<br />DESIGNER</div>
          <p className="specimenStatement">
            構造と根拠を自分で確かめ、<br />必要なら前提から組み直す。
          </p>
          <div className="traitList">
            {traitRows.map(([label, value]) => (
              <div className="traitRow" key={label}>
                <div className="traitMeta"><span>{label}</span><strong>{value}</strong></div>
                <div className="traitTrack" aria-hidden="true"><span style={{ width: `${value}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="specimenFooter">
            <span>MODEL STATUS</span>
            <strong>DEVELOPMENT</strong>
          </div>
        </div>
      </section>

      <section className="evidenceBand" aria-label="Development model facts">
        <div className="shell evidenceGrid">
          {evidence.map(([value, label, description]) => (
            <div className="evidenceCell" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="manifesto">
        <div className="shell manifestoInner">
          <p className="sectionIndex">00 — PRINCIPLE</p>
          <p className="manifestoText">
            性格を「それっぽい文章」に当てはめるのではなく、
            <strong>測定値 → コード → 解説</strong>の順で組み立てる。
            AIが毎回違う人格を作る診断にはしません。現在のCore Codeは開発中で、
            心理学上の固定分類や科学的妥当性を主張するものではありません。
          </p>
        </div>
      </section>

      <section className="section shell methodSection" id="method">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">01 — METHOD</p>
            <h2>測る。圧縮する。<br />差を残す。</h2>
          </div>
          <p className="sectionDescription">
            タイプ名を先に決めるのではなく、Traitの連続値を先に持ち、その上に読みやすいコードを重ねます。
          </p>
        </div>
        <div className="methodGrid">
          <article>
            <span className="methodNumber">A</span>
            <p className="methodVerb">MEASURE</p>
            <h3>Trait Vector</h3>
            <p>21の直接測定Traitを連続値で保持。個人差そのものを先に残します。</p>
          </article>
          <article>
            <span className="methodNumber">B</span>
            <p className="methodVerb">COMPRESS</p>
            <h3>Core Type</h3>
            <p>主要傾向を人間が読みやすい短いコードへ圧縮。現行コードは開発スキーマで、公開分類としては未確定です。</p>
          </article>
          <article>
            <span className="methodNumber">C</span>
            <p className="methodVerb">PRESERVE</p>
            <h3>Extended Code</h3>
            <p>同じCore Type内の差を、Trait帯域や補助情報を含むExtended Codeとして残します。</p>
          </article>
        </div>
        <div className="methodFootnote">
          <span>INPUT</span><strong>147 ITEMS</strong>
          <span>OUTPUT</span><strong>STRUCTURED RESULT</strong>
          <span>RUNTIME</span><strong>DETERMINISTIC</strong>
        </div>
      </section>

      <section className="section shell dossierSection" id="domains">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">02 — RESULT DOSSIER</p>
            <h2>一つのタイプ名では、<br />読み切らない。</h2>
          </div>
          <div className="dossierIntro">
            <p className="sectionDescription">
              一語のラベルだけで決めつけず、複数の測定Traitと相互作用から場面ごとの傾向を読み分けます。
            </p>
            <div className="dossierStats">
              <span>6 CORE READING DOMAINS</span>
              <span>18 STRUCTURED RESULT SECTIONS</span>
            </div>
          </div>
        </div>
        <div className="domainList">
          {domains.map(([number, title, english, description]) => (
            <article className="domainRow" key={number}>
              <span>{number}</span>
              <div className="domainTitle">
                <h3>{title}</h3>
                <small>{english}</small>
              </div>
              <p>{description}</p>
              <span className="domainArrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell adversarialSection">
        <div className="adversarialCard">
          <div>
            <p className="sectionIndex light">03 — ADVERSARIAL VIEW</p>
            <h2>長所だけでは、<br />性格は分からない。</h2>
          </div>
          <div className="adversarialBody">
            <p>
              同じ特性でも、条件が変われば機能の仕方は変わります。
              PCSでは肯定的な読みだけで終わらず、どこで摩擦や失敗に転ぶかも同じTraitから読みます。
            </p>
            <div className="adversarialPairs">
              {adversarialPairs.map(([strength, risk]) => (
                <div key={strength}>
                  <strong>{strength}</strong>
                  <span aria-hidden="true">↔</span>
                  <p>{risk}</p>
                </div>
              ))}
            </div>
            <p className="adversarialNote">
              通常評価と敵対的評価は、診断名や人格の断定ではなく、同じ傾向の条件依存性を読むための2つの視点です。
            </p>
          </div>
        </div>
      </section>

      <section className="privacyBand" id="privacy">
        <div className="shell privacyInner">
          <div className="sectionHeading splitHeading">
            <div>
              <p className="sectionIndex">04 — PRIVACY PROTOCOL</p>
              <h2>まず非公開。<br />共有は、あとから選ぶ。</h2>
            </div>
            <p className="sectionDescription">
              診断を受けることと、結果を公開することを分けています。開始時にアカウントは不要です。
            </p>
          </div>
          <div className="privacyGrid">
            {privacySteps.map(([number, label, title, description]) => (
              <article className="privacyStep" key={number}>
                <div className="privacyStepTop"><span>{number}</span><small>{label}</small></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell" id="share">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">05 — SHARE</p>
            <h2>結果を、説明できる<br />一枚にする。</h2>
          </div>
          <p className="sectionDescription">
            共有を選んだ場合だけ、診断の生回答とは分離された公開用スナップショットを作ります。
          </p>
        </div>
        <div className="sharePreview">
          <div className="shareCard">
            <div className="shareCardHeader"><span>DEVELOPMENT SHARE PREVIEW</span><span>PCS</span></div>
            <strong className="shareCode">SVAEND</strong>
            <p>開拓の探究設計家〈深縁〉</p>
            <div className="shareQuote">構造と根拠を組み直しながら、<br />未知へ動き、深い関係を育てやすい。</div>
            <div className="shareStats"><span>THINK 96</span><span>LOVE 88</span><span>WORK 98</span></div>
          </div>
          <div className="shareNotes">
            <p className="noteLabel">SHARE DESIGN</p>
            <ul>
              <li>結果URLの公開は明示操作時のみ</li>
              <li>X / LINE / Web Share対応</li>
              <li>OG画像と縦長SNSカードを決定論的に生成</li>
              <li>生回答やprivate session capabilityは公開しない</li>
              <li>現在のタイプ名・コードは開発版で、公開分類ではない</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="shell closingInner">
          <p className="sectionIndex light">PERSONALITY CODE SYSTEM</p>
          <h2>「何タイプ？」から、<br />「どういう人？」へ。</h2>
          <div className="closingAction">
            <a className="inverseButton" href="/diagnosis">診断プロトタイプを開く</a>
            <span>ACCOUNT NOT REQUIRED · PRIVATE FIRST</span>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <span>© Personality Code System</span>
        <nav className="footerLinks" aria-label="法務・プライバシー">
          <a href="/privacy">PRIVACY DRAFT</a>
          <a href="/terms">TERMS / LIMITATIONS DRAFT</a>
        </nav>
        <span>MODEL STATUS — DEVELOPMENT / NOT VALIDATED</span>
      </footer>
    </main>
  );
}
