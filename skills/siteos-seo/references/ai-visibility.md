# GEO: AI search visibility

Use GEO for generative engine optimization: how AI answers describe, mention and cite a website.
It is separate from geographic targeting and from testing whether an agent can complete a task
on that website. In the application, open SEO/GEO → Brand lookup, Prompt checks or AI Visibility.
The CLI reads these sections with `seo research` and `--kind brand`, `--kind ai-visibility` or
`--kind ai-rankings` respectively. Category run/plan requests use the shared `ai-visibility` kind
with a versioned `category` input, as described below.

## Keep the observations distinct

| Evidence | What it can establish | What it cannot establish |
| --- | --- | --- |
| Site Audit: robots, public HTML, canonical and snippet policies | Technical accessibility and observable restrictions | Inclusion or a citation in an AI answer |
| Brand lookup | Mentions in the provider's returned corpus and context | Every answer shown to every user |
| Prompt checks | Mentions, citation URLs and answer evidence for a particular sampled prompt/platform | A permanent or universal AI rank |
| AI Visibility | Product comparisons across the same sampled questions and platforms, with AEO score, recommendation roles, first choices, objections and citations | A universal AI rank or evidence that an agent installed and used a product |
| Analytics AI Assistants channel | Recorded visits with a recognized AI referrer or campaign signal | Total mentions, all AI visits, or which prompt caused an untagged visit |

Start with the requested question. Read saved Brand lookup, Prompt checks or AI Visibility reports in the exact
Project/environment through `npx @siteoshq/cli seo research history --kind brand --json`,
`npx @siteoshq/cli seo research history --kind ai-visibility --json` or
`npx @siteoshq/cli seo research history --kind ai-rankings --json`, then read a returned ID with
`npx @siteoshq/cli seo research show <run-id> --json`. The interface and exports expose the same
evidence. Follow [research operations](search-research.md) for plan/run/wait/export and retry keys.
Do not configure an MCP server. New paid checks require authorized scope and
available research credits. A tool failure, unavailable model or missing answer is not a zero-mention
observation. Failed or incomplete reports must retain their coverage limitations.

## Prepare an AI request

Use separate JSON files for independent prompt checks; use the category request below for a shared
set of comparison questions. Brand lookup searches the provider's corpus:

```json
{"kind":"brand","target":"example.com","brand":"Acme","brandPlatform":"chat_gpt","brandMatch":"domain","country":"US","language":"en"}
```

A prompt check samples the selected platforms; choose only those the user needs:

```json
{"kind":"ai-visibility","target":"example.com","brand":"Acme","prompt":"Which website analytics tools suit a small SaaS team?","platforms":["chat_gpt","perplexity"],"country":"US","language":"en"}
```

Validate with `npx @siteoshq/cli seo research plan --input ./ai-request.json --json`. Planning and
reading existing reports are free. Request fields, planned parts and availability describe scope;
actual provider/model availability is rechecked at dispatch. Launch only the authorized request
using the shared research workflow. Keep competitor websites out of prompts unless relevant to
the question, and preserve wording across comparable observations.

## Review the sample

1. Record website and brand aliases supplied by the user, report ID/time, prompts, provider/platform,
   model when returned, language and market. Preserve the exact query text rather than silently
   replacing it between comparisons. A model API sample may differ from the consumer application.
2. Inspect the available answer evidence. Separate a brand-name mention, a citation to the website,
   a recommendation and an unrelated name collision. Show cited URLs and relevant short excerpts
   when available. A citation to a third-party review is not a citation to the user's website.
3. Compare competitors only within comparable prompt sets and successful observations. If calculating
   a mention rate, disclose the numerator, denominator and exclusions. Label order within an answer
   as answer order when observed; do not turn it into a search-engine-style position.
4. Explain which audience questions are covered, where the brand is absent in this sample, and which
   owned pages could better answer those questions. Keep conclusions bounded by sample size and date.

## Recommend and verify changes

Use [technical audit](technical-audit.md) for canonical, robots, sitemap and snippet evidence. Treat
search-crawler accessibility separately from training opt-outs. Do not remove a deliberate training
restriction or publish an llms.txt file on the assumption that it guarantees AI visibility.

For content changes, favor clear product facts, useful answers, demonstrable expertise, consistent
brand identity and attributable sources. Each recommendation needs a page and a user question it
helps answer. Do not fabricate reviews, citations or structured data, and do not recommend a new
schema type solely to chase a speculative AI score.

