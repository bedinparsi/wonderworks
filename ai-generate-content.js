#!/usr/bin/env node
/**
 * WonderWorks AI Content Generator
 *
 * Calls the Claude API to generate brand-new educational content for every
 * grade level, then writes content.json / content.js and patches index.html.
 *
 * Setup (one-time):
 *   npm install @anthropic-ai/sdk      (or:  npm init -y && npm i @anthropic-ai/sdk)
 *   export ANTHROPIC_API_KEY=sk-ant-…   (Windows: set ANTHROPIC_API_KEY=sk-ant-…)
 *
 * Run:
 *   node ai-generate-content.js
 *
 * Optional flags:
 *   --grade 3          Generate only Year 3 (keeps other grades from existing content.json)
 *   --model <id>       Override the Claude model (default: claude-sonnet-4-20250514)
 *   --dry-run          Generate but don't write files
 */

// ─── auto-install SDK if missing ────────────────────────────────────────────
try {
  require.resolve('@anthropic-ai/sdk');
} catch (_) {
  console.log('Installing @anthropic-ai/sdk …');
  require('child_process').execSync('npm install @anthropic-ai/sdk', {
    cwd: __dirname, stdio: 'inherit'
  });
}

const Anthropic = require('@anthropic-ai/sdk');
const fs   = require('fs');
const path = require('path');

// ─── configuration ──────────────────────────────────────────────────────────
const DIR        = __dirname;
const file       = (n) => path.join(DIR, n);
const args       = process.argv.slice(2);
const flag       = (name) => { const i = args.indexOf('--' + name); return i > -1 ? args[i + 1] : null; };
const hasFlag    = (name) => args.includes('--' + name);

const MODEL      = flag('model') || 'claude-sonnet-4-20250514';
const ONLY_GRADE = flag('grade');                       // e.g. "3"
const DRY_RUN    = hasFlag('dry-run');
const GRADES     = ONLY_GRADE ? [ONLY_GRADE] : ['1','2','3','4','5','6'];

// ─── topic distribution (40 slots per grade) ────────────────────────────────
// Each grade gets the SAME 40 topic/category slots.  The AI fills them at
// the correct curriculum complexity for the requested year level.
const TOPIC_SLOTS = [
  { topic: 'Mathematics',       cat: 'Numbers & Place Value' },
  { topic: 'Mathematics',       cat: 'Addition' },
  { topic: 'Mathematics',       cat: 'Subtraction' },
  { topic: 'Mathematics',       cat: 'Multiplication & Division' },
  { topic: 'Mathematics',       cat: 'Geometry — 2D Shapes' },
  { topic: 'Mathematics',       cat: 'Geometry — 3D Shapes & Space' },
  { topic: 'Mathematics',       cat: 'Measurement — Length' },
  { topic: 'Mathematics',       cat: 'Measurement — Mass & Capacity' },
  { topic: 'Mathematics',       cat: 'Patterns & Algebra' },
  { topic: 'Mathematics',       cat: 'Data & Statistics' },
  { topic: 'Mathematics',       cat: 'Fractions & Decimals' },
  { topic: 'Mathematics',       cat: 'Time & Money' },
  { topic: 'Biology',           cat: 'Animal Classification & Features' },
  { topic: 'Biology',           cat: 'Animal Life Cycles & Behaviour' },
  { topic: 'Biology',           cat: 'Plants & Photosynthesis' },
  { topic: 'Biology',           cat: 'Human Body' },
  { topic: 'Biology',           cat: 'Ecosystems & Habitats' },
  { topic: 'Geography',         cat: 'World Geography' },
  { topic: 'Geography',         cat: 'Australia' },
  { topic: 'Geography',         cat: 'Maps & Navigation' },
  { topic: 'Geography',         cat: 'Landforms & Water Systems' },
  { topic: 'Physics',           cat: 'Forces & Motion' },
  { topic: 'Physics',           cat: 'Light & Optics' },
  { topic: 'Physics',           cat: 'Sound & Vibrations' },
  { topic: 'Physics',           cat: 'Energy' },
  { topic: 'Physics',           cat: 'Electricity & Magnetism' },
  { topic: 'Chemistry',         cat: 'States of Matter' },
  { topic: 'Chemistry',         cat: 'Materials & Properties' },
  { topic: 'Chemistry',         cat: 'Changes & Reactions' },
  { topic: 'Ethics',            cat: 'Values & Fairness' },
  { topic: 'Ethics',            cat: 'Decision Making & Responsibility' },
  { topic: 'Sociology',         cat: 'Community & Government' },
  { topic: 'Sociology',         cat: 'Culture & Diversity' },
  { topic: 'History',           cat: 'Ancient Civilisations' },
  { topic: 'History',           cat: 'Australian History' },
  { topic: 'History',           cat: 'World Events & Inventions' },
  { topic: 'Computer Science',  cat: 'Computers & Hardware' },
  { topic: 'Computer Science',  cat: 'Coding & Algorithms' },
  { topic: 'Computer Science',  cat: 'Digital Literacy & AI' },
  { topic: 'Astronomy',         cat: 'Space & Earth Science' },
];

