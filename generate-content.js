#!/usr/bin/env node
/**
 * WonderWorks Content Generator
 *
 * Run:  node generate-content.js
 *
 * What it does:
 *   1. Generates content.json with 240 educational items (40 per grade, Years 1-6)
 *   2. Replaces the embedded content inside index.html (between __CONTENT_START__ / __CONTENT_END__ markers)
 *
 * To change the educational material, edit the arrays below and re-run.
 * Content is aligned to the Australian Curriculum for primary school.
 */

const fs   = require('fs');
const path = require('path');

// ─── helpers ────────────────────────────────────────────────────────────────
const DIR  = __dirname;
const file = (name) => path.join(DIR, name);

function q(text, options, correct, explanation) {
  return { text, options, correct, explanation };
}
function tip(id, topic, category, title, body, icon, animation, color, bgGradient, question) {
  return {
    id, topic, category, title, tip: body,
    media: { icon, animation, color, bgGradient },
    question
  };
}

// Shorthand colour palettes per subject
const C = {
  math:   ['#4A90D9','linear-gradient(135deg,#4A90D9,#6BB9F0)'],
  math2:  ['#4A90D9','linear-gradient(135deg,#4A90D9,#74b9ff)'],
  math3:  ['#4A90D9','linear-gradient(135deg,#4A90D9,#a29bfe)'],
  math4:  ['#4A90D9','linear-gradient(135deg,#0984e3,#74b9ff)'],
  math5:  ['#4A90D9','linear-gradient(135deg,#6c5ce7,#a29bfe)'],
  math6:  ['#4A90D9','linear-gradient(135deg,#0984e3,#6c5ce7)'],
  math7:  ['#4A90D9','linear-gradient(135deg,#00cec9,#0984e3)'],
  math8:  ['#4A90D9','linear-gradient(135deg,#4A90D9,#81ecec)'],
  math9:  ['#4A90D9','linear-gradient(135deg,#e17055,#fdcb6e)'],
  math10: ['#4A90D9','linear-gradient(135deg,#4A90D9,#dfe6e9)'],
  math11: ['#4A90D9','linear-gradient(135deg,#fd79a8,#e84393)'],
  math12: ['#4A90D9','linear-gradient(135deg,#00b894,#55efc4)'],
  bio1:   ['#00B894','linear-gradient(135deg,#00b894,#55efc4)'],
  bio2:   ['#00B894','linear-gradient(135deg,#00b894,#81ecec)'],
  bio3:   ['#00B894','linear-gradient(135deg,#00b894,#badc58)'],
  bio4:   ['#00B894','linear-gradient(135deg,#a29bfe,#6c5ce7)'],
  bio5:   ['#00B894','linear-gradient(135deg,#00b894,#e17055)'],
  geo1:   ['#E17055','linear-gradient(135deg,#0984e3,#00b894)'],
  geo2:   ['#E17055','linear-gradient(135deg,#e17055,#fdcb6e)'],
  geo3:   ['#E17055','linear-gradient(135deg,#e17055,#fab1a0)'],
  geo4:   ['#E17055','linear-gradient(135deg,#0984e3,#00cec9)'],
  phy1:   ['#6C5CE7','linear-gradient(135deg,#6c5ce7,#a29bfe)'],
  phy2:   ['#6C5CE7','linear-gradient(135deg,#fdcb6e,#f39c12)'],
  phy3:   ['#6C5CE7','linear-gradient(135deg,#6c5ce7,#fd79a8)'],
  phy4:   ['#6C5CE7','linear-gradient(135deg,#fdcb6e,#e17055)'],
  phy5:   ['#6C5CE7','linear-gradient(135deg,#636e72,#b2bec3)'],
  chem1:  ['#E74C3C','linear-gradient(135deg,#0984e3,#00cec9)'],
  chem2:  ['#E74C3C','linear-gradient(135deg,#e74c3c,#fd79a8)'],
  chem3:  ['#E74C3C','linear-gradient(135deg,#6c5ce7,#e74c3c)'],
  eth1:   ['#FDCB6E','linear-gradient(135deg,#fdcb6e,#ffeaa7)'],
  eth2:   ['#FDCB6E','linear-gradient(135deg,#fdcb6e,#00b894)'],
  soc1:   ['#00CEC9','linear-gradient(135deg,#00cec9,#81ecec)'],
  soc2:   ['#00CEC9','linear-gradient(135deg,#e17055,#fdcb6e)'],
  hist1:  ['#D35400','linear-gradient(135deg,#d35400,#e17055)'],
  hist2:  ['#D35400','linear-gradient(135deg,#d35400,#fdcb6e)'],
  hist3:  ['#D35400','linear-gradient(135deg,#d35400,#e74c3c)'],
  cs1:    ['#0984E3','linear-gradient(135deg,#0984e3,#74b9ff)'],
  cs2:    ['#0984E3','linear-gradient(135deg,#0984e3,#00cec9)'],
  cs3:    ['#0984E3','linear-gradient(135deg,#0984e3,#6c5ce7)'],
  space:  ['#2C3E50','linear-gradient(135deg,#2c3e50,#6c5ce7)'],
};

