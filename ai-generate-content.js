#!/usr/bin/env node
/**
 * WonderWorks AI Content Generator (OpenAI)
 *
 * Calls the OpenAI API to generate brand-new educational content for every
 * grade level, then writes content.json / content.js and patches index.html.
 *
 * Output shape (new):
 *   { "1": [[20 items], [20 items], ...], "2": [...], ... }
 * Each grade holds an array of SETS; each set is 20 items.  The SPA picks
 * a random non-empty set per session.
 *
 * Setup (one-time):
 *   npm install openai
 *   export OPENAI_API_KEY=sk-…       (Windows PowerShell: $env:OPENAI_API_KEY="sk-…")
 *                                    (Windows cmd.exe:    set OPENAI_API_KEY=sk-…)
 *
 * Run:
 *   node ai-generate-content.js
 *
 * Optional flags:
 *   --grade N          Only Year N (1-6)
 *   --set K            Only set K (1-based, 1..SETS_PER_GRADE)
 *   --sets N           How many sets per grade to produce (default 10)
 *   --model <id>       OpenAI model (default: gpt-4o-mini)
 *   --dry-run          Generate but don't write files
 *
 * Notes:
 *   - One API call per (grade, set).  With defaults that's 6 × 10 = 60 calls.
 *   - Rejected items (failing anti-leak / validation) trigger an automatic retry
 *     up to MAX_RETRIES.  See QUALITY RULES in SYSTEM_PROMPT.
 */

// ─── auto-install SDK if missing ────────────────────────────────────────────
try {
  require.resolve('openai');
} catch (_) {
  console.log('Installing openai …');
  require('child_process').execSync('npm install openai', {
    cwd: __dirname, stdio: 'inherit'
  });
}

const OpenAI = require('openai');
const fs     = require('fs');
const path   = require('path');

// ─── configuration ──────────────────────────────────────────────────────────
const DIR        = __dirname;
const file       = (n) => path.join(DIR, n);
const args       = process.argv.slice(2);
const flag       = (name) => { const i = args.indexOf('--' + name); return i > -1 ? args[i + 1] : null; };
const hasFlag    = (name) => args.includes('--' + name);

const MODEL           = flag('model') || 'gpt-4o-mini';
const ONLY_GRADE      = flag('grade');
const ONLY_SET        = flag('set') ? parseInt(flag('set'), 10) : null;   // 1-based
const SETS_PER_GRADE  = parseInt(flag('sets') || '10', 10);
const ITEMS_PER_SET   = 20;
const DRY_RUN         = hasFlag('dry-run');
const GRADES          = ONLY_GRADE ? [ONLY_GRADE] : ['1','2','3','4','5','6'];
const SET_INDICES     = ONLY_SET ? [ONLY_SET - 1] : Array.from({length: SETS_PER_GRADE}, (_, i) => i);

// ─── topic distribution (20 slots per set) ──────────────────────────────────
// Same 20-slot template for every set; Ethics and Sociology alternate by set index.
function topicSlotsForSet(setIndex) {
  const ethicsOrSoc = (setIndex % 2 === 0)
    ? { topic: 'Ethics',    cat: 'Values & Fairness' }
    : { topic: 'Sociology', cat: 'Community & Diversity' };
  return [
    // Maths (6)
    { topic: 'Mathematics',       cat: 'Numbers & Place Value' },
    { topic: 'Mathematics',       cat: 'Addition & Subtraction' },
    { topic: 'Mathematics',       cat: 'Multiplication & Division' },
    { topic: 'Mathematics',       cat: 'Geometry & Shapes' },
    { topic: 'Mathematics',       cat: 'Measurement' },
    { topic: 'Mathematics',       cat: 'Fractions, Decimals & Data' },
    // Sciences (6)
    { topic: 'Biology',           cat: 'Living Things' },
    { topic: 'Biology',           cat: 'Ecosystems & Adaptation' },
    { topic: 'Physics',           cat: 'Forces & Energy' },
    { topic: 'Physics',           cat: 'Light & Sound' },
    { topic: 'Chemistry',         cat: 'States of Matter' },
    { topic: 'Chemistry',         cat: 'Materials & Changes' },
    // Humanities (4)
    { topic: 'Geography',         cat: 'Places & Maps' },
    { topic: 'Geography',         cat: 'Environment & Landforms' },
    { topic: 'History',           cat: 'Australia & The World' },
    { topic: 'History',           cat: 'Inventions & Ideas' },
    // Creative / Digital / Society (3)
    { topic: 'Art',               cat: 'Making & Appreciating Art' },
    { topic: 'Computer Science',  cat: 'Thinking Like a Computer' },
    ethicsOrSoc,
    // Space (1)
    { topic: 'Astronomy',         cat: 'Our Place in Space' },
  ];
}