// Grade-specific maths guidance to ensure curriculum alignment
const MATH_GUIDANCE = {
  '1': 'Year 1 maths: numbers to 100, place value (tens/ones), addition & subtraction within 20, skip counting by 2s/5s/10s, describing 2D & 3D shape features, measuring with informal units, comparing mass, simple patterns, picture graphs/tally marks, halves & quarters, time to the half-hour, recognising Australian coins.',
  '2': 'Year 2 maths: numbers to 1000, two-digit addition/subtraction, introduction to multiplication as groups, 3D shape faces/edges, symmetry, measuring in cm, kg & L, growing number patterns, simple data tables, unit fractions (1/2, 1/3, 1/4), reading clocks to quarter-hour, adding coins.',
  '3': 'Year 3 maths: four-digit numbers, three-digit addition/subtraction, times tables (2-10), right angles, slides/flips/turns, perimeter, mL & L conversions, doubling/halving patterns, bar graphs, comparing fractions with same denominator, telling time to the minute.',
  '4': 'Year 4 maths: rounding to nearest 10/100, mental computation strategies, multi-digit multiplication, long division intro, angle types, grid coordinates, area of rectangles, unit conversions (km/m, kg/g), simple algebraic thinking (find the unknown), line graphs, equivalent fractions, 24-hour time.',
  '5': 'Year 5 maths: factors & multiples, adding/subtracting decimals, long multiplication, properties of quadrilaterals, angle measurement with protractor, volume of prisms, metric conversion, BODMAS order of operations, calculating the mean, adding fractions (same denominator), elapsed time, financial maths.',
  '6': 'Year 6 maths: prime & composite numbers, integers & negative numbers, index notation, ratios & rates, circle properties (radius/diameter/circumference), Cartesian coordinates, area of triangles & parallelograms, algebraic expressions, probability (0-1), fraction multiplication, speed/distance/time, percentages.',
};

// ─── media defaults (applied post-generation) ───────────────────────────────
const TOPIC_COLORS = {
  'Mathematics':      '#4A90D9',
  'Biology':          '#00B894',
  'Geography':        '#E17055',
  'Physics':          '#6C5CE7',
  'Chemistry':        '#E74C3C',
  'Ethics':           '#FDCB6E',
  'Sociology':        '#00CEC9',
  'History':          '#D35400',
  'Computer Science': '#0984E3',
  'Astronomy':        '#2C3E50',
};