Verify a deployed technical change with SiteOS rechecks. Evaluate visibility changes only through
subsequent authorized, comparable prompt observations; model variation means one changed answer is
not proof of causation. Report Analytics referrals separately, including loss of referrer information
in apps and untagged links. Successful crawling, a brand mention and a human visit are different outcomes.

## AI Visibility

This is a separate application section from Prompt checks. Read category history and saved checks
with `--kind ai-rankings`; `--kind ai-visibility` reads only Prompt checks. Run/plan category input
still uses `kind: ai-visibility` plus `category`; existing prompt requests remain unchanged.

For a comparable product leaderboard, use one versioned category request. Each question is sent
once per selected platform; every product is evaluated on the same returned answers. The first
product is your own and must match `target` and `brand`. Include up to five competitors, three
explicit aliases per product, ten questions and four platforms. Domains may be shared by products;
product names and aliases must identify one product. Product and question IDs must be unique.

```json
{
  "kind": "ai-visibility",
  "target": "example.com",
  "brand": "Acme",
  "country": "US",
  "language": "en",
  "platforms": ["chat_gpt", "perplexity"],
  "category": {
    "version": "category-aeo-v2",
    "name": "Website analytics",
    "products": [
      { "id": "own", "name": "Acme", "domain": "example.com", "aliases": [] },
      { "id": "rival", "name": "Rival Metrics", "domain": "rival.example", "aliases": [] }
    ],
    "questions": [
      { "id": "q1", "text": "Which analytics tool would you recommend for a small SaaS team?" }
    ]
  }
}
```

Use the existing `research plan --input`, authorized `run --input`, `wait`, `show`, `export`, and
`saved` commands. No paid scorer or automatic paid retry is added. A malformed answer can still
consume credits when the provider charged for it. Saving or launching queues free favicon discovery;
reading reports and cached images never fetches competitor sites.

Read `run.categoryReport` from the server. Each row exposes `aeoScore` (already a percentage),
`scorePoints` and raw `visibility`, `firstChoice`, `alternatives`, `objections`, `citations`,
`uncertain` counts with a common `denominator`. Divide counts only when the denominator is positive;
otherwise report unavailable. First choice includes explicit co-primary choices, never list order.
Valid no-choice answers stay in the denominator; invalid or truncated answers remain inspectable
but unscored. Shared-domain citations do not prove which product was mentioned.

New `category-aeo-v2` follows [Frontier AEO Tracker's methodology](https://aeo.latent.space/methodology):
primary/co-primary 60 points, direct alternative 25, conditional/supporting/substantive incidental 15,
illustrative/neutral 0. Positive non-primary products receive 12.5/10/7.5/5/2.5 prominence points
for positions one to five in the actual supporting text. Explicit aliases are grouped first;
repeated mentions do not add points. Unsupported position evidence disables the answer's bonus.
Scenario rejection deducts 25; broad opposition 60. Edition/module/standalone/changed-condition
objections remain visible without automatic deductions. Conflicting positive and directional
negative evidence contributes zero directional points and is marked uncertain. Normalize by 60
and average valid question/platform observations. Negative scores are valid; product scores need
not sum to 100%. Visibility remains the separate mention rate.

The four tabs are **Rankings**, **Why they win**, **Queries & answers**, and **Research lenses**.
Rankings defaults to AEO score and First choice; More options exposes the other measures and
context-only mentions. Why they win groups recorded criteria and objections with source queries;
these are model claims, not verified product facts. Queries & answers exposes exact prompts,
complete answers, actual model/search settings, instructions, roles, score components and citations.
Research lenses compares considered versus chosen, models, questions, two products and sources.
Use source-query links and the product inspector to explain any number with its saved evidence.

The form can explicitly expand one scenario into six question frames: baseline, comparative
selection, conditional recommendation, direct fit, practitioner choice and tradeoff-led. Review
the exact generated wording and the ten-question limit before an authorized launch. Changing
questions creates a different comparison; filters never create new paid observations.

Historical `category-visibility-v1` reports remain readable without inferred roles or AEO scores.
Do not merge their visibility percentage with v2 scores. Changes use only common successful
questions with matching methodology, actual model and search settings. SiteOS uses annotations
from the same model API answer and verifies exact quote presence; it does not reproduce the
reference's separate extraction/review process or establish native-agent product usage.

JSON preserves this projection; CSV includes an additional `category-report` record containing it
in `data_json`, alongside the original evidence and failed parts. Preserve the version, model,
coverage and comparison denominator when interpreting or reformatting the report. Legacy single
prompt checks remain a different sampling method and cannot be merged into category scores.