// Grade-specific guidance
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
  'Art':              '#FF6B9D',
  'Computer Science': '#0984E3',
  'Astronomy':        '#2C3E50',
};

const TOPIC_GRADIENTS = {
  'Mathematics':      ['linear-gradient(135deg,#4A90D9,#6BB9F0)','linear-gradient(135deg,#4A90D9,#74b9ff)','linear-gradient(135deg,#0984e3,#74b9ff)','linear-gradient(135deg,#6c5ce7,#a29bfe)','linear-gradient(135deg,#0984e3,#6c5ce7)','linear-gradient(135deg,#00cec9,#0984e3)'],
  'Biology':          ['linear-gradient(135deg,#00b894,#55efc4)','linear-gradient(135deg,#00b894,#81ecec)'],
  'Geography':        ['linear-gradient(135deg,#0984e3,#00b894)','linear-gradient(135deg,#e17055,#fdcb6e)'],
  'Physics':          ['linear-gradient(135deg,#6c5ce7,#a29bfe)','linear-gradient(135deg,#fdcb6e,#f39c12)'],
  'Chemistry':        ['linear-gradient(135deg,#0984e3,#00cec9)','linear-gradient(135deg,#e74c3c,#fd79a8)'],
  'Ethics':           ['linear-gradient(135deg,#fdcb6e,#ffeaa7)'],
  'Sociology':        ['linear-gradient(135deg,#00cec9,#81ecec)'],
  'History':          ['linear-gradient(135deg,#d35400,#e17055)','linear-gradient(135deg,#d35400,#fdcb6e)'],
  'Art':              ['linear-gradient(135deg,#ff6b9d,#fdcb6e)'],
  'Computer Science': ['linear-gradient(135deg,#0984e3,#74b9ff)'],
  'Astronomy':        ['linear-gradient(135deg,#2c3e50,#6c5ce7)'],
};

