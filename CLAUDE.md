# WonderWorks — Claude Working Context

This file is Claude's own reference for continuing work on the WonderWorks project.
It captures architecture decisions, file relationships, key line numbers, gotchas,
and ideas that aren't obvious from reading the code alone.

---

## What WonderWorks Is

A kids educational SPA for Australian primary school (Years 1-6). Single HTML file,
no framework, no build step.  The student enters name + grade, then works through
40 tips with multiple-choice questions.  Score is tracked, progress persists in
localStorage, and a detailed performance report is generated as downloadable markdown.

The owner is Mo (m.partovi@accenture.com). Target audience: his kids / young learners.
iPad is the primary device — every UI decision should be touch-first.

---

## File Map

```
WonderWorks/
  index.html              The entire SPA — CSS + HTML + JS + embedded content data
  content.json            Canonical educational content (240 items, 40 per grade)
  content.js              Same data as JS variable, legacy loader for <script src>
  generate-content.js     Manual content pipeline — hardcoded Year 1 & 2 arrays,
                          reads Years 3-6 from content.json, writes all output files
  ai-generate-content.js  AI pipeline — calls Claude API to regenerate all content,
                          writes content.json + content.js + patches index.html
  CLAUDE.md               This file
```

### How files relate

```
  ai-generate-content.js ──┐
                            ├──> content.json ──> content.js
  generate-content.js ──────┘         │
                                      v
                              index.html (embedded between markers)
```

Both generator scripts produce the same outputs. The AI script is the "regenerate
everything fresh" path; the manual script is for hand-curated edits.

---

## index.html Architecture

The file is ~7,100 lines and ~260 KB.  Structure (by line region):

| Lines        | Section                                  |
|--------------|------------------------------------------|
| 1-552        | `<style>` — all CSS (responsive, iPad, dark mode, animations) |
| 553-653      | `<body>` HTML — three page `<div>`s: `#page-entry`, `#page-learning`, `#page-results` |
| 655-6464     | `<script>` — embedded CONTENT data (between `__CONTENT_START__` / `__CONTENT_END__` markers) |
| 6464-7149    | `<script>` — application JavaScript |

### CSS Design Tokens (`:root`)

```
--primary: #6C5CE7    --secondary: #00B894    --accent: #FDCB6E
--danger: #FF6B6B     --bg: #F0F3FF          --radius: 16px
```

Dark mode is supported via `@media (prefers-color-scheme: dark)`.

### Key CSS Breakpoints

- Mobile: `max-width: 600px`
- iPad: `min-width: 700px and max-width: 1100px` (primary target)
- iPad landscape: `min-width: 1000px and max-height: 900px`

### Page IDs

- `#page-entry` — name input, grade selection (Year 1-6 buttons), resume banner
- `#page-learning` — top bar (progress, timer, score), tip card, question card
- `#page-results` — score, star rating, subject breakdown, download report button

### JavaScript Functions (index.html)

| Function | Purpose |
|---|---|
| `init()` | Bootstrap: floating icons, event listeners, resume check |
| `selectGrade(grade)` | Toggle grade button selection |
| `checkReady()` | Enable/disable Start button based on name + grade |
| `checkForResume()` | Scan localStorage for `ww_progress_*` matching name+grade |
| `startAdventure()` | Reset state, load content for grade, show first question |
| `resumeAdventure()` | Restore state from localStorage, continue where left off |
| `showPage(id)` | SPA page routing — toggles `.active` class |
| `loadQuestion(index)` | Render tip card + question card for item at index |
| `selectOption(index)` | Highlight selected answer (pre-submit) |
| `submitAnswer()` | Grade answer, record in `state.answers[]`, show feedback |
| `nextQuestion()` | Advance index or show results |
| `speakTip()` | Web Speech API — reads tip + question aloud |
| `startTotalTimer()` | setInterval updating timer badge every second |
| `showResults()` | Calculate stats, render results page, trigger confetti |
| `generateMarkdown(...)` | Build detailed performance report as markdown string |
| `saveProgress()` | Write current state to `localStorage` key `ww_progress_{name}_{grade}` |
| `saveCompletedSession(...)` | Write report to `localStorage`, append to `ww_history` |
| `downloadReport()` | Create Blob from markdown, trigger `<a>` download |
| `launchConfetti()` | Canvas-based confetti animation (150 particles) |
| `miniConfetti()` | Small burst near score badge on correct answer |
| `formatTime(secs)` | Returns `m:ss` string |

