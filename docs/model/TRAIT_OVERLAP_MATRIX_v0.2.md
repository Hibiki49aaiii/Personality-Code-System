# Trait Overlap Matrix v0.2

> Status: conceptual pre-item-bank review
> Date: 2026-08-26
> Applies to: Trait Dictionary v0.2

## 0. Legend

Every retained trait pair is classified below before item authoring.

- **H — High overlap risk:** strong risk that careless items would measure the same thing. Requires explicit discriminant items and statistical review.
- **M — Moderate overlap risk:** related constructs with a clear distinction, but wording must preserve that boundary.
- **D — Distinct:** no current conceptual merger concern. Correlation may still occur empirically.

This matrix is conceptual, not an empirical correlation matrix. Statistical results may later force a different decision.

## 1. Full pairwise matrix

|   |SYS|VER|ADV|ABS|META|EMO|COG|BND|RDP|REC|CON|AUT|EXE|OPT|FIN|NOV|PER|RSK|UNC|STR|CRE|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|SYS|—|D|M|M|M|D|D|D|D|D|D|D|D|M|D|D|D|D|D|D|M|
|VER||—|H|D|M|D|D|D|D|D|M|D|D|D|D|D|D|D|M|D|D|
|ADV|||—|D|D|D|D|D|D|D|M|D|D|D|D|D|D|D|M|D|D|
|ABS||||—|M|D|D|D|D|D|D|D|D|D|D|M|D|D|D|D|M|
|META|||||—|D|M|D|D|D|D|D|D|D|D|D|D|D|D|D|M|
|EMO||||||—|H|D|M|D|D|D|D|D|D|D|D|D|D|M|D|
|COG|||||||—|D|D|D|D|D|D|D|D|D|D|D|D|M|D|
|BND||||||||—|M|M|D|M|D|D|D|D|D|D|D|D|D|
|RDP|||||||||—|M|M|D|D|D|D|D|D|D|D|D|D|
|REC||||||||||—|M|D|D|D|D|D|D|D|D|D|D|
|CON|||||||||||—|D|D|D|D|D|D|D|M|D|D|
|AUT||||||||||||—|M|M|D|D|D|D|D|D|D|
|EXE|||||||||||||—|D|M|D|M|M|M|D|D|
|OPT||||||||||||||—|H|M|M|D|D|D|D|
|FIN|||||||||||||||—|M|M|D|D|D|D|
|NOV||||||||||||||||—|M|M|D|D|M|
|PER|||||||||||||||||—|D|D|D|M|
|RSK||||||||||||||||||—|H|D|D|
|UNC|||||||||||||||||||—|M|D|
|STR||||||||||||||||||||—|D|
|CRE|||||||||||||||||||||—|

## 2. High-overlap pairs — mandatory distinction tests

### VER × ADV — Evidence threshold vs hostile/failure orientation

- **VER:** asks whether a claim is adequately supported.
- **ADV:** asks how a system/claim could fail, be exploited, or conceal incentives.
- A person can verify meticulously without assuming hostile conditions (high VER, low ADV), or red-team intuitively without doing rigorous source verification (high ADV, lower VER).
- **Item rule:** VER items must not mention attacks, manipulation, loopholes, or hidden motives unless the target is evidence checking. ADV items must not require source-checking behavior.

### EMO × COG — Emotional access vs analytical processing route

- **EMO:** whether the person can directly notice/name primary emotion.
- **COG:** whether emotion is routed through explanation, language, cause analysis, and problem structure.
- High-high means someone can feel and analyze; low-EMO/high-COG supports the hypothesis of explanation preceding direct affect access.
- **Item rule:** EMO items must test recognition/differentiation timing. COG items must test what the person does with emotion after/during detection.

### OPT × FIN — Improvement drive vs stopping/closure discipline

- **OPT:** pressure to make a functional output better.
- **FIN:** pressure/ability to define done and close/ship.
- They can coexist: high OPT + high FIN should describe intensive improvement within a strong stopping rule.
- **Item rule:** OPT items must ask about improving already-adequate work. FIN items must ask about stop criteria/closure, not quality motivation.

### RSK × UNC — Downside acceptance vs incomplete-information tolerance

- **RSK:** willingness to accept loss/variance for upside.
- **UNC:** ability to function while information/outcomes remain unresolved.
- High UNC + low RSK is possible: comfortable with ambiguity but still conservative about downside.
- High RSK + low UNC is possible: willing to take a large known/calculated risk but uncomfortable with unknown variables.
- **Item rule:** RSK items must include explicit downside tradeoff. UNC items must avoid implying gain/loss preference.

## 3. Moderate-overlap distinction register