const TOPIC_ICONS = {
  'Mathematics':      ['🔢','➕','✖️','🔷','📏','🍕'],
  'Biology':          ['🌱','🦋'],
  'Geography':        ['🌍','🗺️'],
  'Physics':          ['⚡','💡'],
  'Chemistry':        ['🧪','🔥'],
  'Ethics':           ['🤝'],
  'Sociology':        ['🏘️'],
  'History':          ['🏛️','🚀'],
  'Art':              ['🎨'],
  'Computer Science': ['💻'],
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

// ─── system prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert Australian primary-school curriculum designer. Your task is to produce educational content in JSON format for the WonderWorks learning app.

RESPONSE FORMAT — respond with ONLY a raw JSON array. No markdown fences, no commentary, no text before or after the array. The response must start with [ and end with ].

Each element must be an object with exactly these keys:
{
  "id": <integer 1-20>,
  "topic": "<exact topic string from the list provided>",
  "category": "<subcategory>",
  "title": "<short, engaging title — max 6 words>",
  "tip": "<2-4 sentences of genuinely educational content that TEACHES the concept without revealing the specific answer to the question below>",
  "question": {
    "text": "<clear multiple-choice question that tests understanding, NOT recognition of a phrase from the tip>",
    "options": ["<A>","<B>","<C>","<D>"],
    "correct": <0-3 integer index of the correct option>,
    "explanation": "<1-2 sentence explanation of why the correct answer is right>"
  }
}

CRITICAL ANTI-LEAK RULES — THIS IS THE MOST IMPORTANT CONSTRAINT:
• The tip must NOT contain the correct answer verbatim, nor a close paraphrase.
• The tip must NOT solve the exact numeric/worded problem that the question asks.
  BAD : tip says "15 − 7 = 8", question asks "What is 15 − 7?"
  GOOD: tip explains the subtraction strategy with DIFFERENT numbers (e.g. 12 − 5), then the question asks "What is 15 − 7?".
• If the tip uses a worked example, the question MUST use DIFFERENT numbers / different example.
• If the answer is a key term (e.g. "refraction", "hibernation"), the tip should introduce the concept but NOT state the exact term as the matching label for the question's scenario. Teach the principle; let the student make the connection.
• Distractors (wrong options) must be plausible — not obviously silly.

OTHER QUALITY RULES:
1. Align content to the AUSTRALIAN CURRICULUM. Use Australian English ("colour", "metres"). Reference Australian animals, places, and culture where relevant.
2. Tips must TEACH — include a fact, analogy, or concrete example.
3. VARY the correct-answer position (do NOT cluster correct answers on the same index).
4. Each tip & question must be UNIQUE and cover a distinct idea.
5. The "id" field must run sequentially from 1 to 20.`;

// ─── per-call user prompt ───────────────────────────────────────────────────
function buildPrompt(grade, setIndex) {
  const ages = { '1':'5-7','2':'6-8','3':'7-9','4':'8-10','5':'9-11','6':'10-12' };
  const slots = topicSlotsForSet(setIndex);
  const topicList = slots.map((s, i) =>
    `${i + 1}. topic="${s.topic}", category="${s.cat}"`
  ).join('\n');

  return `Generate exactly 20 educational items for **Year ${grade}** (ages ${ages[grade]}) in an Australian primary school.

This is SET ${setIndex + 1} of ${SETS_PER_GRADE} — each set must cover the same curriculum breadth but with FRESH examples, different worked problems, and different question wordings from any other set a student might have seen.

MATHS-SPECIFIC GUIDANCE FOR THIS YEAR LEVEL:
${MATH_GUIDANCE[grade]}

NON-MATHS GUIDANCE:
- Biology, Physics, Chemistry, Geography, History, Art, Ethics, Sociology, Computer Science, and Astronomy content must be calibrated for ages ${ages[grade]}.
- Year ${grade} students ${parseInt(grade) <= 2 ? 'are early readers — use short, clear sentences and concrete examples' : parseInt(grade) <= 4 ? 'can handle moderate vocabulary — use clear explanations with real-world connections' : 'can handle richer vocabulary, abstract reasoning, and multi-step concepts'}.

TOPIC SEQUENCE (each item MUST use the topic and category exactly as listed):
${topicList}

REMEMBER: the tip must NOT leak the answer. If the question asks "What is 15 − 7?", the tip must teach subtraction WITHOUT computing 15 − 7 anywhere.

Respond with ONLY a JSON array of 20 objects. Start with [ and end with ].`;
}

// ─── anti-leak post-validation ──────────────────────────────────────────────
// Normalise: lowercase, strip punctuation, collapse whitespace.
function norm(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectLeak(item) {
  const tip      = norm(item.tip);
  const qText    = norm(item.question.text);
  const correct  = item.question.options[item.question.correct];
  const ansNorm  = norm(correct);

  // 1. "= <answer>" pattern in tip — classic maths leak.
  //    Catches "15 − 7 = 8" when answer is "8".
  const rawTip = String(item.tip);
  const mathLeak = new RegExp(`=\\s*${ansNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(norm(rawTip));
  if (mathLeak && ansNorm.length > 0) return `tip contains "= ${correct}" (maths answer leaked)`;

  // 2. Answer is a distinctive word/phrase (not "yes/no/true/false/A/B/C/D/a number alone")
  //    that appears verbatim in the tip.
  const trivialAnswers = new Set(['yes','no','true','false','a','b','c','d']);
  if (!trivialAnswers.has(ansNorm) && ansNorm.length >= 4 && !/^\d+(\.\d+)?$/.test(ansNorm)) {
    if (tip.includes(ansNorm)) return `tip contains answer phrase "${correct}"`;
  }

  // 3. Question contains the same numeric expression whose result is written in the tip.
  //    e.g. question "What is 42 − 17?", tip has "42 − 17 = 25".
  const nums = rawTip.match(/\b\d+\s*[−\-+×x*÷/]\s*\d+\s*=\s*\d+/g);
  if (nums) {
    for (const expr of nums) {
      const lhs = expr.split('=')[0].replace(/\s+/g, '');
      const qCollapsed = String(item.question.text).replace(/\s+/g, '');
      if (qCollapsed.includes(lhs)) return `tip solves "${expr.trim()}" which matches the question`;
    }
  }

  return null;
}

// ─── API call with retry ────────────────────────────────────────────────────
async function callAPI(client, grade, setIndex, attempt = 1) {
  const MAX_RETRIES = 3;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildPrompt(grade, setIndex) },
      ],
      temperature: 0.8,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    });

    let text = (resp.choices?.[0]?.message?.content || '').trim();

    // Some models (with json_object mode) wrap the array in an object like {"items":[...]} —
    // try to unwrap.  Otherwise expect a raw array inside JSON (rare: the model may wrap in fences).
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let parsed = JSON.parse(text);
    let items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.questions || parsed.data);
    if (!Array.isArray(items)) {
      // Last-ditch: if it's an object whose values are the items, take the values.
      const vals = Object.values(parsed);
      if (vals.length && typeof vals[0] === 'object' && vals[0].topic) items = vals;
    }
    if (!Array.isArray(items)) throw new Error('Response is not an array');
    if (items.length !== ITEMS_PER_SET) throw new Error(`Expected ${ITEMS_PER_SET} items, got ${items.length}`);

    // Shape validation
    items.forEach((it, i) => {
      if (!it.topic || !it.title || !it.tip || !it.question)
        throw new Error(`Item ${i + 1} missing required fields`);
      if (!Array.isArray(it.question.options) || it.question.options.length !== 4)
        throw new Error(`Item ${i + 1}: question must have exactly 4 options`);
      if (typeof it.question.correct !== 'number' || it.question.correct < 0 || it.question.correct > 3)
        throw new Error(`Item ${i + 1}: correct must be 0-3`);
      it.id = i + 1;
    });

    // Anti-leak validation
    const leaks = [];
    items.forEach((it, i) => {
      const why = detectLeak(it);
      if (why) leaks.push(`  #${i + 1} (${it.topic}/${it.category}): ${why}`);
    });
    if (leaks.length > 0) {
      throw new Error(`${leaks.length} item(s) leak the answer:\n${leaks.join('\n')}`);
    }

    const usage = resp.usage || {};
    console.log(` ${items.length} items | tokens: ${usage.prompt_tokens || '?'} in / ${usage.completion_tokens || '?'} out`);
    return items;

  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.log(`\n    attempt ${attempt} failed: ${err.message}\n    retrying…`);
      await new Promise(r => setTimeout(r, 2000 * attempt));
      return callAPI(client, grade, setIndex, attempt + 1);
    }
    throw new Error(`Year ${grade} Set ${setIndex + 1} failed after ${MAX_RETRIES} attempts: ${err.message}`);
  }
}