### State Object

```javascript
state = {
  name, grade, currentIndex, score,
  content: [],        // 40 items for the selected grade
  answers: [],        // { id, topic, category, title, questionText, selected, selectedText, correct, correctText, isCorrect, timeSec }
  selectedOption,     // null or 0-3
  answered,           // bool — has current question been submitted
  startTime,          // Date.now() at adventure start
  questionStartTime,  // Date.now() when current question loaded
  timerInterval,
  totalTimerInterval,
  resumeKey           // localStorage key for resumable session
}
```

### localStorage Keys

| Pattern | Purpose |
|---|---|
| `ww_progress_{name}_{grade}` | In-progress session (deleted on completion) |
| `ww_report_{name}_Year{grade}_{datetime}` | Completed session markdown report |
| `ww_history` | JSON array of session summary objects |

### Content Data Shape

Each item in the CONTENT arrays:
```json
{
  "id": 1,
  "topic": "Mathematics",
  "category": "Place Value",
  "title": "Tens and Ones",
  "tip": "Educational paragraph...",
  "media": {
    "icon": "🔢",
    "animation": "bounce",
    "color": "#4A90D9",
    "bgGradient": "linear-gradient(135deg,#4A90D9,#6BB9F0)"
  },
  "question": {
    "text": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Why A is right..."
  }
}
```

### Content Markers

The embedded content in `index.html` sits between these two comment markers:
```
/* __CONTENT_START__ */
const CONTENT = { ... };
/* __CONTENT_END__ */
```
Both generator scripts use these markers for replacement.  Never remove them.

---

## Topic Distribution Per Grade (40 items)

| Slots | Subject | Count |
|---|---|---|
| 1-12 | Mathematics (12 distinct branches) | 12 |
| 13-17 | Biology | 5 |
| 18-21 | Geography | 4 |
| 22-26 | Physics | 5 |
| 27-29 | Chemistry | 3 |
| 30-31 | Ethics | 2 |
| 32-33 | Sociology | 2 |
| 34-36 | History | 3 |
| 37-39 | Computer Science | 3 |
| 40 | Astronomy | 1 |

Topic colour scheme (used in tip card headers and subject breakdown bars):
```
Mathematics: #4A90D9   Biology: #00B894    Geography: #E17055
Physics: #6C5CE7       Chemistry: #E74C3C  Ethics: #D4A017
Sociology: #00CEC9     History: #D35400    CS: #0984E3
Astronomy: #2C3E50
```

---

## Content Generation Pipelines

### Manual: `generate-content.js`

- Year 1 & 2: hardcoded arrays using `tip()` and `q()` helper functions
- Year 3-6: loaded from existing `content.json`
- Writes: `content.json`, `content.js`, patches `index.html`
- Run: `node generate-content.js`

### AI: `ai-generate-content.js`

- Calls Claude API (default model: `claude-sonnet-4-20250514`)
- 1 API call per grade, 6 total, sequential (for prompt caching benefit)
- System prompt cached with `cache_control: { type: 'ephemeral' }`
- Response: raw JSON array of 40 items (no media — applied post-hoc by `applyMedia()`)
- Validates: array length, required fields, options count, correct index range
- Retry: up to 3 attempts per grade with exponential backoff
- Flags: `--grade N` (single grade), `--model <id>`, `--dry-run`
- Writes: `content.json`, `content.js`, patches `index.html`
- Requires: `npm install @anthropic-ai/sdk` + `ANTHROPIC_API_KEY` env var

---

## Decisions & Rationale

