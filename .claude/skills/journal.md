# journal

Append a new entry to JOURNAL.md. The user writes the content in their own words; you fix grammar, tighten sentences, and sharpen clarity — but keep their voice and tone intact. Do not restructure into bullet points or add sections they didn't ask for.

## What this skill does

1. Ask the user for the step number, title, date, and duration if not provided as args.
2. Ask the user to write the entry body in their own words (a paragraph or two is fine).
3. Polish the text: fix grammar, remove filler, sharpen word choice — without changing the meaning or tone.
4. Show the user the edited version and ask for approval before writing.
5. Append the approved entry to JOURNAL.md.

## Entry format

```markdown
## Step N — <Title>
**Date:** YYYY-MM-DD
**Duration:** <e.g. ~2 hr>
**PR:** <link or *(TBD)*>

<user's text, polished>

---
```

Keep the body as free-flowing prose. No bullet lists, no sub-headings, no structured decision tables — unless the user explicitly writes them that way.

## Editing guidelines

- Fix grammar and spelling.
- Remove redundant words and filler phrases.
- Prefer concrete, direct language over vague hedging.
- Do not add information the user didn't provide.
- Do not change the user's stance, opinions, or reasoning — only the expression.
- If a sentence is already clear and punchy, leave it alone.

## Time tracking

- Duration is wall-clock time (design + reading + debugging, not just coding).
- Accept approximate values: `~45 min`, `~2 hr`, `~3 hr across 2 sessions`.
- For pre-repo steps, note the date as `YYYY-MM-DD (pre-repo)`.

## Usage

```
/journal
```

Claude will ask for step details and then the entry text interactively.

Or with args:

```
/journal step=3 title="Add shared types" date=2026-06-18 duration="~1 hr" pr="https://..."
```

Then provide the body text when prompted.

## Rules

- Only append — never edit existing entries.
- Always show the polished text to the user for approval before writing to the file.
- One entry per step / PR.