| Pair | Distinction rule |
| --- | --- |
| SYS × ADV | SYS maps relationships/causes; ADV intentionally searches failure/adversarial cases. |
| SYS × ABS | SYS models interactions among parts; ABS generalizes from cases to principles. |
| SYS × META | SYS models a target system; META monitors the thinker's own reasoning process. |
| SYS × OPT | SYS understands structure; OPT seeks improvement. Either can exist without the other. |
| SYS × CRE | SYS represents existing relations; CRE creates new combinations. |
| VER × META | VER checks support for claims; META checks one's own reasoning process/confidence. |
| VER × CON | VER asks for evidence; CON notices mismatch across words/actions/time. |
| VER × UNC | VER increases checking; UNC describes whether unresolved uncertainty prevents functioning. |
| ADV × CON | ADV actively hunts failure/exploitation; CON reacts to detected incongruence. |
| ADV × UNC | ADV can create more unresolved threat hypotheses; UNC determines tolerance of remaining ambiguity. |
| ABS × META | ABS changes representational level; META inspects cognition itself. |
| ABS × NOV | ABS generalizes; NOV seeks unfamiliarity. Abstract thinkers need not seek novelty. |
| ABS × CRE | ABS extracts reusable structure; CRE recombines structures into new options. |
| META × COG | META monitors cognition broadly; COG specifically mediates emotional experience through cognition. |
| META × CRE | META evaluates/revises thinking; CRE generates new combinations. |
| EMO × RDP | Emotional self-access is not relationship depth; deep bonds can coexist with delayed emotion recognition. |
| EMO × STR | Recognizing emotion quickly is distinct from recovering quickly after stress. |
| COG × STR | Analytical processing may affect recovery but is not recovery speed itself. |
| BND × RDP | Boundary strength concerns fusion/obligation limits; RDP concerns depth/intensity of chosen bonds. |
| BND × REC | BND limits what one owes; REC monitors whether investment is mutual. |
| BND × AUT | BND protects limits/responsibility; AUT seeks discretion/self-direction. |
| RDP × REC | Depth of investment is distinct from monitoring whether that investment is reciprocated. |
| RDP × CON | Deep relational investment can raise salience of inconsistency, but the constructs are separable. |
| REC × CON | REC compares contribution/priority between people; CON compares claims/actions/time for congruence. |
| CON × UNC | Inconsistency creates unresolved explanation; UNC measures tolerance of remaining unresolvedness. |
| AUT × EXE | Wanting discretion does not guarantee rapid initiation. |
| AUT × OPT | Desire for control over methods is distinct from desire to improve methods. |
| EXE × FIN | Initiating quickly does not guarantee closing work, and strong finishers may start cautiously. |
| EXE × PER | Starting and sustaining are separate stages of behavior. |
| EXE × RSK | Fast initiation can occur on reversible low-risk steps; risk appetite concerns downside exposure. |
| EXE × UNC | Uncertainty tolerance may enable action but does not itself create action bias. |
| OPT × NOV | Improvement of current systems differs from attraction to entirely new systems. |
| OPT × PER | Optimization can create repeated effort, but persistence exists without improvement-seeking. |
| FIN × NOV | Novelty may compete with closure, but novelty preference is not unfinishedness. |
| FIN × PER | Persistence sustains effort; closure decides when effort should stop/ship. |
| NOV × PER | Novelty seeking and persistence may be negatively related in some people, but are conceptually independent. |
| NOV × RSK | Newness can feel risky, yet someone may seek novelty only when downside is limited. |
| NOV × CRE | Novelty consumption/exploration differs from generating new combinations. |
| PER × CRE | Creative work may require persistence, but creativity is generation/recombination rather than sustained effort. |
| UNC × STR | UNC operates while ambiguity is unresolved; STR describes recovery after activation/stressor control. |

## 4. Removed-candidate overlap decisions

### LDR — Leadership Structure → derived profile

Merger risk was too high with AUT, BND, EXE, CON, OPT, VER and role/context variables. Direct self-report would mix personality with whether the respondent currently manages people. It is removed from the v0.2 direct trait set.

### DEL — Delegation → derived work behavior

Direct delegation scores would mix trust, team quality, role authority, task criticality, VER, AUT, CON and BND. It is removed as a general latent trait.

### TRN — Cross-domain Transfer → derived hidden-strength profile

Strong conceptual overlap with ABS, CRE and SYS, plus likely dependence on knowledge breadth and demonstrated ability. It is not directly self-rated as a v0.2 trait.

## 5. Item-bank overlap controls

Before an item may enter the candidate bank:

1. It has exactly one **primary_trait_id**.
2. It may list secondary expected correlations, but secondary traits receive **zero scoring weight** unless explicitly defined by the scoring model.
3. Reviewers must answer: "Could a respondent endorse this item for a neighboring trait while having low primary trait?" If yes, rewrite or reject.
4. High-overlap pair items require at least one discriminant item designed to separate the two constructs.
5. During beta analysis, pairs with extremely high latent/scale correlation trigger content review before any merge decision.
6. No trait is retained merely to increase the number of codes or marketing granularity.

## 6. Exit decision

Conceptual overlap review for all 21 retained v0.2 candidates is complete. **This does not prove discriminant validity.** The next evidence gate is candidate item behavior followed by empirical inter-trait/factor analysis.