// ═══════════════════════════════════════════════════════════════════════════
//  YEAR 1  (Australian Curriculum–aligned, age 5-7)
// ═══════════════════════════════════════════════════════════════════════════
const year1 = [
  tip(1,'Mathematics','Place Value','Tens and Ones',
    'Every two-digit number is made of TENS and ONES. In the number 14, there is 1 ten and 4 ones. Think of it like bundling ten sticks together — that bundle is one ten! Understanding place value is the key to working with bigger numbers.',
    '🔢','bounce',...C.math,
    q('How many tens are in the number 37?',['3','7','37','0'],0,'The digit 3 is in the tens place, so there are 3 tens (which equals 30).')),

  tip(2,'Mathematics','Addition','Adding Within 20',
    'When we add numbers within 20, we can use smart strategies! To work out 8 + 5, think: 8 + 2 = 10, then add the remaining 3 to get 13. This is called "making ten" — it is one of the most powerful addition strategies!',
    '➕','pulse',...C.math2,
    q('What is 8 + 5?',['12','13','14','11'],1,'8 + 5 = 13! Use "make ten": 8 + 2 = 10, then 10 + 3 = 13.')),

  tip(3,'Mathematics','Subtraction','Subtracting Within 20',
    'Subtraction means finding the difference. To work out 15 − 7, you can count back from 15 or use a number line. Start at 15, jump back 5 to reach 10, then jump back 2 more to reach 8. So 15 − 7 = 8!',
    '➖','slide-left',...C.math3,
    q('What is 15 − 7?',['7','8','9','6'],1,'15 − 7 = 8! Jump back from 15: subtract 5 to get 10, then subtract 2 more to get 8.')),

  tip(4,'Mathematics','Skip Counting','Counting by 2s, 5s, and 10s',
    'Skip counting means jumping over numbers in equal steps! By 2s: 2, 4, 6, 8, 10… By 5s: 5, 10, 15, 20, 25… By 10s: 10, 20, 30, 40… Skip counting helps you count large groups quickly and is the first step toward multiplication!',
    '🔢','bounce',...C.math4,
    q('When counting by 5s, what comes after 15?',['16','18','20','25'],2,'5, 10, 15, 20! Each jump adds 5, so 15 + 5 = 20.')),

  tip(5,'Mathematics','Shapes','Describing 2D Shapes',
    'We can describe 2D (flat) shapes by their features! Count the SIDES (straight edges) and CORNERS (where sides meet). A rectangle has 4 sides and 4 corners. A pentagon has 5 sides. A hexagon has 6 sides. Circles have NO sides or corners — they are curved!',
    '🔷','spin',...C.math5,
    q('How many corners does a rectangle have?',['3','4','5','6'],1,'4 corners! A rectangle has 4 straight sides that meet at 4 corners (right angles).')),

  tip(6,'Mathematics','3D Shapes','Shapes in the Real World',
    'Three-dimensional shapes are solid objects you can hold. A SPHERE is like a ball. A CYLINDER is like a tin can — it has two circle faces. A CUBE has 6 square faces. A CONE has a circle base and a point on top. Look around — your classroom is full of 3D shapes!',
    '📦','float',...C.math6,
    q('What 3D shape is a tin can?',['Sphere','Cube','Cylinder','Cone'],2,'A cylinder! It has two flat circular faces (top and bottom) and a curved surface around the middle.')),

  tip(7,'Mathematics','Measurement','Measuring with Informal Units',
    'We can measure how long things are using everyday objects! You might measure a table in hand spans, a room in footsteps, or a book in paper clips. Always line up your units carefully from one end to the other without gaps or overlaps!',
    '📏','slide-right',...C.math7,
    q('A desk is 12 hand spans long. What does this tell us?',['It weighs 12 kg','Its length is 12 hand spans','It has 12 drawers','It costs $12'],1,'The length of the desk is 12 hand spans! We used hand spans as an informal unit of measurement.')),

  tip(8,'Mathematics','Mass','Comparing Mass with Scales',
    'MASS is how heavy something is. We can compare mass using a balance scale — the heavier side goes DOWN and the lighter side goes UP. If both sides are level, the objects have the SAME mass. Always predict first, then check!',
    '⚖️','bounce',...C.math8,
    q('On a balance scale, the heavier object makes that side go…',['Up','Down','It stays level','It spins'],1,'Down! Gravity pulls the heavier side downward. The lighter side rises up.')),

  tip(9,'Mathematics','Patterns','Number and Shape Patterns',
    'Patterns follow a rule that repeats or grows! Shape pattern: triangle, circle, triangle, circle — the rule is "alternate." Number pattern: 2, 4, 6, 8 — the rule is "add 2 each time." Finding the rule lets you predict what comes next!',
    '🔄','pulse',...C.math9,
    q('What comes next in the pattern: 3, 6, 9, 12, …?',['13','14','15','16'],2,'15! The rule is "add 3 each time." 12 + 3 = 15.')),

  tip(10,'Mathematics','Data','Collecting Data with Surveys',
    'We can find things out by asking questions and recording answers! A SURVEY asks a question and records each response. Tally marks help you count: four lines with a diagonal across make 5 (||||̸). Then you can show your data in a picture graph!',
    '📊','fade-in',...C.math10,
    q('In a class survey, 12 students like dogs and 8 like cats. How many MORE students prefer dogs?',['2','3','4','20'],2,'4 more! 12 − 8 = 4. Comparing data helps us find the difference.')),

  tip(11,'Mathematics','Fractions','Halves and Quarters',
    'A HALF means 2 equal parts — each part is ½. A QUARTER means 4 equal parts — each part is ¼. The parts MUST be equal! If you cut a sandwich unevenly, those are NOT halves. Two quarters (¼ + ¼) make one half (½). Four quarters make a whole!',
    '🍕','bounce',...C.math11,
    q('A cake is cut into 4 equal pieces. What fraction is one piece?',['One half','One third','One quarter','One whole'],2,'One quarter (¼)! When something is divided into 4 equal parts, each part is a quarter.')),

  tip(12,'Mathematics','Time & Money','Telling Time and Australian Coins',
    'On a clock, when the minute hand points to 12 it is "o\'clock" and when it points to 6 it is "half past." Australian coins are: 5c, 10c, 20c, 50c, $1 and $2. Interestingly, the $2 coin is SMALLER than the $1 coin!',
    '🕐','spin',...C.math12,
    q('When the minute hand points to 6, the time is…',["O'clock",'Quarter past','Half past','Quarter to'],2,"Half past! The minute hand on 6 means 30 minutes past the hour.")),

  tip(13,'Biology','Animal Features','Classifying Animals by Features',
    'Scientists group animals by their body features. MAMMALS have fur or hair and feed milk. BIRDS have feathers, beaks, and wings. REPTILES have dry scales. AMPHIBIANS have moist skin and live in water and on land. FISH have scales, fins, and gills!',
    '🐾','bounce',...C.bio1,
    q('Which feature do ALL birds share?',['Fur','Feathers','Scales','Fins'],1,'Feathers! Every bird — from tiny wrens to huge emus — has feathers. It is the defining feature of birds.')),

  tip(14,'Biology','Life Cycles','How Animals Grow and Change',
    'All animals have a LIFE CYCLE — the stages they go through from birth to adult. Frogs have an amazing cycle: egg → tadpole (with a tail, lives in water) → froglet (grows legs) → adult frog (lives on land). This dramatic change is called METAMORPHOSIS!',
    '🐸','float',...C.bio2,
    q('Which animal completely changes its body form as it grows (metamorphosis)?',['Dog','Frog','Horse','Cat'],1,'Frogs! They transform from aquatic tadpoles with tails into land-dwelling adults with legs.')),

  tip(15,'Biology','Plants','What Plants Need to Survive',
    'Plants are living things that need WATER (absorbed by roots), SUNLIGHT (caught by leaves to make food), AIR (carbon dioxide enters through tiny leaf holes), and SOIL (provides nutrients and anchor). Remove any one and the plant suffers!',
    '🌱','float',...C.bio3,
    q('A plant kept in a dark cupboard with water will…',['Grow normally','Not grow well — it needs sunlight','Grow faster','Turn blue'],1,'Not grow well! Plants need sunlight to make food through photosynthesis. Without light, they become weak and pale.')),

  tip(16,'Biology','Human Body','Bones, Muscles, and Movement',
    'Your SKELETON (bones) gives your body its shape and protects your organs. Your MUSCLES are attached to bones and pull them to make you move. JOINTS are where bones meet — like your elbow and knee — allowing you to bend and twist!',
    '💪','pulse',...C.bio4,
    q('What allows your arm to bend at the elbow?',['Your skin','A joint where bones meet','Your blood','Your hair'],1,'A joint! The elbow joint is where two arm bones meet, allowing your arm to bend and straighten.')),

  tip(17,'Biology','Ecosystems','Living Things and Their Habitats',
    'A HABITAT is the natural environment where a plant or animal lives. It provides everything the organism needs: food, water, shelter, and space. A pond is a habitat for frogs. A eucalyptus forest is a habitat for koalas. If the habitat is damaged, the animals suffer!',
    '🌿','fade-in',...C.bio5,
    q('What does a habitat provide for living things?',['Only water','Food, water, shelter, and space','Only food','Only shelter'],1,'A habitat provides food, water, shelter, AND space — everything a living thing needs to survive!')),

  tip(18,'Geography','World','Continents and Oceans',
    'Earth has 7 large land masses called CONTINENTS and 5 OCEANS. We live on the Australian continent! The Pacific Ocean is the largest ocean. Every continent has different climates, animals, and cultures. A GLOBE is a model of Earth that shows them all!',
    '🌍','spin',...C.geo1,
    q('How many continents are on Earth?',['5','6','7','8'],2,'7! Africa, Antarctica, Asia, Australia/Oceania, Europe, North America, and South America.')),

  tip(19,'Geography','Australia','Special Features of Australia',
    'Australia is the driest inhabited continent on Earth! It has unique features: the Great Barrier Reef (world\'s largest coral reef), Uluru (a sacred rock formation), vast deserts called the Outback, and tropical rainforests in the north. No other continent has such diversity!',
    '🦘','bounce',...C.geo2,
    q('What is the Great Barrier Reef made of?',['Sand','Rocks','Living coral','Ice'],2,'Living coral! The Great Barrier Reef is built by tiny animals called coral polyps and is so large it can be seen from space.')),

  tip(20,'Geography','Maps','Reading Simple Maps',
    'Maps are bird\'s-eye views — like looking down from above! They use symbols and a KEY (legend) that explains what each symbol means. Blue = water. Green = parks. Roads are lines. A compass rose shows North, South, East, and West directions.',
    '🗺️','fade-in',...C.geo3,
    q('On most maps, blue areas represent…',['Forests','Buildings','Water','Deserts'],2,'Water! Rivers, lakes, and oceans are shown in blue on nearly all maps.')),

  tip(21,'Geography','Landforms','Mountains, Rivers, and Coasts',
    'Earth\'s surface has many landforms! MOUNTAINS are high and steep. VALLEYS are low areas between mountains. RIVERS carry fresh water from mountains to the sea. COASTS are where the land meets the ocean. Australia\'s coastline stretches over 25,000 km!',
    '🏔️','slide-right',...C.geo4,
    q('What is a COAST?',['The top of a mountain','Where a river starts','Where land meets the ocean','A deep valley'],2,'Where the land meets the ocean! Australia is famous for its beautiful coastline and beaches.')),

  tip(22,'Physics','Forces','Pushes, Pulls, and Movement',
    'A FORCE is a push or a pull that makes things move, stop, or change direction. Kicking a ball is a push force. Pulling a wagon uses pull force. A force can also change an object\'s SHAPE — like squishing playdough. Forces are everywhere!',
    '💪','bounce',...C.phy1,
    q('What happens when you push a stationary ball?',['Nothing','It moves away from you','It gets heavier','It changes colour'],1,'It moves away from you! A push force causes stationary objects to start moving in the direction of the push.')),

  tip(23,'Physics','Light','Light Sources and Shadows',
    'LIGHT comes from sources like the Sun, torches, and light bulbs. Light travels in straight lines! When an object blocks light, a SHADOW forms on the other side. Shadows change size: close to the light = BIG shadow. Far from the light = SMALL shadow!',
    '💡','pulse',...C.phy2,
    q('Why does your shadow change size during the day?',['Because you are growing','Because the Sun changes position in the sky','Because shadows are alive','Because of wind'],1,'The Sun moves across the sky! When the Sun is low (morning/evening), shadows are long. When high (midday), shadows are short.')),

  tip(24,'Physics','Sound','How Sounds are Made',
    'All sounds are caused by VIBRATIONS — objects shaking back and forth very quickly! Pluck a rubber band — see it vibrate AND hear the sound! Sounds can be LOUD or SOFT (volume) and HIGH or LOW (pitch). Thick rubber bands make lower sounds than thin ones.',
    '🔊','shake',...C.phy3,
    q('What causes ALL sounds?',['Light','Vibrations','Gravity','Heat'],1,'Vibrations! When an object vibrates (shakes rapidly), it pushes air particles which carry the sound to your ears.')),

  tip(25,'Physics','Energy','What Makes Things Work',
    'ENERGY is needed to make things happen! Batteries store energy for torches and toys. Food gives your body energy to move and think. The Sun provides light and heat energy. Electricity powers lights, computers, and fridges. Without energy, nothing works!',
    '⚡','pulse',...C.phy4,
    q('Where does your body get the energy it needs to run and play?',['From batteries','From food','From magnets','From the Moon'],1,'From food! Your body breaks down food to release the energy your muscles and brain need.')),

  tip(26,'Physics','Magnets','Exploring Magnets',
    'Magnets create an invisible force that attracts (pulls) certain metals — mainly iron and steel. Every magnet has two POLES: North and South. Opposite poles attract (stick together). Same poles repel (push apart). Magnets work even through paper and fabric!',
    '🧲','bounce',...C.phy5,
    q('A magnet will attract (stick to) which of these?',['A wooden block','A plastic cup','A steel paper clip','A rubber eraser'],2,'A steel paper clip! Magnets attract iron and steel. They do NOT attract wood, plastic, or rubber.')),

  tip(27,'Chemistry','States of Matter','Solids, Liquids, and Gases',
    'Everything around you is a SOLID, LIQUID, or GAS! Solids keep their shape (like a rock or a chair). Liquids flow and take the shape of their container (like water or juice). Gases spread out to fill all available space (like the air you breathe).',
    '🧊','fade-in',...C.chem1,
    q('Which is a GAS?',['Ice','Milk','The air we breathe','A wooden table'],2,'The air we breathe is a gas! Gases are invisible, spread out everywhere, and don\'t have a fixed shape.')),

  tip(28,'Chemistry','Materials','Properties of Everyday Materials',
    'Materials have different PROPERTIES. Some are HARD (metal, glass), some SOFT (fabric, sponge). Some are TRANSPARENT (see-through, like glass), some OPAQUE (blocks light, like wood). We choose materials based on their properties — glass for windows because it\'s transparent!',
    '🧱','slide-left',...C.chem2,
    q('Why is glass used for windows?',['It is the cheapest material','It is transparent — you can see through it','It is the strongest material','It is the softest material'],1,'Because glass is transparent! Light passes through it so we can see outside while staying protected from wind and rain.')),

  tip(29,'Chemistry','Changes','Heating and Cooling Materials',
    'Heat can CHANGE materials! Heating ice turns it into water (melting). Heating water turns it into steam (evaporating). Cooling water turns it back into ice (freezing). Heating bread makes toast — but you can\'t un-toast bread! Some changes are reversible, some are not.',
    '🔥','shake',...C.chem3,
    q('What happens when you heat ice?',['It gets harder','It melts into liquid water','It stays the same','It turns into metal'],1,'It melts! Heat energy makes the ice particles move faster and the solid ice becomes liquid water.')),

  tip(30,'Ethics','Values','Fairness and Taking Turns',
    'FAIRNESS means everyone gets an equal chance. When playing a game, everyone follows the same rules. When sharing snacks, everyone gets the same amount. Taking turns means being patient and letting others have their go. Fair isn\'t always equal — sometimes people need different things to have the same opportunity.',
    '🤝','pulse',...C.eth1,
    q('At lunchtime there is one swing and three friends. What is the fairest approach?',['The biggest kid gets it all lunch','Take turns — each person gets equal time','Nobody uses it','Only use it if the teacher says so'],1,'Taking turns! Each friend gets equal time on the swing. Fairness means everyone gets an equal opportunity.')),

  tip(31,'Ethics','Decision Making','Choosing Kindness',
    'Every day you face choices. KIND choices help others feel good: including someone who is alone, sharing your pencils, or saying "are you okay?" UNKIND choices hurt others. Before you act, think: "How would I feel if someone did this to me?" This is called the GOLDEN RULE.',
    '💭','float',...C.eth2,
    q('You notice a classmate sitting alone at lunch looking sad. What is the kindest choice?',['Ignore them','Invite them to sit with you','Laugh at them','Walk the other way'],1,'Invite them to join you! Small acts of kindness can make someone\'s whole day better.')),

  tip(32,'Sociology','Community','People and Places in Our Community',
    'A COMMUNITY is a group of people who live, work, and play in the same area. Communities have special places: schools, libraries, hospitals, parks, and shops. Community HELPERS include firefighters, paramedics, police, teachers, and shopkeepers. Everyone plays a role!',
    '🏘️','bounce',...C.soc1,
    q('Which of these is a community helper who keeps us safe during fires?',['A teacher','A firefighter','A baker','A pilot'],1,'A firefighter! They respond to emergencies, put out fires, and help rescue people. They are vital community helpers.')),

  tip(33,'Sociology','Culture','Families and Celebrations',
    'Families come in all shapes and sizes! Some have two parents, some have one. Some include grandparents, aunties, and uncles. Every family has its own traditions and ways of celebrating. Respecting that all families are different is important.',
    '👨‍👩‍👧‍👦','pulse',...C.soc2,
    q('Why is it important to respect that families are different?',['It is not important','Because everyone deserves respect for who they are','Only if the teacher says so','Only on special days'],1,'Everyone deserves respect! Families are diverse and beautiful in their own ways. Respecting differences makes our community stronger.')),

  tip(34,'History','Ancient','Long Ago and Today',
    'Life was very different a long time ago! There were no cars (people walked or rode horses), no electricity (they used candles), and no internet. Aboriginal Australians have lived on this land for over 65,000 years — the longest continuous civilisation on Earth!',
    '🏛️','fade-in',...C.hist1,
    q('What did people use for light before electricity was invented?',['Torches and phones','Candles and fire','Television','Nothing — it was always bright'],1,'Candles and fire! Before electricity, people relied on fire, candles, and oil lamps for light.')),

  tip(35,'History','Australian History','Aboriginal Connection to Country',
    'Aboriginal and Torres Strait Islander peoples have a deep connection to the land, called "Country." They believe the land, water, sky, animals, and people are all connected. Through Dreaming stories, they explain how the world was created and share important knowledge passed down for tens of thousands of years.',
    '🎨','pulse',...C.hist2,
    q('Aboriginal Dreaming stories are used to…',['Watch on television','Share knowledge about the world and how it was created','Play video games','Read in books only'],1,'Share knowledge about the creation of the world! Dreaming stories carry laws, knowledge, and cultural practices across generations.')),

  tip(36,'History','World Events','How Transport Has Changed',
    'Transport has changed dramatically! Long ago, people walked or rode horses. Then came sailing ships, steam trains, bicycles, cars, and aeroplanes. Today we even have electric cars and rockets to space! Each invention made it faster to travel and explore the world.',
    '🚂','slide-right',...C.hist3,
    q('Which came first in history?',['Aeroplanes','Horses and carts','Electric cars','Rockets'],1,'Horses and carts! People used animal-powered transport for thousands of years before engines were invented.')),

  tip(37,'Computer Science','Computers','What Computers Can Do',
    'A computer is a machine that follows INSTRUCTIONS to do amazing things: solve maths, play music, show videos, send messages, and control robots! Computers are in phones, tablets, watches, and even some fridges. They work incredibly fast — millions of calculations per second!',
    '💻','bounce',...C.cs1,
    q('A computer follows _____ to do its work.',['Feelings','Instructions','Dreams','Colours'],1,'Instructions! Computers do exactly what they are told through programs (sets of instructions). They can\'t think on their own — yet!')),

  tip(38,'Computer Science','Coding','What is an Algorithm?',
    'An ALGORITHM is a set of step-by-step instructions to complete a task — like a recipe! To brush your teeth: 1) Pick up toothbrush, 2) Apply toothpaste, 3) Brush for 2 minutes, 4) Rinse mouth. The ORDER matters! Coding is writing algorithms that computers can follow.',
    '🤖','slide-right',...C.cs2,
    q('An algorithm is…',['A type of food','Step-by-step instructions to complete a task','A colour','A game'],1,'Step-by-step instructions! Algorithms must be in the correct order for the task to work properly.')),

  tip(39,'Computer Science','Digital Literacy','Being Safe with Technology',
    'Technology is powerful but you must be SAFE! Never share your full name, address, or school with strangers online. If something online makes you uncomfortable, TELL A TRUSTED ADULT immediately. Limit screen time and balance it with outdoor play, reading, and creative activities.',
    '🛡️','pulse',...C.cs3,
    q('If a stranger online asks where you live, you should…',['Tell them your address','Say no and tell a trusted adult immediately','Ignore it and keep playing','Share only your street name'],1,'Say no and tell an adult! Never share personal details with strangers online. A trusted adult will help keep you safe.')),

  tip(40,'Astronomy','Space','Earth, Sun, and Moon',
    'The EARTH spins like a top once every 24 hours — giving us DAY (facing the Sun) and NIGHT (facing away). The MOON orbits Earth about once every 28 days. The SUN is actually a star — a giant ball of hot gas that gives us light and heat. Without the Sun, Earth would be freezing and dark!',
    '🌙','float',...C.space,
    q('Why do we have day and night?',['The Sun turns on and off','Earth spins — the side facing the Sun has day','The Moon blocks the Sun at night','Clouds block sunlight at night'],1,'Earth spins! The side facing the Sun experiences daytime, while the side facing away has nighttime.'))
];