const TOPIC_GRADIENTS = {
  'Mathematics':      ['linear-gradient(135deg,#4A90D9,#6BB9F0)','linear-gradient(135deg,#4A90D9,#74b9ff)','linear-gradient(135deg,#0984e3,#74b9ff)','linear-gradient(135deg,#6c5ce7,#a29bfe)','linear-gradient(135deg,#0984e3,#6c5ce7)','linear-gradient(135deg,#00cec9,#0984e3)','linear-gradient(135deg,#4A90D9,#81ecec)','linear-gradient(135deg,#e17055,#fdcb6e)','linear-gradient(135deg,#4A90D9,#dfe6e9)','linear-gradient(135deg,#fd79a8,#e84393)','linear-gradient(135deg,#00b894,#55efc4)','linear-gradient(135deg,#4A90D9,#a29bfe)'],
  'Biology':          ['linear-gradient(135deg,#00b894,#55efc4)','linear-gradient(135deg,#00b894,#81ecec)','linear-gradient(135deg,#00b894,#badc58)','linear-gradient(135deg,#a29bfe,#6c5ce7)','linear-gradient(135deg,#00b894,#e17055)'],
  'Geography':        ['linear-gradient(135deg,#0984e3,#00b894)','linear-gradient(135deg,#e17055,#fdcb6e)','linear-gradient(135deg,#e17055,#fab1a0)','linear-gradient(135deg,#0984e3,#00cec9)'],
  'Physics':          ['linear-gradient(135deg,#6c5ce7,#a29bfe)','linear-gradient(135deg,#fdcb6e,#f39c12)','linear-gradient(135deg,#6c5ce7,#fd79a8)','linear-gradient(135deg,#fdcb6e,#e17055)','linear-gradient(135deg,#636e72,#b2bec3)'],
  'Chemistry':        ['linear-gradient(135deg,#0984e3,#00cec9)','linear-gradient(135deg,#e74c3c,#fd79a8)','linear-gradient(135deg,#6c5ce7,#e74c3c)'],
  'Ethics':           ['linear-gradient(135deg,#fdcb6e,#ffeaa7)','linear-gradient(135deg,#fdcb6e,#00b894)'],
  'Sociology':        ['linear-gradient(135deg,#00cec9,#81ecec)','linear-gradient(135deg,#e17055,#fdcb6e)'],
  'History':          ['linear-gradient(135deg,#d35400,#e17055)','linear-gradient(135deg,#d35400,#fdcb6e)','linear-gradient(135deg,#d35400,#e74c3c)'],
  'Computer Science': ['linear-gradient(135deg,#0984e3,#74b9ff)','linear-gradient(135deg,#0984e3,#00cec9)','linear-gradient(135deg,#0984e3,#6c5ce7)'],
  'Astronomy':        ['linear-gradient(135deg,#2c3e50,#6c5ce7)'],
};

const TOPIC_ICONS = {
  'Mathematics':      ['🔢','➕','➖','✖️','🔷','📦','📏','⚖️','🔄','📊','🍕','🕐'],
  'Biology':          ['🐾','🦋','🌱','💪','🌿'],
  'Geography':        ['🌍','🦘','🗺️','🏔️'],
  'Physics':          ['💪','💡','🔊','⚡','🧲'],
  'Chemistry':        ['🧊','🧱','🔥'],
  'Ethics':           ['🤝','💭'],
  'Sociology':        ['🏘️','🌏'],
  'History':          ['🏛️','🎨','🚀'],
  'Computer Science': ['💻','🤖','🛡️'],
  'Astronomy':        ['🌙'],
};

const ANIMATIONS = ['bounce','pulse','slide-left','slide-right','spin','float','shake','fade-in'];

function applyMedia(items) {
  const counters = {};
  items.forEach((item, i) => {
    const t = item.topic;
    counters[t] = (counters[t] || 0);
    const idx = counters[t]++;
    const icons = TOPIC_ICONS[t]  || ['📚'];
    const grads = TOPIC_GRADIENTS[t] || [`linear-gradient(135deg,${TOPIC_COLORS[t] || '#6C5CE7'},#aaa)`];
    item.media = {
      icon:       icons[idx % icons.length],
      animation:  ANIMATIONS[(i * 3 + idx) % ANIMATIONS.length],
      color:      TOPIC_COLORS[t] || '#6C5CE7',
      bgGradient: grads[idx % grads.length],
    };
  });
}

