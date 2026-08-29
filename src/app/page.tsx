import LandingAnalytics from "./LandingAnalytics";

const traitRows = [
  ["SYSTEM THINKING", 96],
  ["VERIFICATION", 98],
  ["AUTONOMY", 91],
  ["RELATIONAL DEPTH", 87],
] as const;

const domains = [
  ["01", "思考", "情報をどう分解し、何を根拠として判断するか。"],
  ["02", "感情", "感情をどう認識し、処理し、他者へ伝えるか。"],
  ["03", "行動", "実行、継続、探索、最適化のバランス。"],
  ["04", "恋愛", "親密さ、境界、相互性、関係への投資の深さ。"],
  ["05", "仕事", "自律性、実行、最適化、リスク判断、派生プロフィール。"],
  ["06", "ストレス", "不確実性や制御不能な状況への反応。"],
] as const;

const reportIndex = [
  ["THINKING", "思考・検証・意思決定"],
  ["EMOTION", "感情処理・表現・境界"],
  ["ACTION", "実行・継続・探索"],
  ["RELATION", "恋愛・親密さ・相互性"],
  ["WORK", "自律・最適化・リーダーシップ"],
  ["STRESS", "不確実性・負荷時の反応"],
] as const;

const principles = [
  ["NO ACCOUNT", "診断開始に登録は不要。まず測定に集中できます。"],
  ["DETERMINISTIC", "同じ回答と同じバージョンなら、同じ結果を再現します。"],
  ["PRIVATE FIRST", "結果は最初から公開されず、共有は明示操作でのみ作成します。"],
  ["NO RUNTIME AI", "採点・分類・結果文は、実行時の生成AIに依存しません。"],
] as const;