// ═══════════════════════════════════════════════════════════════════════════
//  YEAR 2  (age 6-7)
// ═══════════════════════════════════════════════════════════════════════════
const year2 = [
  tip(1,'Mathematics','Numbers','Numbers to 100','Let\'s explore numbers all the way to 100! Every number has a place — tens and ones. In the number 35, the "3" means 3 tens (30) and the "5" means 5 ones. Place value helps us understand big numbers!','💯','bounce',...C.math,q('What number is ten more than 25?',['15','35','26','30'],1,'25 + 10 = 35! When we add ten, the tens digit goes up by one.')),
  tip(2,'Mathematics','Addition','Adding Two-Digit Numbers','We can add bigger numbers by breaking them apart! To add 23 + 14: add the tens (20 + 10 = 30), then add the ones (3 + 4 = 7), and put them together: 37! This is called partitioning.','➕','pulse',...C.math2,q('What is 15 + 12?',['26','27','28','25'],1,'15 + 12 = 27! Add the tens (10 + 10 = 20) and the ones (5 + 2 = 7) to get 27.')),
  tip(3,'Mathematics','Subtraction','Subtracting with Confidence','Subtracting means finding the difference! If you have 18 stickers and give away 5, you have 18 − 5 = 13 left. You can count back from 18: 17, 16, 15, 14, 13!','➖','slide-left',...C.math3,q('What is 18 − 5?',['12','13','14','11'],1,'18 − 5 = 13! Count back 5 from 18: 17, 16, 15, 14, 13.')),
  tip(4,'Mathematics','Multiplication','Skip Counting by 2s','Skip counting is like jumping over numbers! Count by 2s: 2, 4, 6, 8, 10, 12… This is the start of multiplication! 3 groups of 2 is the same as counting by 2s three times: 2, 4, 6!','🔢','bounce',...C.math4,q('What comes next: 2, 4, 6, 8, …?',['9','10','11','12'],1,'10 comes next! We\'re skip counting by 2s: 2, 4, 6, 8, 10, 12…')),
  tip(5,'Mathematics','Shapes','3D Shapes','3D shapes are solid shapes you can hold! A cube is like a box — 6 flat faces. A sphere is like a ball — perfectly round. A cylinder is like a can — circles on top and bottom. A cone is like an ice cream cone!','🎲','spin',...C.math5,q('What 3D shape is a ball?',['Cube','Sphere','Cylinder','Cone'],1,'A ball is a sphere! A sphere is perfectly round in every direction.')),
  tip(6,'Mathematics','Symmetry','Mirror Images','Symmetry is when both sides of something are the same! Draw a line down the middle of a butterfly — both wings match! This line is called a line of symmetry. Many things in nature have symmetry.','🦋','float',...C.math6,q('Which shape has a line of symmetry — both halves are mirror images?',['The letter R','The letter A','The letter F','The letter J'],1,'The letter A has a vertical line of symmetry! If you fold it down the middle, both sides match.')),
  tip(7,'Mathematics','Measurement','Measuring with Rulers','We use rulers to measure how long things are! The small marks show centimetres (cm). Line up one end of the object with the 0 on the ruler, then read the number at the other end. That\'s the length!','📏','slide-right',...C.math7,q('What tool do we use to measure how long something is?',['Scales','Thermometer','Ruler','Clock'],2,'A ruler! Rulers measure length in centimetres and millimetres.')),
  tip(8,'Mathematics','Mass','Using Scales','We use scales to measure how heavy things are! The unit we use is kilograms (kg) and grams (g). 1 kilogram = 1000 grams. A bag of sugar weighs about 1 kg. A slice of bread weighs about 30 g!','⚖️','bounce',...C.math8,q('What unit measures how heavy something is?',['Metres','Litres','Kilograms','Seconds'],2,'Kilograms (kg) measure mass or weight! We use scales to weigh things.')),
  tip(9,'Mathematics','Patterns','Number Patterns','Numbers can make patterns too! Count by 5s: 5, 10, 15, 20, 25… Each number is 5 more than the last! Count by 10s: 10, 20, 30, 40… Spotting patterns helps us predict what comes next.','🔄','pulse',...C.math9,q('What comes next: 10, 20, 30, …?',['35','40','50','45'],1,'40! We\'re counting by 10s: 10, 20, 30, 40, 50…')),
  tip(10,'Mathematics','Data','Picture Graphs','Picture graphs use little pictures to show information! Each picture represents one thing. If you see 4 sun pictures in the "Sunny" column, that means there were 4 sunny days! Count the pictures to read the graph.','📊','fade-in',...C.math10,q('In a picture graph, 4 sun pictures in the "Sunny" column means there were how many sunny days?',['2','3','4','5'],2,'4 sunny days! Each picture represents one day, so 4 pictures = 4 days.')),
  tip(11,'Mathematics','Fractions','Quarters','When we cut something into 4 equal pieces, each piece is called a QUARTER (¼). A pizza cut into 4 slices gives you 4 quarters. Two quarters make a half (½). Four quarters make a whole!','🍕','bounce',...C.math11,q('If you cut a pizza into 4 equal pieces, each piece is…',['A half','A third','A quarter','A whole'],2,'Each piece is a quarter! A quarter means one of four equal parts (¼).')),
  tip(12,'Mathematics','Time','Reading Clocks','A clock has two hands! The short hand shows the HOUR. The long hand shows the MINUTES. When the long hand points to 12, it\'s exactly "o\'clock". When it points to 6, it\'s "half past".','🕐','spin',...C.math12,q('On a clock, the short hand points to 3 and the long hand points to 12. What time is it?',["12 o'clock","6 o'clock","3 o'clock","9 o'clock"],2,"It's 3 o'clock! The short hand on 3 tells us the hour, and the long hand on 12 means exactly o'clock.")),
  tip(13,'Biology','Animals','Backbones or Not?','Animals are divided into two big groups! Vertebrates have a backbone (spine) inside — like fish, frogs, snakes, birds, and mammals. Invertebrates have NO backbone — like insects, spiders, worms, and jellyfish!','🦴','bounce',...C.bio1,q('Which animal has NO backbone?',['Dog','Jellyfish','Cat','Horse'],1,'Jellyfish have no backbone! They are invertebrates — soft, squishy, and boneless.')),
  tip(14,'Biology','Life Cycles','The Butterfly Life Cycle','A butterfly has an amazing life cycle! It starts as a tiny EGG, hatches into a CATERPILLAR that eats and grows, then becomes a CHRYSALIS (cocoon), and finally transforms into a beautiful BUTTERFLY! This change is called metamorphosis.','🦋','float',...C.bio2,q('What does a caterpillar eventually become?',['A worm','A butterfly','A bee','A spider'],1,'A caterpillar becomes a butterfly through metamorphosis! It\'s one of nature\'s most magical transformations.')),
  tip(15,'Biology','Plants','Parts of a Plant','Plants have important parts! ROOTS drink water from the soil. The STEM holds the plant up and carries water to the leaves. LEAVES catch sunlight to make food. FLOWERS make seeds for new plants!','🌻','float',...C.bio3,q('Which part of a plant takes in water from the soil?',['Leaves','Flower','Roots','Stem'],2,'Roots! They grow underground and drink up water and nutrients from the soil.')),
  tip(16,'Biology','Human Body','Our Skeleton','Inside your body is a skeleton made of 206 bones! Your skeleton holds you up (like a frame), protects soft organs (your skull protects your brain!), and helps you move. Without bones, you\'d be like a jellyfish!','💀','bounce',...C.bio4,q('What is the hard frame inside your body called?',['Muscles','Skeleton','Skin','Brain'],1,'Your skeleton! It\'s made of 206 bones that support and protect your body.')),
  tip(17,'Biology','Ecosystems','Simple Food Chains','A food chain shows who eats what! Grass → Rabbit → Fox. The grass is eaten by the rabbit, and the rabbit is eaten by the fox. Every food chain starts with a plant that gets energy from the Sun!','🔗','slide-right',...C.bio5,q('In a food chain, what does a rabbit eat?',['Foxes','Grass','Rocks','Worms'],1,'Rabbits eat grass! In a food chain, rabbits are herbivores (plant eaters).')),
  tip(18,'Geography','World','The Seven Continents','Earth has 7 large land masses called continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America. Asia is the biggest! Antarctica is the coldest! We live on the Australian continent!','🌏','spin',...C.geo1,q('How many continents are there on Earth?',['5','6','7','8'],2,'There are 7 continents! Africa, Antarctica, Asia, Australia, Europe, North America, and South America.')),
  tip(19,'Geography','Australia','Amazing Australian Animals','Australia has animals found nowhere else on Earth! The platypus has a duck bill and lays eggs but is a mammal. Koalas sleep 20 hours a day! Wombats do cube-shaped poo! How fascinating!','🐨','bounce',...C.geo2,q('Which animal is found only in Australia?',['Lion','Platypus','Elephant','Penguin'],1,'The platypus is uniquely Australian! It\'s one of only two mammals that lay eggs.')),
  tip(20,'Geography','Maps','Compass Directions','A compass helps us find direction! The four main directions are: North (up), South (down), East (right), and West (left). Remember: Never Eat Soggy Weetbix — N, E, S, W going clockwise!','🧭','spin',...C.geo3,q('Which direction does a compass needle always point?',['South','East','North','West'],2,'A compass needle points North! That\'s how explorers and travellers find their way.')),
  tip(21,'Geography','Landforms','Volcanoes','A volcano is an opening in the Earth where hot, melted rock called lava can escape! When a volcano erupts, lava flows out, ash clouds rise into the sky, and the land changes shape. Some volcanoes are under the ocean!','🌋','shake',...C.geo4,q('What comes out of a volcano when it erupts?',['Water','Lava','Sand','Snow'],1,'Lava! It\'s super-hot melted rock from deep inside the Earth.')),
  tip(22,'Physics','Forces','Gravity','Gravity is an invisible force that pulls everything towards the ground! When you jump, gravity pulls you back down. When you drop a ball, gravity makes it fall. Without gravity, we\'d all float away into space!','🍎','bounce',...C.phy1,q('Why does a ball fall when you drop it?',['Wind pushes it','Gravity pulls it down','Magic','Light pushes it'],1,'Gravity! It\'s the force that pulls everything towards the centre of the Earth.')),
  tip(23,'Physics','Light','Shadows','When light hits an object that it cannot pass through, a shadow appears on the other side! Shadows are dark areas. They change size depending on where the light is. On a sunny day, your shadow follows you everywhere!','👤','slide-left',...C.phy2,q('What do you need to make a shadow?',['Water','Light and an object','Sound','Wind'],1,'You need light and an object! The object blocks the light, creating a dark shadow behind it.')),
  tip(24,'Physics','Sound','Vibrations Make Sound','All sounds are made by vibrations — things shaking back and forth very quickly! When you pluck a guitar string, it vibrates and makes a sound. When you talk, your vocal cords vibrate! No vibration = no sound.','🎸','shake',...C.phy3,q('What causes sound?',['Light','Vibrations','Colours','Gravity'],1,'Vibrations! Sounds are made when objects vibrate (shake rapidly back and forth).')),
  tip(25,'Physics','Energy','Heat Energy','Heat is a type of energy! It flows from hot things to cold things. The Sun heats the Earth. A heater warms a room. Ice cream melts because heat from the air flows into it. We measure heat with a thermometer!','🌡️','pulse',...C.phy4,q('What type of energy does the Sun give us?',['Sound','Heat and light','Wind','Gravity'],1,'The Sun gives us heat and light energy! That\'s what keeps our planet warm and bright.')),
  tip(26,'Physics','Magnets','Magnetic Poles','Every magnet has two ends called poles — a NORTH pole and a SOUTH pole. Opposite poles attract (pull together): North + South = stick! Same poles repel (push apart): North + North = push away!','🧲','bounce',...C.phy5,q('What happens when two North poles of magnets are put together?',['They stick together','They push apart','Nothing happens','They break'],1,'They push apart! Same poles (N+N or S+S) repel each other. Only opposite poles attract!')),
  tip(27,'Chemistry','States of Matter','Melting and Freezing','Water can change state! When ice gets warm, it MELTS into liquid water. When water gets very cold (0°C), it FREEZES back into ice. The temperature decides whether water is solid, liquid, or gas!','🧊','fade-in',...C.chem1,q('What happens to ice when it gets warm?',['It melts into water','It gets harder','It disappears','It freezes more'],0,'Ice melts into liquid water when it warms up! This happens at 0°C.')),
  tip(28,'Chemistry','Materials','Natural and Made by Humans','Some materials come from nature: wood from trees, wool from sheep, cotton from plants, stone from the ground. Other materials are made by humans: plastic, glass, nylon, and concrete. We call these manufactured!','🪵','slide-left',...C.chem2,q('Which material comes from nature?',['Plastic','Wood','Nylon','Glass'],1,'Wood comes from trees — it\'s a natural material! Trees grow in forests without human help.')),
  tip(29,'Chemistry','Changes','Dissolving','When you stir sugar into water, the sugar seems to disappear! But it hasn\'t gone — it has DISSOLVED. The sugar broke into tiny pieces too small to see, mixed into the water. That\'s why the water tastes sweet!','🥤','spin',...C.chem3,q('What happens when you stir sugar into warm water?',['It floats','It dissolves','It gets bigger','Nothing happens'],1,'The sugar dissolves! It breaks into tiny invisible particles and mixes completely into the water.')),
  tip(30,'Ethics','Values','Including Everyone','Everyone deserves to be included! When a new student arrives, imagine how nervous they feel. A simple "Hi, want to play with us?" can make their whole day! Including others shows kindness and makes our community stronger.','🫂','pulse',...C.eth1,q("A new student joins your class. What's the kindest thing to do?",['Ignore them','Invite them to play','Laugh at them','Walk away'],1,'Invite them to play! Everyone feels better when they\'re welcomed and included.')),
  tip(31,'Ethics','Decision Making','Honesty Matters','Telling the truth is really important, even when it\'s hard! If you accidentally break something, being honest about it shows courage and responsibility. People trust honest people. Lies might seem easier, but they always make things worse.','⭐','float',...C.eth2,q('If you accidentally break a vase, what should you do?',['Hide the pieces','Tell the truth about it','Blame someone else','Pretend nothing happened'],1,'Tell the truth! It takes courage, but honesty builds trust and shows responsibility.')),
  tip(32,'Sociology','Community','Rules Keep Us Safe','Rules exist to keep everyone safe and happy! At school, rules like "walk in the corridors" prevent accidents. At home, rules help families work together. Even games have rules — they make things fair for everyone!','📋','bounce',...C.soc1,q('Why do we have rules at school?',['To punish people','To keep everyone safe and happy','For no reason','To make school boring'],1,'Rules keep us safe and happy! They help everyone know what to expect and how to treat each other.')),
  tip(33,'Sociology','Culture','Languages Around the World','There are over 7,000 languages spoken around the world! In Australia, over 250 Aboriginal languages existed before European settlement. Some people speak two or more languages — that\'s called being bilingual or multilingual!','🗣️','pulse',...C.soc2,q('Is there only one language spoken in the world?',['Yes, just one','No, there are thousands!','Only two','Only ten'],1,'There are over 7,000 languages! People around the world communicate in many different ways.')),
  tip(34,'History','Ancient','Ancient Egypt','Ancient Egypt was an amazing civilisation! They built enormous pyramids as tombs for their pharaohs (kings). They wrote using hieroglyphics (picture writing) and lived along the Nile River. The pyramids are over 4,500 years old!','🏛️','fade-in',...C.hist1,q('What famous ancient structures were built in Egypt?',['Castles','Pyramids','Skyscrapers','Bridges'],1,'The Pyramids! They were built as tombs for Egyptian pharaohs and are one of the wonders of the ancient world.')),
  tip(35,'History','Australian History','First Nations Navigation','Aboriginal Australians are incredible navigators! Long before GPS or compasses, they used the stars, the Sun, landmarks, and Songlines (ancient paths described in songs and stories) to travel across the vast Australian land.','⭐','float',...C.hist2,q('How did Aboriginal Australians find their way across the land?',['GPS devices','Knowledge of stars, land, and Songlines','Modern compasses','Road maps'],1,'Through deep knowledge of stars, land features, and Songlines — songs that describe paths across the land!')),
  tip(36,'History','World Events','The First Aeroplanes','In 1903, Wilbur and Orville Wright built and flew the first successful powered aeroplane! Their first flight lasted only 12 seconds and covered 36 metres — shorter than a cricket pitch! Now planes fly around the world!','✈️','slide-right',...C.hist3,q('Who built and flew the first successful aeroplane?',['Henry Ford','The Wright Brothers','Thomas Edison','Albert Einstein'],1,'The Wright Brothers — Wilbur and Orville — made history in 1903 with powered flight!')),
  tip(37,'Computer Science','Computers','Parts of a Computer','A computer has important parts! The SCREEN (monitor) shows you pictures and words. The KEYBOARD lets you type letters and numbers. The MOUSE lets you point and click. The brain of the computer is called the PROCESSOR!','🖥️','bounce',...C.cs1,q('What do you use to type words on a computer?',['Mouse','Screen','Keyboard','Speaker'],2,'The keyboard! It has letter, number, and special keys for typing text into the computer.')),
  tip(38,'Computer Science','Coding','Step-by-Step Sequences','In coding, a SEQUENCE is a set of instructions in a specific order. Like making a sandwich: 1) Get bread, 2) Add filling, 3) Close the sandwich. If you do steps out of order, things go wrong! Computers follow sequences exactly.','📝','slide-right',...C.cs2,q('Before making a sandwich, what important step should you do first?',['Eat it','Wash your hands','Sleep','Run outside'],1,'Wash your hands first! Hygiene is important, and in coding, getting the sequence right matters!')),
  tip(39,'Computer Science','Digital Literacy','Strong Passwords','A password protects your accounts — like a secret key! A GOOD password mixes letters, numbers, and symbols (like Sunny#42fish). A BAD password is easy to guess (like 1234 or your name). Never share your password!','🔒','pulse',...C.cs3,q('A good password should be…',['Your name','Easy to guess','A secret mix of letters and numbers','Written on a sticky note at school'],2,'A good password mixes letters, numbers, and symbols. Keep it secret and hard to guess!')),
  tip(40,'Astronomy','Space','Our Solar System','Our Solar System has 8 planets orbiting (going around) the Sun! Starting closest: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. My Very Excited Mum Just Served Us Nachos — that helps you remember!','🪐','spin',...C.space,q('How many planets are in our Solar System?',['7','8','9','10'],1,'8 planets! Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.'))
];