| Decision | Why |
|---|---|
| Single HTML file with embedded data | Works on iPad from iCloud/email/AirDrop with zero server |
| `content.json` as separate canonical file | Editable reference; AI script writes here first |
| `__CONTENT_START__`/`__CONTENT_END__` markers | Reliable find-and-replace for content injection |
| Web Speech API for read-aloud | No audio files needed; works offline |
| CSS animations only (no JS animation libs) | Zero dependencies, fast, works everywhere |
| localStorage for persistence | No server needed; works from file:// |
| Markdown for performance reports | Human-readable, downloadable, no server needed |
| Year 1 curriculum upgrade | Mo noted that counting to 20 is kindergarten, not Year 1. Now aligned to Australian Curriculum (place value to 100, addition/subtraction within 20, skip counting, etc.) |
| Separate AI generation script | Keeps the SPA dependency-free; AI generation is an offline build step |

---

## Gotchas & Things to Watch

1. **Exit code 1 from Bash on this machine** — Mo's Windows setup has a sandbox temp-file
   issue (`/c/Users/MDFD0~1.PAR/AppData/Local/Temp/claude-*-cwd: No such file or directory`).
   The commands themselves succeed — always check the actual stdout, not just exit code.

2. **file:// CORS** — `fetch()` and `XMLHttpRequest` don't work from `file://` in Chrome.
   That's why the content is embedded directly in the HTML, not loaded from content.json at
   runtime. The `<script src="content.js">` approach works from file:// for `<script>` tags
   specifically, but we moved to full embedding for reliability on iPad.

3. **iPad Safari quirks** — `user-scalable=no` prevents accidental zoom while tapping
   buttons. `viewport-fit=cover` + `env(safe-area-inset-*)` handles the notch/home bar.
   `apple-mobile-web-app-capable` enables full-screen when added to home screen.

4. **content.js still exists** — it's a legacy file from the original 3-file architecture.
   Both generators still write it for backward compatibility, but index.html no longer
   references it. Could be removed in future cleanup.

5. **generate-content.js Year 2** — The Year 2 array in generate-content.js was defined
   inline but is identical to what was in the original content.json. If running
   `ai-generate-content.js`, the AI-generated Year 2 will overwrite it in content.json,
   and running `generate-content.js` afterward would revert it to the hardcoded version.
   These two scripts don't compose — pick one pipeline per run.

6. **Dark mode** — Supported via `prefers-color-scheme: dark` media query. Not manually
   toggleable yet. The colour overrides are at the bottom of the `<style>` block.

7. **Keyboard shortcuts** — A/B/C/D or 1/2/3/4 select options, Enter submits or advances.
   These are wired in a `document.addEventListener('keydown', ...)` at the bottom of the
   script section.

---

## Potential Future Enhancements

These are ideas that came up during development or that Mo might request:

- **Difficulty scaling** — track which topics the student struggles with and serve
  more questions in those areas (adaptive learning)
- **Leaderboard** — localStorage-based hall of fame showing best scores per grade
- **Sound effects** — Web Audio API for correct/wrong sounds (beep/buzz)
- **Animated mascot** — a CSS/SVG character that reacts to answers (cheers, thinks)
- **YouTube video embeds** — the `media.videoUrl` field exists in the schema but is unused;
  could embed short educational clips for select tips
- **Print-friendly report** — add `@media print` styles for the results page
- **PWA manifest** — add `manifest.json` + service worker for offline install on iPad
- **Timer pressure mode** — optional countdown per question for older students
- **Multi-language** — the content JSON structure supports it; would need i18n for UI strings
- **Parent dashboard** — a separate page that reads `ww_history` from localStorage and
  shows progress over time across multiple sessions
- **Randomised question order** — shuffle the 40 items so repeated attempts feel fresh
- **Export to CSV** — alternative to markdown report for spreadsheet analysis

---

## Repo Context

- Working directory: `C:\Users\m.partovi\Documents\mo`
- Git: repo exists with at least one commit (`2037126 Initial commit`)
- Branch: `master` (main branch is `main`)
- The `WonderWorks/` folder is a subfolder of the `mo` repo
