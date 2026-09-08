# AI search visibility

## Keep the observations distinct

| Evidence | What it can establish | What it cannot establish |
| --- | --- | --- |
| Site Audit: robots, public HTML, canonical and snippet policies | Technical accessibility and observable restrictions | Inclusion or a citation in an AI answer |
| Brand lookup | Mentions in the provider's returned corpus and context | Every answer shown to every user |
| Prompt checks | Mentions, citation URLs and answer evidence for a particular sampled prompt/platform | A permanent or universal AI rank |
| Analytics AI Assistants channel | Recorded visits with a recognized AI referrer or campaign signal | Total mentions, all AI visits, or which prompt caused an untagged visit |

Start with the requested question. Read saved Brand lookup or Prompt checks reports in the exact
Project/environment through `npx @siteoshq/cli seo research history --kind brand --json` and
`npx @siteoshq/cli seo research history --kind ai-visibility --json`, then read a returned ID with
`npx @siteoshq/cli seo research show <run-id> --json`. The interface and exports expose the same
evidence. Follow [research operations](search-research.md) for plan/run/wait/export and retry keys.
Do not configure an MCP server. New paid checks require authorized scope and
available research credits. A tool failure, unavailable model or missing answer is not a zero-mention
observation. Failed or incomplete reports must retain their coverage limitations.

## Prepare an AI request

Use separate JSON files for independent questions. Brand lookup searches the provider's corpus:

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