// ─── system prompt (cached across all 6 calls) ─────────────────────────────
const SYSTEM_PROMPT = `You are an expert Australian primary-school curriculum designer. Your task is to produce educational content in JSON format for the WonderWorks learning app.

RESPONSE FORMAT — respond with ONLY a raw JSON array.  No markdown fences, no commentary, no text before or after the array.  The response must start with [ and end with ].

Each element of the array must be an object with exactly these keys:
{
  "id": <integer 1-40>,
  "topic": "<exact topic string from the list provided>",
  "category": "<subcategory>",
  "title": "<short, engaging title — max 6 words>",
  "tip": "<2-4 sentences of genuinely educational content: explain a concept, use a vivid analogy or real-world example, age-appropriate vocabulary>",
  "question": {
    "text": "<clear multiple-choice question that tests understanding of the tip>",
    "options": ["<A>","<B>","<C>","<D>"],
    "correct": <0-3 integer index of the correct option>,
    "explanation": "<1-2 sentence explanation of why the correct answer is right>"
  }
}

QUALITY RULES:
1. Align content to the AUSTRALIAN CURRICULUM.  Use Australian English ("colour" not "color", "metres" not "meters").  Reference Australian animals, places, sports, and culture where relevant.
2. Tips must TEACH something concrete — not just name a topic.  Include a fact, formula, analogy, or worked example.
3. Questions must genuinely test the tip content.  Avoid trivial yes/no questions.  All four options must be plausible.
4. VARY the correct-answer position across items.  Do NOT cluster correct answers on the same index.
5. Each tip & question must be UNIQUE and DIFFERENT from common textbook examples.  Be creative.
6. Never repeat the same concept across items — each of the 40 items covers a distinct idea.
7. The "id" field must run sequentially from 1 to 40.`;

// ─── per-grade user prompt ──────────────────────────────────────────────────
function buildPrompt(grade) {
  const ages = { '1':'5-7','2':'6-8','3':'7-9','4':'8-10','5':'9-11','6':'10-12' };
  const topicList = TOPIC_SLOTS.map((s, i) =>
    `${i + 1}. topic="${s.topic}", category="${s.cat}"`
  ).join('\n');

  return `Generate exactly 40 educational items for **Year ${grade}** (ages ${ages[grade]}) in an Australian primary school.

MATHS-SPECIFIC GUIDANCE FOR THIS YEAR LEVEL:
${MATH_GUIDANCE[grade]}

NON-MATHS GUIDANCE:
- Biology, Physics, Chemistry, Geography, History, Ethics, Sociology, Computer Science, and Astronomy content must be calibrated for ages ${ages[grade]}.
- Year ${grade} students ${parseInt(grade) <= 2 ? 'are early readers — use short, clear sentences and concrete examples' : parseInt(grade) <= 4 ? 'can handle moderate vocabulary — use clear explanations with real-world connections' : 'can handle richer vocabulary, abstract reasoning, and multi-step concepts'}.

TOPIC SEQUENCE (each item MUST use the topic and category exactly as listed):
${topicList}

Remember: respond with ONLY a JSON array of 40 objects.  Start with [ and end with ].`;
}

// ─── API call with retry ────────────────────────────────────────────────────
async function callAPI(client, grade, attempt = 1) {
  const MAX_RETRIES = 3;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16384,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildPrompt(grade) }],
    });

    // Extract text
    let text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Strip code fences if the model wrapped the JSON
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const items = JSON.parse(text);

    // Validate
    if (!Array.isArray(items)) throw new Error('Response is not an array');
    if (items.length !== 40)   throw new Error(`Expected 40 items, got ${items.length}`);
    items.forEach((it, i) => {
      if (!it.topic || !it.title || !it.tip || !it.question)
        throw new Error(`Item ${i + 1} missing required fields`);
      if (!Array.isArray(it.question.options) || it.question.options.length !== 4)
        throw new Error(`Item ${i + 1}: question must have exactly 4 options`);
      if (typeof it.question.correct !== 'number' || it.question.correct < 0 || it.question.correct > 3)
        throw new Error(`Item ${i + 1}: correct must be 0-3`);
      // Normalise id
      it.id = i + 1;
    });

    // Log token usage
    const usage = response.usage || {};
    const cached = usage.cache_read_input_tokens || 0;
    console.log(` ${items.length} items | tokens: ${usage.input_tokens || '?'} in (${cached} cached) / ${usage.output_tokens || '?'} out`);

    return items;

  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.log(` attempt ${attempt} failed (${err.message}), retrying…`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
      return callAPI(client, grade, attempt + 1);
    }
    throw new Error(`Year ${grade} failed after ${MAX_RETRIES} attempts: ${err.message}`);
  }
}