// ═══════════════════════════════════════════════════════════════════════════
//  YEARS 3-6 — loaded from existing content.json to avoid duplication
//  (only Year 1 was rewritten; Years 2-6 remain as-is from the JSON)
// ═══════════════════════════════════════════════════════════════════════════

// ─── Build & write ──────────────────────────────────────────────────────────
function main() {
  console.log('WonderWorks Content Generator');
  console.log('─'.repeat(50));

  // Load existing content.json if it exists, to preserve Years 3-6
  let existing = {};
  const jsonPath = file('content.json');
  if (fs.existsSync(jsonPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log('  Loaded existing content.json as base');
    } catch (e) {
      console.warn('  Warning: could not parse existing content.json, regenerating all');
    }
  }

  // Build the full content object
  // Year 1 = freshly upgraded | Year 2 = freshly defined above | Years 3-6 = existing
  const content = {
    '1': year1,
    '2': year2,
    '3': existing['3'] || [],
    '4': existing['4'] || [],
    '5': existing['5'] || [],
    '6': existing['6'] || [],
  };

  // Validate
  let ok = true;
  for (const [grade, items] of Object.entries(content)) {
    if (items.length !== 40) {
      console.error(`  ERROR: Year ${grade} has ${items.length} items (expected 40)`);
      ok = false;
    }
  }
  if (!ok) { process.exit(1); }

  // 1. Write content.json
  const json = JSON.stringify(content, null, 2);
  fs.writeFileSync(jsonPath, json, 'utf8');
  console.log(`  Wrote content.json (${(Buffer.byteLength(json) / 1024).toFixed(0)} KB)`);

  // 2. Write content.js (for legacy <script src> loading)
  const jsContent = `const CONTENT = ${json};\n`;
  fs.writeFileSync(file('content.js'), jsContent, 'utf8');
  console.log(`  Wrote content.js  (${(Buffer.byteLength(jsContent) / 1024).toFixed(0)} KB)`);

  // 3. Update index.html
  const htmlPath = file('index.html');
  if (!fs.existsSync(htmlPath)) {
    console.warn('  index.html not found — skipping HTML update');
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const startMarker = '/* __CONTENT_START__ */';
  const endMarker   = '/* __CONTENT_END__ */';
  const startIdx = html.indexOf(startMarker);
  const endIdx   = html.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error('  ERROR: Could not find __CONTENT_START__ / __CONTENT_END__ markers in index.html');
    process.exit(1);
  }

  const before = html.slice(0, startIdx + startMarker.length);
  const after  = html.slice(endIdx);
  const inlineContent = `\nconst CONTENT = ${json};\n`;
  html = before + inlineContent + after;

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`  Updated index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);

  // Summary
  console.log('─'.repeat(50));
  console.log('Done! Content summary:');
  const topics = new Set();
  let totalItems = 0;
  for (const [grade, items] of Object.entries(content)) {
    items.forEach(i => topics.add(i.topic));
    totalItems += items.length;
    console.log(`  Year ${grade}: ${items.length} tips/questions`);
  }
  console.log(`  Total: ${totalItems} items across ${topics.size} subjects`);
  console.log(`  Subjects: ${[...topics].sort().join(', ')}`);
}

main();