// ─── file writers ───────────────────────────────────────────────────────────
function writeFiles(content) {
  const json = JSON.stringify(content, null, 2);

  fs.writeFileSync(file('content.json'), json, 'utf8');
  console.log(`  Wrote content.json  (${(Buffer.byteLength(json) / 1024).toFixed(0)} KB)`);

  const js = `const CONTENT = ${json};\n`;
  fs.writeFileSync(file('content.js'), js, 'utf8');
  console.log(`  Wrote content.js   (${(Buffer.byteLength(js) / 1024).toFixed(0)} KB)`);

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
  console.log('  WonderWorks AI Content Generator (OpenAI)');
  console.log('  =========================================');
  console.log(`  Model : ${MODEL}`);
  console.log(`  Grades: ${GRADES.join(', ')}`);
  console.log(`  Sets  : ${SET_INDICES.map(i => i + 1).join(', ')}  (of ${SETS_PER_GRADE})`);
  console.log(`  Items : ${ITEMS_PER_SET} per set`);
  console.log(`  Total : ${GRADES.length * SET_INDICES.length} API call(s)`);
  console.log();

  if (!process.env.OPENAI_API_KEY) {
    console.error('  ERROR: OPENAI_API_KEY environment variable is not set.');
    console.error('  PowerShell: $env:OPENAI_API_KEY="sk-…"');
    console.error('  cmd.exe:    set OPENAI_API_KEY=sk-…');
    console.error('  bash:       export OPENAI_API_KEY=sk-…');
    process.exit(1);
  }

  const client = new OpenAI();

  // Load existing content — we PRESERVE whatever isn't being regenerated.
  let content = {};
  if (fs.existsSync(file('content.json'))) {
    try { content = JSON.parse(fs.readFileSync(file('content.json'), 'utf8')); } catch (_) {}
  }
  // Migrate legacy flat shape → nested sets if needed.
  for (const g of ['1','2','3','4','5','6']) {
    if (Array.isArray(content[g]) && content[g].length > 0 && !Array.isArray(content[g][0])) {
      console.log(`  Migrating legacy flat shape for Year ${g} → 1 set`);
      content[g] = [content[g]];
    }
  }
  // Ensure each grade is an array sized for SETS_PER_GRADE (pad with nulls).
  for (const g of GRADES) {
    if (!Array.isArray(content[g])) content[g] = [];
    while (content[g].length < SETS_PER_GRADE) content[g].push(null);
  }

  const t0 = Date.now();
  for (const grade of GRADES) {
    for (const setIdx of SET_INDICES) {
      process.stdout.write(`  Year ${grade} / Set ${setIdx + 1} …`);
      const start = Date.now();
      const items = await callAPI(client, grade, setIdx);
      applyMedia(items);
      content[grade][setIdx] = items;
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`         (${elapsed}s)`);
    }
  }
  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log();

  if (DRY_RUN) {
    console.log('  --dry-run: skipping file writes');
    const g = GRADES[0], s = SET_INDICES[0];
    console.log(`  Sample Year ${g} Set ${s+1} item 1:`, JSON.stringify(content[g][s][0], null, 2).slice(0, 300) + '…');
  } else {
    writeFiles(content);
  }

  // Summary
  console.log();
  console.log('  Summary');
  console.log('  -------');
  for (const g of ['1','2','3','4','5','6']) {
    const sets = content[g] || [];
    const populated = sets.filter(s => Array.isArray(s) && s.length > 0).length;
    console.log(`  Year ${g}: ${populated}/${SETS_PER_GRADE} sets populated`);
  }
  console.log(`  Wall time : ${totalTime}s`);
  console.log();
}

main().catch(err => {
  console.error('\n  FATAL:', err.message);
  process.exit(1);
});