// ─── file writers (same logic as generate-content.js) ───────────────────────
function writeFiles(content) {
  const json = JSON.stringify(content, null, 2);

  // 1. content.json
  fs.writeFileSync(file('content.json'), json, 'utf8');
  console.log(`  Wrote content.json  (${(Buffer.byteLength(json) / 1024).toFixed(0)} KB)`);

  // 2. content.js
  const js = `const CONTENT = ${json};\n`;
  fs.writeFileSync(file('content.js'), js, 'utf8');
  console.log(`  Wrote content.js   (${(Buffer.byteLength(js) / 1024).toFixed(0)} KB)`);

  // 3. index.html (marker-based replacement)
  const htmlPath = file('index.html');
  if (!fs.existsSync(htmlPath)) { console.warn('  index.html not found — skipped'); return; }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const S = '/* __CONTENT_START__ */';
  const E = '/* __CONTENT_END__ */';
  const si = html.indexOf(S);
  const ei = html.indexOf(E);
  if (si === -1 || ei === -1) { console.error('  Markers missing in index.html — skipped'); return; }

  html = html.slice(0, si + S.length) + '\nconst CONTENT = ' + json + ';\n' + html.slice(ei);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`  Updated index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
}

// ─── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log();
  console.log('  WonderWorks AI Content Generator');
  console.log('  ================================');
  console.log(`  Model : ${MODEL}`);
  console.log(`  Grades: ${GRADES.join(', ')}`);
  console.log();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('  ERROR: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('  Set it with:  export ANTHROPIC_API_KEY=sk-ant-…');
    console.error('  (Windows:     set ANTHROPIC_API_KEY=sk-ant-…  )');
    process.exit(1);
  }

  const client = new Anthropic();

  // Load existing content so we can keep grades we're not regenerating
  let content = {};
  if (fs.existsSync(file('content.json'))) {
    try { content = JSON.parse(fs.readFileSync(file('content.json'), 'utf8')); } catch (_) {}
  }

  const t0 = Date.now();
  for (const grade of GRADES) {
    process.stdout.write(`  Year ${grade} …`);
    const start = Date.now();
    const items = await callAPI(client, grade);
    applyMedia(items);
    content[grade] = items;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`         (${elapsed}s)`);
  }
  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log();

  if (DRY_RUN) {
    console.log('  --dry-run: skipping file writes');
    console.log('  Sample Year ' + GRADES[0] + ' item 1:', JSON.stringify(content[GRADES[0]][0], null, 2).slice(0, 300) + '…');
  } else {
    writeFiles(content);
  }

  // Summary
  console.log();
  console.log('  Summary');
  console.log('  -------');
  const topics = new Set();
  let total = 0;
  for (const [g, items] of Object.entries(content)) {
    items.forEach(i => topics.add(i.topic));
    total += items.length;
    // Check answer distribution
    const dist = [0, 0, 0, 0];
    items.forEach(i => dist[i.question.correct]++);
    console.log(`  Year ${g}: ${items.length} items  (answer spread: A=${dist[0]} B=${dist[1]} C=${dist[2]} D=${dist[3]})`);
  }
  console.log(`  Total : ${total} items across ${topics.size} subjects in ${totalTime}s`);
  console.log();
}

main().catch(err => {
  console.error('\n  FATAL:', err.message);
  process.exit(1);
});