export default function Home() {
  return (
    <main>
      <LandingAnalytics />

      <header className="siteHeader shell">
        <a className="brand" href="#top" aria-label="Personality Code System home">
          <span className="brandMark" aria-hidden="true">PC</span>
          <span className="brandText">Personality Code System</span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#method">診断設計</a>
          <a href="#result">結果</a>
          <a href="#domains">分析項目</a>
          <a href="#principles">方針</a>
        </nav>
        <a className="headerCta" href="/diagnosis">診断を試す</a>
      </header>

      <section className="hero shell" id="top">
        <div className="heroCopy">
          <div className="heroKicker">
            <p className="eyebrow">HIGH-RESOLUTION PERSONALITY ASSESSMENT</p>
            <span>DEVELOPMENT / C01D</span>
          </div>
          <h1>あなたを、<br />16種類では終わらせない。</h1>
          <p className="heroLead">
            思考、感情、行動、関係性、仕事、ストレスなどの傾向を連続値で測定し、
            「性格コード」として可視化します。これは医療・臨床診断ではありません。
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="/diagnosis">診断プロトタイプへ</a>
            <a className="textLink" href="#method">仕組みを見る <span aria-hidden="true">↘</span></a>
          </div>
          <dl className="heroFacts" aria-label="Current development model facts">
            <div><dt>MEASURED</dt><dd>21 direct Traits</dd></div>
            <div><dt>RESULT</dt><dd>18 structured sections</dd></div>
            <div><dt>ACCOUNT</dt><dd>診断時は不要</dd></div>
          </dl>
        </div>

        <div className="profileSpecimen" aria-label="Sample personality result">
          <div className="specimenTopline">
            <span>DEVELOPMENT SAMPLE</span>
            <span>C01D / NON-PUBLIC</span>
          </div>
          <div className="specimenIdentity">
            <div>
              <div className="specimenCode">SVAEND</div>
              <div className="specimenTitle">VERIFICATION<br />DESIGNER</div>
            </div>
            <span className="specimenSeal" aria-hidden="true">PCS<br />01</span>
          </div>
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

      <section className="statusBand" aria-label="Product status">
        <div className="shell statusBandInner">
          <span>CURRENT DEVELOPMENT MODEL</span>
          <strong>測定値 → コード → 解説</strong>
          <span>VERSIONED / REPRODUCIBLE / PRIVATE-FIRST</span>
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

      <section className="section shell" id="method">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">01 — METHOD</p>
            <h2>タイプ名より先に、<br />個人差を測る。</h2>
          </div>
          <p className="sectionDescription">
            PCSは一つのラベルだけで人物像を決めません。連続値のTraitを基礎に、
            理解しやすいCore Typeと、差分を残すExtended Codeへ段階的に圧縮します。
          </p>
        </div>

        <div className="methodGrid">
          <article>
            <span className="methodNumber">A</span>
            <p className="methodLabel">MEASURE</p>
            <h3>Trait Vector</h3>
            <p>複数の心理特性を0–100の連続値で保持。タイプ名より先に、個人差そのものを測ります。</p>
          </article>
          <article>
            <span className="methodNumber">B</span>
            <p className="methodLabel">COMPRESS</p>
            <h3>Core Type</h3>
            <p>主要傾向を人間が理解しやすい短いコードへ圧縮。現行コードは開発スキーマで、公開分類としては未確定です。</p>
          </article>
          <article>
            <span className="methodNumber">C</span>
            <p className="methodLabel">PRESERVE</p>
            <h3>Extended Code</h3>
            <p>同じCore Typeの中にある差を、21 Traitの帯域や補助情報を含むExtended Codeで保持します。</p>
          </article>
        </div>
      </section>

      <section className="resultSection" id="result">
        <div className="shell resultSectionInner">
          <div className="resultIntro">
            <p className="sectionIndex light">02 — RESULT DOSSIER</p>
            <h2>結果は、点数表ではなく<br />読み解ける人物資料へ。</h2>
            <p>
              Core Codeだけで終わらず、複数のTrait・相互作用・測定品質を、
              役割ごとの文章へ分けて提示します。
            </p>
            <a className="resultLink" href="/diagnosis">実際の診断フローを見る <span aria-hidden="true">→</span></a>
          </div>

          <div className="reportIndex" aria-label="Result dossier index">
            <div className="reportIndexHead">
              <span>REPORT INDEX</span>
              <span>STRUCTURED OUTPUT</span>
            </div>
            {reportIndex.map(([label, description], index) => (
              <div className="reportIndexRow" key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{label}</strong>
                <p>{description}</p>
              </div>
            ))}
            <div className="reportIndexFoot">
              <span>+ ADVERSARIAL ANALYSIS / GROWTH / PERSONAL MANUAL</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section shell" id="domains">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">03 — DOMAINS</p>
            <h2>一人の中にある、<br />複数の行動傾向を見る。</h2>
          </div>
          <p className="sectionDescription">
            一語のタイプ名だけで決めつけず、複数の測定Traitと相互作用から場面ごとの傾向を読み分けます。
          </p>
        </div>
        <div className="domainList">
          {domains.map(([number, title, description]) => (
            <article className="domainRow" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="domainArrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell adversarialSection">
        <div className="adversarialCard">
          <div>
            <p className="sectionIndex light">04 — ADVERSARIAL VIEW</p>
            <h2>長所だけでは、<br />性格は分からない。</h2>
          </div>
          <div className="adversarialBody">
            <p>
              「検証能力が高い」は、状況によって「信用コストが高い」に変わる。
              「最適化能力が高い」は、「終わらせられない」に変わる。
            </p>
            <p>
              PCSでは同じ特性を<strong>通常評価と敵対的評価</strong>の両面から解説します。
              褒めるための診断ではなく、使い方と失敗条件まで読めることを重視します。
            </p>
          </div>
        </div>
      </section>

      <section className="section shell" id="principles">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">05 — PRODUCT PRINCIPLES</p>
            <h2>診断結果より先に、<br />守るものを決める。</h2>
          </div>
          <p className="sectionDescription">
            個人の診断情報を扱うからこそ、登録・共有・採点・生成の境界をプロダクト仕様として固定しています。
          </p>
        </div>
        <div className="principleGrid">
          {principles.map(([title, body], index) => (
            <article key={title}>
              <div className="principleMeta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
              </div>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell" id="share">
        <div className="sectionHeading splitHeading">
          <div>
            <p className="sectionIndex">06 — SHARE</p>
            <h2>共有するのは、<br />結果の要約だけ。</h2>
          </div>
          <p className="sectionDescription">
            公開リンクは診断完了時に自動作成されません。共有を選んだときだけ、
            生回答を含まない別の公開スナップショットを作ります。
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
              <li>明示操作で公開共有リンクを作成</li>
              <li>X / LINE / Web Share / URLコピー対応</li>
              <li>OG画像と縦長SNSカードを決定論的に生成</li>
              <li>生回答・非公開Traitベクトルは公開スナップショットから除外</li>
              <li>公開時は承認済みタイプ別イラストを表示する設計</li>
              <li>現在のタイプ名・コードは開発版で、公開分類ではない</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="shell closingInner">
          <div className="closingTopline">
            <p className="sectionIndex light">PERSONALITY CODE SYSTEM</p>
            <span>ANONYMOUS FIRST / DEVELOPMENT MODEL</span>
          </div>
          <h2>「何タイプ？」から、<br />「どういう人？」へ。</h2>
          <div className="closingActions">
            <a className="inverseButton" href="/diagnosis">診断プロトタイプを開く</a>
            <span>登録不要 · 現在は開発モデル</span>
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
