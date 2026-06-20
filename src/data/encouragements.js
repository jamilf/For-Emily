// The shared Encouragement & Verse library — a single source the soot-sprite
// letters AND the flashcard gaps both read from.
//
// Item shape:
//   { id, type:'original'|'scripture', text, ref, themes[], tone, contexts[] }
//
// Themes: anxiety peace strength rest focus identity hope joy faith neuro cozy celebration
// Tones:  playful | faith | neuro | cozy | scripture
// Contexts: daily morning night complete rough breeze break idle
//
// Scripture text is filled at runtime from the cached verses map (see
// resolveText / withVerses); entries with no cached text are skipped by the
// picker so the sprite always has something kind to say (graceful fallback).

import { dayStr } from '../utils/day.js'

// ── Original encouragements ────────────────────────────────────────────────
// Authored in Emily's voice: warm, ADHD-affirming, Gen-Z but not cringe, a mix
// of playful / faith / nerdy / cozy. Hard rules: worth is never tied to grades;
// rest is allowed before empty; no guilt or toxic positivity; mostly < 25 words.
// Tuple form keeps it compact: [text, tone, [themes], [contexts]].
const ORIGINALS = [
  // ── Playful / Gen-Z ──────────────────────────────────────────────────────
  [
    'bestie, your prefrontal cortex is FLEXING right now. keep going. 🧠',
    'playful',
    ['focus', 'neuro'],
    ['idle', 'complete'],
  ],
  [
    "plot twist: you're the main character who actually passes her exams. ✨",
    'playful',
    ['joy', 'identity'],
    ['idle', 'breeze'],
  ],
  [
    'Emily. breathe. you have survived 100% of your hard days so far. undefeated. 🏆',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'this is your sign to stop spiralling and do ONE tiny thing. that is the whole task.',
    'playful',
    ['focus', 'anxiety'],
    ['idle', 'rough'],
  ],
  [
    'you do not have to do it all today — just the next small thing, bb.',
    'playful',
    ['focus', 'rest'],
    ['idle', 'break'],
  ],
  [
    'reminder: a B is not a personality flaw. you are not your GPA, queen. 👑',
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'current status: chosen, loved, and about to crush this study sesh. 💌',
    'playful',
    ['identity', 'faith'],
    ['idle', 'complete'],
  ],
  [
    'if your brain is being A Lot right now, that is ok. park it, come back.',
    'playful',
    ['anxiety', 'focus'],
    ['idle', 'rough'],
  ],
  ['no thoughts, just one flashcard. we go again. 🃏', 'playful', ['focus'], ['idle']],
  [
    'you opened the app instead of doom-scrolling. iconic behaviour, honestly.',
    'playful',
    ['focus', 'celebration'],
    ['idle'],
  ],
  [
    'little and often beats heroic and never. slow drip, Emily.',
    'playful',
    ['focus', 'rest'],
    ['idle', 'break'],
  ],
  ['the vibes are academic and so are you. let us get a few minutes in. 📚', 'playful', ['focus'], ['idle']],
  ['your only job for the next 25 minutes: be here, badly if needed.', 'playful', ['focus'], ['idle']],
  ['perfectionism said no. we said next slide please.', 'playful', ['focus', 'identity'], ['idle']],
  [
    'future-Emily just texted: thank you for starting. she sounds rested. 💤',
    'playful',
    ['rest', 'hope'],
    ['break', 'idle'],
  ],
  [
    'you are allowed to be a work in progress AND be proud of yourself.',
    'playful',
    ['identity', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    'done is a love letter to future-you. send it. 💌',
    'playful',
    ['focus', 'celebration'],
    ['complete', 'idle'],
  ],
  [
    'the exam is big, sure. but so is your stubbornness. use it. 😤',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    'hyperfocus is a gift, not a moral obligation. you can put it down.',
    'playful',
    ['rest', 'identity'],
    ['break'],
  ],
  ['one card. then maybe one more. that is how the deck disappears.', 'playful', ['focus'], ['idle']],
  [
    'ADHD tax says starting is the hard part. you literally already paid it. 🎉',
    'playful',
    ['focus', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    'ok but you showing up tired is more impressive than showing up easy.',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  ['gold star for opening the notes. yes that counts. ⭐', 'playful', ['celebration'], ['idle']],
  [
    'your brain is a browser with 40 tabs. close one. just one. we love progress.',
    'playful',
    ['focus', 'anxiety'],
    ['idle', 'rough'],
  ],
  [
    'be the unbothered scholar in her cozy era. rain outside, focus inside.',
    'playful',
    ['cozy', 'focus'],
    ['idle'],
  ],
  ['you cannot pour from an empty cup, so go refill it, literally. 🧃', 'playful', ['rest'], ['break']],
  [
    'small win unlocked. the brain likes that. give it another. 🎮',
    'playful',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'you are doing a hard degree on a hard brain. respect, genuinely.',
    'playful',
    ['strength', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'lower the bar until you can step over it. then step over it. 🪜',
    'playful',
    ['focus'],
    ['rough', 'idle'],
  ],
  ['nobody is grading your study aesthetic. messy notes still teach.', 'playful', ['identity'], ['idle']],
  [
    'if it feels impossible, make it smaller until it feels stupidly easy.',
    'playful',
    ['focus'],
    ['rough', 'idle'],
  ],
  [
    'you versus the urge to quit: you are winning right now by being here.',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  ['main quest: this paragraph. side quests can wait, Emily.', 'playful', ['focus'], ['idle']],
  [
    'proud of you for trying when trying was the expensive option today.',
    'playful',
    ['celebration', 'strength'],
    ['rough', 'complete'],
  ],
  [
    'your worth is not on the answer sheet. it never was. promise.',
    'playful',
    ['identity'],
    ['rough', 'idle'],
  ],
  ['five focused minutes > an hour of guilt-scrolling. start the five.', 'playful', ['focus'], ['idle']],
  [
    'the deck is not endless. you can see the bottom from here. keep going.',
    'playful',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'breathe in for four, out for six. ok. now one card. you got this.',
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'be so unserious about being perfect and so serious about being kind to you.',
    'playful',
    ['identity'],
    ['idle'],
  ],
  [
    'look at you, choosing the harder, better thing. that is character. 🌟',
    'playful',
    ['strength', 'celebration'],
    ['complete', 'idle'],
  ],

  // ── Faith-original ────────────────────────────────────────────────────────
  [
    'Emily, your worth was settled at the cross long before any exam. nothing you score changes how loved you are.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'daily', 'idle'],
  ],
  [
    'He is not asking you to be perfect — just to trust Him with the next hour.',
    'faith',
    ['faith', 'peace'],
    ['idle', 'rough'],
  ],
  [
    'the same God who holds the galaxies is holding your tired little heart tonight.',
    'faith',
    ['peace', 'faith'],
    ['night', 'rough'],
  ],
  [
    'you are not behind. you are exactly where grace can find you.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'He started something good in you, and He is not the type to leave things half-finished.',
    'faith',
    ['hope', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'when anxiety lies to you, let the truth be louder: you are His, and He is good.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'rest is not quitting — even God rested. you are allowed to close your eyes.',
    'faith',
    ['rest', 'faith'],
    ['break', 'night'],
  ],
  [
    'you do not have to carry tomorrow worry today. He is already there, waiting in it.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'night'],
  ],
  [
    'grace means you can begin again right now, no clean slate required first.',
    'faith',
    ['hope', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'He calls you beloved before you have achieved a single thing today.',
    'faith',
    ['identity', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'the God of the universe knows your name and the count of your eyelashes. you are seen.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you can bring Him the messy, half-finished version of today. He is not scared of it.',
    'faith',
    ['faith', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'peace is not a personality trait you lack — it is a Person you can lean on.',
    'faith',
    ['peace', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'He is gentle with the ones who are tired. let Him be gentle with you.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'your future is not riding on this exam alone. it is held in steadier hands.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'even when you feel far, He has not moved an inch from your side.',
    'faith',
    ['faith', 'peace'],
    ['rough', 'night'],
  ],
  [
    'He gives strength to the weary — and yes, that includes burnt-out students.',
    'faith',
    ['strength', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you were knit together on purpose, for a purpose. you are not an accident.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'lay the heavy thing down for a second. He never asked you to lift it alone.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'His mercies are new this morning — including for whatever yesterday held.',
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'you are fully known and fully loved at the same time. that is the whole gospel.',
    'faith',
    ['identity', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'He is not keeping score the way you fear He is. love settled that already.',
    'faith',
    ['faith', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'the storm is loud, but He is the ground beneath it. you will not be swept away.',
    'faith',
    ['anxiety', 'faith'],
    ['rough'],
  ],
  [
    'He delights in you — not in your output, in you. let that be enough today.',
    'faith',
    ['identity', 'joy'],
    ['idle', 'breeze'],
  ],
  [
    'cast the worry over to Him. He has caught heavier and never dropped one.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'your study can be worship — small faithfulness offered up with open hands.',
    'faith',
    ['focus', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'He is near to you right now, in the quiet, in the rain, in the trying.',
    'faith',
    ['peace', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'you do not earn the love. you live from it. study from that fullness, Emily.',
    'faith',
    ['identity', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'He turns weariness into rest and fear into trust. give Him a minute.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'whatever the result, you remain His. that part is not up for examination.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'complete'],
  ],
  [
    'He is writing a longer story than this semester. trust the Author.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you are held by the One who never sleeps. so you, dear, are allowed to.',
    'faith',
    ['rest', 'faith'],
    ['night'],
  ],
  [
    'bring the panic to prayer before you bring it to the page. order matters.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'His strength shows up best in your weakness, so the tiredness is not the end.',
    'faith',
    ['strength', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you are a daughter, not a project. He is not trying to fix you into worthy.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'the peace He gives is not the absence of the exam — it is His presence in it.',
    'faith',
    ['peace', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'He has gone before you into tomorrow. it is not unguarded. rest tonight.',
    'faith',
    ['peace', 'faith'],
    ['night'],
  ],
  [
    'joy is allowed even mid-revision. He made you for more than survival mode.',
    'faith',
    ['joy', 'faith'],
    ['breeze', 'idle'],
  ],
  ['you can do the next right thing and leave the outcome with Him.', 'faith', ['faith', 'focus'], ['idle']],
  [
    'He is faithful even on the days your feelings are not. lean on the fact.',
    'faith',
    ['faith', 'hope'],
    ['rough', 'idle'],
  ],

  // ── Neuro-nerdy ──────────────────────────────────────────────────────────
  [
    'every time you recall instead of reread, you are physically strengthening a synapse. that is real growth, Emily.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'your hippocampus consolidates everything while you sleep — so that nap is literally studying. 😴',
    'neuro',
    ['neuro', 'rest'],
    ['break', 'night'],
  ],
  [
    'dopamine loves small wins: finish one card, feel the hit, repeat. you are hacking your own brain.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'stress narrows focus, calm widens it. one slow breath = better recall. try it. 🌬️',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough', 'idle'],
  ],
  [
    'neuroplasticity says you are not bad at this — you are just early on the curve.',
    'neuro',
    ['neuro', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'your brain runs on ~20% of your energy. water, snack, then continue. 🧃',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'spaced repetition beats the forgetting curve — tiny reviews now save whole nights later.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'the testing effect is real: struggling to recall IS the learning, not a sign you failed.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'rough'],
  ],
  [
    'novelty wakes the ADHD brain up. new room, new pen, same brave Emily. ✏️',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'interleaving topics feels harder and works better. your confusion is the workout.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'cortisol drops when you exhale slowly. you can literally chemically calm down. 🌬️',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    'sleep is when memories move from fragile to permanent. protecting it is strategy, not laziness.',
    'neuro',
    ['neuro', 'rest'],
    ['night', 'break'],
  ],
  [
    'your working memory is small for everyone — that is why we write things down, not a flaw.',
    'neuro',
    ['neuro', 'identity'],
    ['idle'],
  ],
  [
    'movement boosts BDNF, basically fertiliser for neurons. a quick walk = sharper recall. 🚶',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'attention is a muscle that fatigues. resting it is how you get more of it back.',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'retrieval, not rereading, is what builds durable memory. close the notes and guess first.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'your brain tags emotional, repeated, and spaced info as important. so review beats cram.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'one tab of focus at a time — task-switching has a real cognitive cost. protect the lane.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'hydration affects concentration measurably. that foggy feeling might just be thirst. 💧',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'the brain consolidates during breaks too. stepping away is part of the learning loop.',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'dopamine is about anticipation, so a tiny reward after a card actually fuels the next one.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'you remember beginnings and ends best — so short sessions have more prime real estate.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'naming an emotion calms the amygdala. literally: "I feel anxious" turns the volume down.',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    'the forgetting curve is steep, but every review flattens it. you are bending it right now.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'your prefrontal cortex is still maturing into your mid-20s. be patient with the wiring. 🧠',
    'neuro',
    ['neuro', 'identity'],
    ['idle', 'rough'],
  ],
  [
    'errors light up learning circuits. getting it wrong now is your brain calibrating.',
    'neuro',
    ['neuro', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'curiosity primes the hippocampus to absorb — so let yourself find one bit interesting.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'a 5-minute walk in daylight resets your focus and your mood chemistry both. ☀️',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'the brain cannot multitask, only switch fast and pay a tax. single-task and keep the change.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'deep breaths flip you from fight-or-flight to rest-and-digest. recall lives in the calm.',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    'you are building myelin with every rep — insulation that makes recall faster. keep wrapping. 🧵',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'mild stress sharpens; chronic stress dulls. breaks are how you stay on the good side.',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'your brain weighs ~1.4kg and is carrying a whole degree. feed it, water it, rest it. 🧠',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'recall feels harder than recognition because it works harder — that effort is the point.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'memory is reconstruction, not playback. every recall makes the trace a little stronger.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],

  // ── Cozy / Ghibli ─────────────────────────────────────────────────────────
  [
    'imagine this is a quiet study cottage and the rain is on your side today. ☔',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'break'],
  ],
  [
    'light the imaginary lamp, pour the tea, let us do this gently. 🍵',
    'cozy',
    ['cozy', 'rest'],
    ['idle', 'break'],
  ],
  [
    'even Totoro waited patiently in the rain. your moment is coming. 🌳',
    'cozy',
    ['cozy', 'hope'],
    ['idle', 'rough'],
  ],
  [
    'you are not behind, just on a slow scenic route. enjoy the page you are on.',
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'picture soft rain on the window and a warm desk lamp. you are safe to think here.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'steam off the mug, page open, world quiet. just you and one small thing. 🍵',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'let the afternoon be slow. learning likes an unhurried heart. 🌧️',
    'cozy',
    ['cozy', 'rest'],
    ['break', 'idle'],
  ],
  [
    'wrap up in the blanket of "good enough for now" and keep turning pages.',
    'cozy',
    ['cozy', 'identity'],
    ['idle'],
  ],
  [
    'somewhere a kettle is singing just for you. take the break, then come back. 🫖',
    'cozy',
    ['cozy', 'rest'],
    ['break'],
  ],
  [
    'the lamp is warm, the rain is steady, and you are exactly where you should be.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'little forest spirits would tell you: rest under the tree before the long walk. 🌲',
    'cozy',
    ['cozy', 'rest'],
    ['break'],
  ],
  [
    'cosy season, gentle pace. you are allowed to study like it is a quiet ritual.',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'pretend the café is empty and the playlist is soft and the deadline is far. breathe.',
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'a candle, a window, a page. the small sacred things hold you while you work. 🕯️',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'the rain is doing its job outside. you only have to do one small thing inside.',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'curl up with the hard chapter like it is an old story you are learning to love.',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'soft start, soft pace. no thunder needed today, just steady, gentle rain.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'morning'],
  ],
  [
    'the kettle, the lamp, the quiet — your little sanctuary is open. welcome back. 🏡',
    'cozy',
    ['cozy', 'peace'],
    ['daily', 'idle'],
  ],
  [
    'let your shoulders drop an inch. the page will still be there, calmer now.',
    'cozy',
    ['cozy', 'rest'],
    ['break', 'rough'],
  ],
  [
    'a gentle afternoon of small progress is a beautiful, valid kind of day.',
    'cozy',
    ['cozy', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    'imagine the soot sprites tidying your worries into a little jar while you focus.',
    'cozy',
    ['cozy', 'anxiety'],
    ['idle', 'rough'],
  ],
  [
    'the storm can stay outside. in here it is warm, quiet, and yours. ☔',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'rough'],
  ],
  [
    'put the kettle on, Emily. learning goes down easier with something warm. 🍵',
    'cozy',
    ['cozy', 'rest'],
    ['break'],
  ],
  [
    'slow is still moving. the scenic route still gets there. enjoy the trees. 🌳',
    'cozy',
    ['cozy', 'hope'],
    ['idle'],
  ],
  ['tuck today in gently when it ends. you carried it well enough. 🌙', 'cozy', ['cozy', 'rest'], ['night']],

  // ── Anxiety & peace (comfort voice) ───────────────────────────────────────
  [
    'name three things you can see right now, Emily. you are here. you are okay. you are held.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough', 'idle'],
  ],
  [
    'the deadline feels like a wave; the ground under it is steady. you will not be swept away.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'peace is not the absence of the exam — it is steadiness right in the middle of it.',
    'cozy',
    ['peace', 'anxiety'],
    ['rough', 'idle'],
  ],
  [
    'feet on the floor, breath in your chest. this moment is actually survivable. it always was.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'the fear is loud but it is not in charge. you can be scared and still take one step.',
    'cozy',
    ['anxiety', 'strength'],
    ['rough'],
  ],
  [
    'put the spiralling thought in the brain dump. it is safe there. come back to now.',
    'cozy',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'you do not have to solve the whole worry. just the next five minutes. only those.',
    'cozy',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'anxiety predicts a hundred disasters; almost none arrive. you are allowed to disbelieve it.',
    'cozy',
    ['anxiety', 'hope'],
    ['rough'],
  ],
  [
    'slow the breath and the body follows. you are not in danger, just under pressure.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'the panic will crest and fall like every wave before it. ride it, do not fight it.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'it is okay to feel too much and still be completely okay underneath. both are true.',
    'cozy',
    ['anxiety', 'identity'],
    ['rough'],
  ],
  [
    'unclench your jaw, drop your shoulders, soften your hands. let the body lead the calm.',
    'cozy',
    ['anxiety', 'rest'],
    ['rough', 'break'],
  ],
  [
    'you have been this overwhelmed before and it passed. it will pass this time too.',
    'cozy',
    ['anxiety', 'hope'],
    ['rough'],
  ],
  [
    'breathe like you are not in a hurry. the urgency is a feeling, not a fact.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'quiet the catastrophe for one breath. what is actually true in this exact moment?',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],

  // ── Strength & perseverance ───────────────────────────────────────────────
  [
    'you are allowed to be tired AND to keep going. both are true, brave girl.',
    'playful',
    ['strength', 'rest'],
    ['rough', 'idle'],
  ],
  [
    'one more page, one more breath, one more small yes. that is how mountains move.',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'you have done hard things before and you are still here. evidence beats anxiety.',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'the days you study tired are the ones that build the real grit. this counts double.',
    'playful',
    ['strength'],
    ['rough', 'complete'],
  ],
  [
    'quitting and resting are different. rest, then rise. do not confuse the two.',
    'playful',
    ['strength', 'rest'],
    ['break', 'rough'],
  ],
  [
    'you are not failing, you are in the messy middle where it always feels like this.',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'courage is just doing the scared thing a little bit anyway. you are mid-courage now.',
    'playful',
    ['strength'],
    ['rough'],
  ],
  [
    'the wall you hit at hour two is normal. push past it gently, it is thinner than it looks.',
    'playful',
    ['strength', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'discipline is choosing what you want most over what you want now. you are choosing well.',
    'playful',
    ['strength', 'focus'],
    ['idle'],
  ],
  [
    'you keep showing up for a hard goal. that is not small. that is who you are becoming.',
    'playful',
    ['strength', 'identity'],
    ['idle', 'complete'],
  ],
  [
    'the finish line does not care how slow you went, only that you kept going. so keep going.',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'endurance is built in the boring middle, not the exciting start. you are building it now.',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    'weak days are part of strong stories. yours is not over because today is heavy.',
    'playful',
    ['strength', 'hope'],
    ['rough'],
  ],
  [
    'you do not have to feel strong to act brave. just do the next small, scary thing.',
    'playful',
    ['strength'],
    ['rough'],
  ],
  [
    'the comeback is quieter than the setback, but it is happening. one card at a time.',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],

  // ── Celebration ───────────────────────────────────────────────────────────
  [
    'SESSION COMPLETE. look at you go, Emily. heaven is cheering and so am I. 🎉',
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    'that is one more brick in the cathedral of your future. well done. 🧱',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  ['you showed up — that is the whole win. so proud of you. 🌿', 'playful', ['celebration'], ['complete']],
  [
    'another session banked. your future self is quietly, deeply grateful. 💛',
    'playful',
    ['celebration', 'hope'],
    ['complete'],
  ],
  [
    'that focus was real and it counted. take the win, do not minimise it. 🏅',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'look at the tree you just grew. small, alive, yours. well done, Emily. 🌱',
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    'you turned anxious energy into actual progress. that is alchemy. 🎉',
    'playful',
    ['celebration', 'strength'],
    ['complete'],
  ],
  [
    'done and dusted. let it feel good before you reach for the next thing.',
    'playful',
    ['celebration', 'rest'],
    ['complete', 'break'],
  ],
  [
    'that is exactly how big things get done — one finished session at a time. proud of you.',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'you kept a promise to yourself just now. those add up to a whole trustworthy life. 💌',
    'playful',
    ['celebration', 'identity'],
    ['complete'],
  ],
  [
    'win logged. brain fed. tree grown. you are doing the thing, genuinely. 🌳',
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    'that was not nothing. that was a real, focused, finished piece of work. celebrate it.',
    'playful',
    ['celebration'],
    ['complete'],
  ],

  // ── Rest / break ──────────────────────────────────────────────────────────
  [
    'step away, stretch, look out the window. your brain files things best when you pause.',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  ['gentle nudge to drink some water, Emily. yes, right now. 💧', 'cozy', ['rest'], ['break']],
  ['you are not a machine, thank God. take five — you have earned it.', 'cozy', ['rest', 'faith'], ['break']],
  [
    'unclench. you have been concentrating hard. let the break be actually restful.',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'look at something far away for twenty seconds. your eyes and mind both need the horizon.',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'rest before you are empty, not after. you are allowed to stop while there is still light.',
    'cozy',
    ['rest'],
    ['break'],
  ],
  ['stand up, roll your shoulders, shake it out. then sit back down softer. 🧘', 'cozy', ['rest'], ['break']],
  [
    'the break is part of the work, not a betrayal of it. take it without guilt.',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'go find some daylight for a minute. come back with a clearer, kinder head. ☀️',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'you have been so focused. let your shoulders down and just breathe for a bit.',
    'cozy',
    ['rest', 'peace'],
    ['break'],
  ],
  [
    'hydrate, snack, stretch — the unglamorous trio that keeps the brain online. 🧃',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'close your eyes for thirty seconds. nothing is required of you in this exact moment.',
    'cozy',
    ['rest', 'peace'],
    ['break'],
  ],

  // ── Morning / fresh start ─────────────────────────────────────────────────
  [
    'good morning, Emily. you do not have to do it all today — just gently begin. 🌅',
    'cozy',
    ['hope', 'peace'],
    ['morning', 'daily'],
  ],
  [
    'fresh page, fresh mercy, fresh you. yesterday does not get a vote today.',
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'ease into it. the first small task of the day is just to start, not to finish.',
    'cozy',
    ['focus', 'hope'],
    ['morning', 'daily'],
  ],
  [
    'today is allowed to be a slow, kind, ordinary day of small progress.',
    'cozy',
    ['peace', 'rest'],
    ['morning', 'daily'],
  ],
  [
    'whatever today holds, you do not face it alone or empty-handed. begin gently. 🌷',
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'one good morning thought: you get to learn things today. that is a quiet gift. 📖',
    'cozy',
    ['joy', 'focus'],
    ['morning', 'daily'],
  ],

  // ── Night / winding down ──────────────────────────────────────────────────
  ['you did enough today, Emily. truly. let the rest be the rest. 🌙', 'cozy', ['rest', 'peace'], ['night']],
  [
    'whatever stayed unfinished can wait for morning. sleep is part of tomorrow getting done.',
    'cozy',
    ['rest', 'neuro'],
    ['night'],
  ],
  [
    'put the day down. you are not behind, you are tired, and those feel the same at night.',
    'cozy',
    ['rest', 'anxiety'],
    ['night'],
  ],
  [
    'your brain will sort today while you sleep. closing the laptop IS the last study task. 😴',
    'neuro',
    ['rest', 'neuro'],
    ['night'],
  ],
  [
    'be proud of one thing from today before you sleep. just one. you will find it.',
    'cozy',
    ['celebration', 'rest'],
    ['night'],
  ],
  [
    'the lamp is off, the day is held, you are safe. rest now, brave girl. 🌙',
    'faith',
    ['rest', 'peace'],
    ['night'],
  ],

  // ── General / identity & hope (idle mix) ──────────────────────────────────
  [
    'you are more than what you produce, Emily. on your best day and your worst one.',
    'faith',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'a parked distraction is a win, not a failure. you caught it and set it down. 🧠',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    'starting small still counts as starting. tiny is not the same as nothing.',
    'playful',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'progress is rarely a straight line. yours is allowed to zigzag and still arrive.',
    'cozy',
    ['hope', 'focus'],
    ['idle', 'rough'],
  ],
  [
    'be as patient with your learning as you would be with a friend learning the same thing.',
    'cozy',
    ['identity', 'peace'],
    ['idle'],
  ],
  [
    'you are doing better than the anxious voice says. it always underestimates you.',
    'playful',
    ['anxiety', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'comparison is a thief and a liar. your pace is the right pace for your brain.',
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'the goal is not to never struggle. the goal is to keep being kind to you while you do.',
    'cozy',
    ['identity', 'peace'],
    ['idle', 'rough'],
  ],
  [
    'you can rest your way through a hard season instead of grinding through it. truly.',
    'cozy',
    ['rest', 'identity'],
    ['break', 'idle'],
  ],
  [
    'one focused minute given honestly is worth more than an hour of guilt. start the minute.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'hope is not naive — it is just refusing to let the hard day write the whole story.',
    'faith',
    ['hope'],
    ['rough', 'idle'],
  ],
  [
    'you are learning how to be gentle and disciplined at once. that is a rare, good skill.',
    'cozy',
    ['identity', 'focus'],
    ['idle'],
  ],
  [
    'the version of you that finishes this degree starts with the next small thing. hi to her.',
    'playful',
    ['hope', 'focus'],
    ['idle'],
  ],
  [
    'let "good enough to keep going" be the bar today. perfect can visit some other time.',
    'playful',
    ['focus', 'identity'],
    ['idle', 'rough'],
  ],
  [
    'your effort is visible even when your results are not yet. keep watering the seed. 🌱',
    'cozy',
    ['hope', 'strength'],
    ['idle', 'rough'],
  ],
  [
    'you are allowed to take up space, take your time, and take care of yourself today.',
    'cozy',
    ['identity', 'rest'],
    ['idle'],
  ],
  [
    'the brain dump is open if your head is full. empty it, then we focus. 🧠',
    'playful',
    ['anxiety', 'focus'],
    ['idle', 'rough'],
  ],
  [
    'you do not need to feel motivated to begin. motivation usually shows up after you start.',
    'neuro',
    ['focus'],
    ['idle'],
  ],
  [
    'small and consistent quietly beats big and rare. you are building the quiet kind. 🌿',
    'cozy',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'if today is just maintenance, that is still keeping the whole thing alive. well done.',
    'cozy',
    ['rest', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    'breeze day, Emily — ride the good mood into a couple of cards while it lasts. ☀️',
    'playful',
    ['joy', 'focus'],
    ['breeze'],
  ],
  [
    'feeling good today? bank a little extra kindness toward future-tired-you. 💛',
    'playful',
    ['joy', 'hope'],
    ['breeze'],
  ],
  [
    'on the light days, study gently and gratefully. you do not always feel this clear. ✨',
    'cozy',
    ['joy', 'focus'],
    ['breeze'],
  ],
  [
    'glad it feels easier today. let that be a gift, not a new standard to chase. 🌼',
    'cozy',
    ['joy', 'peace'],
    ['breeze'],
  ],
  [
    'good vibes detected. use a little, save a little, and do not burn it all at once. 🌞',
    'playful',
    ['joy', 'rest'],
    ['breeze'],
  ],
  [
    'the hard chapter is not a verdict on your intelligence. it is just a hard chapter.',
    'playful',
    ['identity', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'you are permitted to do this imperfectly. imperfect and done still beats perfect and never.',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    'kindness to yourself is not a reward for finishing. it is fuel for continuing. use it now.',
    'cozy',
    ['identity', 'rest'],
    ['idle', 'rough'],
  ],
  [
    'the panic about the future shrinks when you do one real thing in the present. do one.',
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'you are not lazy. you have a brain that needs different scaffolding, and you are building it.',
    'neuro',
    ['identity', 'neuro'],
    ['idle', 'rough'],
  ],

  // ── Batch 2 ───────────────────────────────────────────────────────────────
  // More of the same voice, spread across tones/themes/contexts.
  [
    'okay we are not doing the whole mountain. we are doing this one rock. pick it up. 🪨',
    'playful',
    ['focus'],
    ['idle', 'rough'],
  ],
  [
    'your attention came back the moment you noticed it wandered. that IS the skill. 👏',
    'playful',
    ['focus', 'neuro'],
    ['idle'],
  ],
  [
    'cute little genius energy today. open the notes and let us prove it. 🤓',
    'playful',
    ['focus', 'joy'],
    ['idle', 'breeze'],
  ],
  [
    'you are not behind your peers, you are on your own timeline. comparison is cancelled. 🚫',
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'the ick? procrastination. the serve? starting anyway. you are serving. 💅',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'low battery is allowed. plug in for five, then we resume. you are not a failed device. 🔋',
    'playful',
    ['rest', 'identity'],
    ['break'],
  ],
  [
    'be delusionally confident for one flashcard. fake it til the synapse makes it. ✨',
    'playful',
    ['focus', 'strength'],
    ['idle'],
  ],
  [
    'the group chat can wait. this paragraph is the assignment. eyes here, bestie. 👀',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'you are literally rewiring your brain for a living right now. so metal. 🤘',
    'playful',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'tiny progress is still the green bar moving. it counts. keep clicking. 📈',
    'playful',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'if it is dumb but it works, it is not dumb. study however your brain actually studies.',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    'you are allowed to want the rest AND the degree. wanting both does not make you weak.',
    'playful',
    ['rest', 'identity'],
    ['idle', 'break'],
  ],
  [
    'anxiety is not a fortune teller. it is a smoke alarm with trust issues. breathe. 🚨',
    'playful',
    ['anxiety'],
    ['rough', 'idle'],
  ],
  [
    'one flashcard is a complete, finishable thing. you can definitely finish one thing.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'the bar is on the floor today and that is fine. step over it and call it a win. 🏆',
    'playful',
    ['focus', 'celebration'],
    ['rough', 'idle'],
  ],
  [
    'you showing up at 30% is braver than someone showing up at 100%. respect the 30. ✊',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    'your brain is not broken, it is just running a different operating system. boot it gently. 💻',
    'neuro',
    ['identity', 'neuro'],
    ['idle', 'rough'],
  ],
  [
    'ten focused minutes you can be proud of beats an hour you spent feeling guilty. go. ⏱️',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'the cards do not know you are tired. they just want one honest guess. give them one. 🃏',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'Emily, you are not "behind on life." you are 22 and trying hard. that is right on time. 🌷',
    'playful',
    ['identity', 'hope'],
    ['idle', 'rough'],
  ],
  [
    'let the perfectionist take a nap. the good-enough-er is driving this study session. 😴',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    'progress over perfection, snacks over stress, naps over numbers. priorities sorted. 🧃',
    'playful',
    ['rest', 'focus'],
    ['break', 'idle'],
  ],
  [
    'you do not owe anyone a perfect study day. you just owe yourself a kind, honest one.',
    'cozy',
    ['identity', 'peace'],
    ['idle'],
  ],
  [
    'the dread is always bigger than the task. open it and watch the dread deflate. 🎈',
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'you can be soft and still be serious about your dreams. softness is not weakness. 🌸',
    'cozy',
    ['identity', 'strength'],
    ['idle'],
  ],

  [
    'He is not surprised by your weakness today. He has loved tired people since forever.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'lay this exam at His feet before you pick up the pen. He carries what you cannot.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'the worth He gave you does not fluctuate with your performance. it is fixed. it is finished.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you are allowed to come to Him empty. that is exactly the cup He loves to fill.',
    'faith',
    ['rest', 'faith'],
    ['rough', 'break'],
  ],
  [
    'He is patient with your becoming. you do not have to arrive today to be loved today.',
    'faith',
    ['identity', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'the future you are anxious about is a place He already inhabits. you will not arrive alone.',
    'faith',
    ['anxiety', 'hope', 'faith'],
    ['rough', 'night'],
  ],
  [
    'small faithful study, offered with open hands, is a kind of quiet prayer. He sees it.',
    'faith',
    ['focus', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'when you cannot feel Him near, He is near anyway. feelings are weather, He is climate.',
    'faith',
    ['faith', 'peace'],
    ['rough', 'night'],
  ],
  [
    'rest tonight like someone who is deeply loved, because you are. the striving can pause.',
    'faith',
    ['rest', 'faith'],
    ['night'],
  ],
  [
    'He is not measuring you against your classmates. He made each of you on purpose.',
    'faith',
    ['identity', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'hand Him the panic one breath at a time. He has never once been overwhelmed by it.',
    'faith',
    ['anxiety', 'faith'],
    ['rough'],
  ],
  [
    'you can trust the slow work He is doing in you even when you cannot see the progress.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'the grade is temporary. you are eternal. do not let the small thing define the big one.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'complete'],
  ],
  [
    'He delights to give wisdom to those who ask. so ask, then open the book in peace.',
    'faith',
    ['focus', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'your tiredness is not a sin to repent of. it is a limit He built in, on purpose. rest.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'He is writing redemption into even the wasted-feeling days. nothing is truly lost with Him.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you are kept. held. named. chosen. none of that was contingent on this semester.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'bring the half-done day to Him without apology. He works beautifully with unfinished things.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'night'],
  ],
  [
    'His love is not a reward you unlock. it is the ground you already stand on. study from it.',
    'faith',
    ['identity', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'fear knocks loudly; faith answers quietly. you do not have to shout it down, just trust.',
    'faith',
    ['anxiety', 'faith'],
    ['rough'],
  ],
  [
    'the peace that does not make sense is exactly the kind He specialises in. ask for some.',
    'faith',
    ['peace', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you can be both a serious scholar and a beloved child. He holds both of you at once.',
    'faith',
    ['identity', 'focus'],
    ['idle'],
  ],
  [
    'He is for you, not against you, even when the day feels like it is against you both.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'let the last thought before sleep be that you are safe, and held, and not alone. 🌙',
    'faith',
    ['rest', 'peace'],
    ['night'],
  ],
  [
    'the work matters, but you matter more, and to Him you always have. keep that order.',
    'faith',
    ['identity', 'faith'],
    ['idle'],
  ],

  [
    'recall fails, then succeeds, then sticks — that frustrating gap is literally the learning.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'rough'],
  ],
  [
    'your brain prunes what you do not use and strengthens what you revisit. so revisit. ✂️',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'a quick test beats a long reread every single time the science checks. quiz yourself.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'emotion glues memory. caring a little about the topic makes it stickier. find the hook.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'the ADHD brain chases interest, not importance. make the boring bit a tiny game. 🎯',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'your focus has a natural rhythm — ride the wave when it is high, rest when it dips.',
    'neuro',
    ['neuro', 'rest'],
    ['idle', 'break'],
  ],
  [
    'blood sugar dips tank concentration. that is not weakness, that is a snack signal. 🍎',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'writing it in your own words forces deeper encoding than copying ever will. paraphrase it.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'the brain loves chunking — three things grouped beat seven things scattered. group them.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'daylight in your eyes early sets your whole focus clock for the day. go catch some. ☀️',
    'neuro',
    ['neuro', 'rest'],
    ['morning', 'break'],
  ],
  [
    'confusion is not failure, it is your brain at the edge of what it knows. lean into the edge.',
    'neuro',
    ['neuro', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'spacing two short reviews beats one long cram by a mile. you are doing the smart thing.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'the more you retrieve a fact, the faster the path to it gets. you are paving roads. 🛣️',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'fatigue is data, not a verdict. it says rest the network, not that the network is broken.',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'a 20-minute power nap can genuinely consolidate what you just learned. permission granted. 😴',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'your senses gate attention — quieter room, fewer tabs, and recall gets measurably easier.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'the brain is plastic your whole life. "too late to learn this" is biologically false. 🧠',
    'neuro',
    ['neuro', 'hope'],
    ['idle', 'rough'],
  ],
  [
    'stress hormones literally block memory formation. calming down first is studying smarter.',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    'you encode better when you predict the answer first, even wrongly. guess before you peek.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'movement before study floods the brain with oxygen and focus chemicals. wiggle a bit. 🤸',
    'neuro',
    ['neuro', 'focus'],
    ['break', 'idle'],
  ],

  [
    'the rain is just background music for a brain doing brave, quiet work. 🌧️',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'imagine a soft blanket, a warm drink, and exactly one gentle task. that is enough. 🍵',
    'cozy',
    ['cozy', 'rest'],
    ['break', 'idle'],
  ],
  [
    'the little café in your mind is open late and the corner seat is yours. settle in. ☕',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'let the lamp glow and the page wait kindly. there is no rush in this little room.',
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'a slow rainy study afternoon is a gift, not a delay. sip it like tea. 🌧️',
    'cozy',
    ['cozy', 'rest'],
    ['idle', 'break'],
  ],
  [
    'picture the soot sprites stacking your finished thoughts into neat little piles. tidy mind. ✨',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'curl into the comfy chair of "I am allowed to go slowly" and turn one page. 🪑',
    'cozy',
    ['cozy', 'rest'],
    ['idle'],
  ],
  [
    'the wind outside, the warm inside, the quiet between — your sanctuary holds you. breathe.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'light the candle of one small intention and let it be the only flame you tend. 🕯️',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'a gentle pace is not falling behind. the forest path still reaches the same clearing. 🌲',
    'cozy',
    ['cozy', 'hope'],
    ['idle'],
  ],
  [
    'steam, lamplight, soft rain, one open book. you have everything you need right here. 🍵',
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'let today be a quiet, ordinary, lovely little study day. those are the ones that add up.',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],

  [
    'the wave of overwhelm always looks taller from inside it. you are bigger than it. breathe.',
    'cozy',
    ['anxiety', 'strength'],
    ['rough'],
  ],
  [
    'put one hand on your chest and feel it rise. see? still here. still okay. still held.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'you do not have to believe the worst-case story your brain is pitching. decline politely.',
    'cozy',
    ['anxiety', 'hope'],
    ['rough'],
  ],
  [
    'the to-do list is not a measure of your worth. it is just a list. you are a whole person.',
    'cozy',
    ['anxiety', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'let the next breath be slower than the last. that is the whole instruction right now.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    'fear shrinks in the light of one concrete next step. what is the smallest one? do that.',
    'cozy',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'you are safe in this moment, even if your body forgot. tell it gently: we are okay.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],

  [
    'you are tired because you are trying, not because you are failing. those are opposites.',
    'playful',
    ['strength', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'the middle of hard things always feels like this. it is not a sign to quit, just to rest.',
    'playful',
    ['strength', 'rest'],
    ['rough', 'break'],
  ],
  [
    'keep your promise to yourself a little longer. one more small yes. you are so close.',
    'playful',
    ['strength', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'grit is not gritting your teeth — it is gently refusing to give up on yourself. keep gently.',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    'you have outlasted every hard week so far. your track record is undefeated, Emily.',
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'the hard part is temporary. the strength you are building from it is not. bank it. 💪',
    'playful',
    ['strength'],
    ['rough', 'complete'],
  ],
  [
    'you can do the next ten minutes. you do not have to do the whole degree right now. just ten.',
    'playful',
    ['strength', 'focus'],
    ['rough', 'idle'],
  ],

  [
    'that is done and it is good. let yourself feel the small bright spark of finishing. ✨',
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    'another session in the bank. you are quietly becoming someone who finishes things. 🌟',
    'playful',
    ['celebration', 'identity'],
    ['complete'],
  ],
  [
    'you fed your brain real focus just now. that is self-respect in action. proud of you. 💛',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'the tree grew because you stayed. small, steady, alive — just like your progress. 🌱',
    'playful',
    ['celebration', 'hope'],
    ['complete'],
  ],
  [
    'take the win without a "but." you focused. you finished. full stop. well done. 🎉',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'that effort was real whether or not it felt productive. honour it. you showed up. 🙌',
    'playful',
    ['celebration', 'strength'],
    ['complete'],
  ],
  [
    'look how the small sessions are stacking into something real. brick by brick, Emily. 🧱',
    'playful',
    ['celebration', 'hope'],
    ['complete'],
  ],

  [
    'step away from the desk before your brain begs you to. proactive rest is a superpower. 🦸',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'drink the water, eat the snack, look at the sky. maintenance is not optional, it is wise. 🌤️',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'the work will keep. your wellbeing might not. take the break like it matters, because it does.',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'stretch tall, breathe deep, let the focus drain out for a minute. you will refill it. 🧘',
    'cozy',
    ['rest', 'peace'],
    ['break'],
  ],
  [
    'a real break means actually resting, not guilt-scrolling. close the loop, let go. 🌿',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'you concentrated hard. now let the brain wander on purpose for five minutes. it helps.',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'rest is productive. it is when the learning quietly files itself away. enjoy the pause. 📂',
    'neuro',
    ['rest', 'neuro'],
    ['break'],
  ],

  [
    'good morning, brave girl. just open one thing. that is the whole ask for now. 🌅',
    'cozy',
    ['hope', 'focus'],
    ['morning', 'daily'],
  ],
  [
    'the day is new and so are its mercies. yesterday does not get to set today’s tone.',
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'start soft. a slow, kind beginning still counts as beginning. ease in, Emily. 🌷',
    'cozy',
    ['peace', 'hope'],
    ['morning', 'daily'],
  ],
  [
    'you do not have to earn this morning. you just get to show up to it. gently. ☀️',
    'cozy',
    ['identity', 'peace'],
    ['morning', 'daily'],
  ],

  [
    'you carried today as well as you could, and that is genuinely enough. rest now. 🌙',
    'cozy',
    ['rest', 'peace'],
    ['night'],
  ],
  [
    'close the books. the unfinished bits will still be there, calmer, in the morning.',
    'cozy',
    ['rest', 'anxiety'],
    ['night'],
  ],
  [
    'let sleep do its quiet filing work. you have studied; now let your brain consolidate. 😴',
    'neuro',
    ['rest', 'neuro'],
    ['night'],
  ],
  [
    'name one good thing about today, then let the rest go soft. you did okay. 🌟',
    'cozy',
    ['celebration', 'rest'],
    ['night'],
  ],

  [
    'you are allowed to define success as "I was kind to myself and I tried." that counts.',
    'cozy',
    ['identity', 'celebration'],
    ['idle'],
  ],
  [
    'the messy first attempt is the price of every good final draft. pay it without shame.',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    'your pace is not a problem to fix. it is just yours. work with it, not against it. 🌿',
    'cozy',
    ['identity', 'peace'],
    ['idle'],
  ],
  [
    'one honest, focused minute is a doorway. step through and the next minute opens too.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'you do not have to be fearless to be faithful to the task. scared and trying is plenty.',
    'faith',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'the anxious voice exaggerates. the kind voice tells the truth. listen to the kind one.',
    'cozy',
    ['anxiety', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'begin before you feel ready. readiness is usually just a few minutes of starting in disguise.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'hard does not mean wrong. it just means hard. you are allowed to do hard things slowly.',
    'cozy',
    ['strength', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'you are building a whole future out of small ordinary minutes like this one. nice work. 🧱',
    'playful',
    ['hope', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'let "I showed up" be a complete sentence today. you do not have to justify the rest.',
    'cozy',
    ['identity', 'celebration'],
    ['idle', 'rough'],
  ],
  [
    'the seed does not rush the soil. trust your slow, real, underground progress. 🌱',
    'cozy',
    ['hope', 'identity'],
    ['idle', 'rough'],
  ],
  [
    'you can put the heavy feeling in the brain dump and pick the page back up. both are allowed.',
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'feeling clear today? lovely. do a gentle bit and thank your brain for the easy hour. ✨',
    'playful',
    ['joy', 'focus'],
    ['breeze'],
  ],
  [
    'light-hearted day, light-handed study. enjoy that it feels possible right now. 🌞',
    'cozy',
    ['joy', 'peace'],
    ['breeze'],
  ],
  [
    'ride the good mood into one small win, then let yourself simply enjoy feeling okay. 🌼',
    'playful',
    ['joy', 'celebration'],
    ['breeze'],
  ],
  [
    'you are not the sum of your unfinished tasks. you are a whole, loved, trying person.',
    'faith',
    ['identity'],
    ['rough', 'idle'],
  ],
  [
    'the comparison game has no winners, only tired players. set the controller down. 🎮',
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'small, repeated, gentle effort is how every big thing has ever actually been built.',
    'cozy',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'you do not need the whole staircase. just trust enough to take the first step. 🪜',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'rest is not the reward at the end of worthiness. it is a need you are allowed to meet now.',
    'cozy',
    ['rest', 'identity'],
    ['break', 'idle'],
  ],
]

// ── Scripture references ─────────────────────────────────────────────────────
// [ref, [themes], [extraContexts?]]. Text is filled from the cached verses map at
// runtime; deduped by ref (a few refs serve multiple themes — merged here).
const SCRIPTURE_REFS = [
  // Anxiety / worry
  ['Philippians 4:6-7', ['anxiety', 'peace', 'faith']],
  ['Matthew 6:25-27', ['anxiety', 'faith']],
  ['Matthew 6:34', ['anxiety', 'faith']],
  ['1 Peter 5:6-7', ['anxiety', 'faith']],
  ['Psalm 55:22', ['anxiety', 'strength', 'faith']],
  ['Isaiah 41:10', ['anxiety', 'strength', 'faith']],
  ['Isaiah 35:4', ['anxiety', 'strength']],
  ['Psalm 94:19', ['anxiety', 'peace']],
  ['John 14:27', ['anxiety', 'peace', 'faith']],
  ['Psalm 56:3', ['anxiety', 'faith']],
  ['Psalm 34:4', ['anxiety', 'peace']],
  ['Proverbs 12:25', ['anxiety', 'hope']],
  ['Luke 12:22-26', ['anxiety', 'faith']],
  ['Psalm 46:1-3', ['anxiety', 'strength', 'faith']],
  ['Psalm 62:1-2', ['anxiety', 'rest', 'faith']],
  ['Matthew 11:28-30', ['rest', 'anxiety', 'faith']],
  ['Psalm 139:23-24', ['anxiety', 'faith']],
  ['Isaiah 26:3', ['anxiety', 'peace', 'faith']],
  // Peace
  ['Colossians 3:15', ['peace', 'faith']],
  ['Romans 5:1', ['peace', 'faith']],
  ['Numbers 6:24-26', ['peace', 'faith'], ['morning']],
  ['Psalm 29:11', ['peace', 'strength']],
  ['Romans 15:13', ['peace', 'hope', 'joy']],
  ['2 Thessalonians 3:16', ['peace', 'faith']],
  ['John 16:33', ['peace', 'strength', 'hope']],
  ['Psalm 4:8', ['peace', 'rest'], ['night']],
  ['Isaiah 32:17', ['peace']],
  ['Galatians 5:22-23', ['peace', 'joy', 'faith']],
  ['Psalm 119:165', ['peace', 'focus']],
  ['Isaiah 54:10', ['peace', 'identity', 'faith']],
  ['Psalm 85:8', ['peace', 'faith']],
  // Strength / perseverance
  ['Isaiah 40:28-31', ['strength', 'rest', 'hope']],
  ['Philippians 4:13', ['strength', 'faith']],
  ['2 Corinthians 12:9-10', ['strength', 'faith']],
  ['Psalm 28:7', ['strength', 'joy', 'faith']],
  ['Psalm 46:1', ['strength', 'faith']],
  ['Nehemiah 8:10', ['strength', 'joy']],
  ['Habakkuk 3:19', ['strength', 'faith']],
  ['Ephesians 6:10', ['strength', 'faith']],
  ['Psalm 18:32-34', ['strength', 'faith']],
  ['Joshua 1:9', ['strength', 'faith']],
  ['Deuteronomy 31:6', ['strength', 'faith']],
  ['Psalm 73:26', ['strength', 'faith']],
  ['1 Corinthians 16:13', ['strength', 'focus']],
  ['Galatians 6:9', ['strength', 'hope', 'focus']],
  ['James 1:12', ['strength', 'hope']],
  ['Romans 5:3-5', ['strength', 'hope']],
  ['2 Timothy 1:7', ['strength', 'identity', 'faith']],
  ['Colossians 1:11', ['strength', 'faith']],
  ['Psalm 27:14', ['strength', 'hope']],
  ['Psalm 31:24', ['strength', 'hope']],
  ['Isaiah 12:2', ['strength', 'faith']],
  ['Psalm 138:3', ['strength', 'faith']],
  // Rest
  ['Psalm 23:1-3', ['rest', 'peace', 'faith']],
  ['Exodus 33:14', ['rest', 'faith']],
  ['Psalm 62:1', ['rest', 'faith']],
  ['Hebrews 4:9-10', ['rest', 'faith']],
  ['Mark 6:31', ['rest']],
  ['Psalm 127:2', ['rest', 'faith'], ['night']],
  ['Jeremiah 31:25', ['rest', 'hope']],
  ['Psalm 116:7', ['rest', 'peace']],
  ['Isaiah 30:15', ['rest', 'strength']],
  // Identity / worth
  ['Psalm 139:13-16', ['identity', 'faith']],
  ['Ephesians 2:10', ['identity', 'faith']],
  ['1 Peter 2:9', ['identity', 'faith']],
  ['Galatians 2:20', ['identity', 'faith']],
  ['Zephaniah 3:17', ['identity', 'joy', 'faith']],
  ['Isaiah 43:1-4', ['identity', 'faith']],
  ['Romans 8:1', ['identity', 'faith']],
  ['Jeremiah 1:5', ['identity', 'faith']],
  ['1 John 3:1', ['identity', 'faith']],
  ['2 Corinthians 5:17', ['identity', 'hope']],
  ['Ephesians 1:4-5', ['identity', 'faith']],
  ['Matthew 10:29-31', ['identity', 'peace', 'faith']],
  ['Luke 12:7', ['identity', 'faith']],
  ['Isaiah 49:15-16', ['identity', 'faith']],
  ['Colossians 3:3', ['identity', 'faith']],
  // Hope / discouragement
  ['Jeremiah 29:11', ['hope', 'faith']],
  ['Romans 8:28', ['hope', 'faith']],
  ['Lamentations 3:22-24', ['hope', 'faith'], ['morning']],
  ['Psalm 30:5', ['hope', 'joy']],
  ['Psalm 42:11', ['hope', 'faith']],
  ['Isaiah 40:31', ['hope', 'strength']],
  ['Romans 5:5', ['hope', 'faith']],
  ['Hebrews 6:19', ['hope', 'faith']],
  ['Psalm 27:13', ['hope', 'faith']],
  ['Psalm 130:5', ['hope', 'faith']],
  ['Micah 7:7', ['hope', 'faith']],
  ['1 Peter 1:3', ['hope', 'faith']],
  ['Proverbs 23:18', ['hope']],
  ['Romans 12:12', ['hope', 'joy', 'faith']],
  // Trust / wisdom / studying
  ['Proverbs 3:5-6', ['faith', 'focus']],
  ['James 1:5', ['faith', 'focus']],
  ['Proverbs 2:6', ['faith', 'focus']],
  ['Psalm 32:8', ['faith', 'focus']],
  ['Isaiah 30:21', ['faith', 'focus']],
  ['Colossians 3:23', ['focus', 'faith']],
  ['1 Corinthians 15:58', ['focus', 'strength', 'faith']],
  ['Psalm 90:17', ['focus', 'faith']],
  ['Proverbs 16:3', ['focus', 'faith']],
  ['Daniel 1:17', ['focus', 'faith']],
  ['James 1:2-4', ['strength', 'hope', 'faith']],
  ['Psalm 37:5', ['faith', 'peace']],
  ['Proverbs 9:10', ['focus', 'faith']],
  ['2 Timothy 2:15', ['focus', 'faith']],
  ['Proverbs 16:9', ['faith', 'hope']],
  ['Jeremiah 33:3', ['faith', 'hope']],
  // Joy
  ['Psalm 16:11', ['joy', 'faith']],
  ['Psalm 118:24', ['joy', 'faith'], ['morning']],
  ['Philippians 4:4', ['joy', 'faith']],
  ['Psalm 30:11-12', ['joy', 'hope']],
  ['Psalm 126:3', ['joy', 'celebration']],
  ['John 15:11', ['joy', 'faith']],
  ['Proverbs 17:22', ['joy', 'neuro']],
  // God's presence / never alone
  ['Deuteronomy 31:8', ['faith', 'peace']],
  ['Psalm 23:4', ['faith', 'peace', 'strength']],
  ['Matthew 28:20', ['faith', 'peace']],
  ['Psalm 139:7-10', ['faith', 'identity']],
  ['Hebrews 13:5', ['faith', 'peace']],
  ['Psalm 46:7', ['faith', 'strength']],
  ['Psalm 16:8', ['faith', 'peace']],
  ['Isaiah 43:2', ['faith', 'strength']],
  ['Psalm 73:23', ['faith', 'peace']],
  // Morning / new day
  ['Psalm 143:8', ['hope', 'faith'], ['morning']],
  ['Psalm 5:3', ['hope', 'faith'], ['morning']],
  ['Psalm 90:14', ['joy', 'faith'], ['morning']],
  ['Isaiah 33:2', ['hope', 'strength'], ['morning']],
  ['Psalm 59:16', ['strength', 'joy'], ['morning']],
  // Night / sleep
  ['Psalm 121:3-4', ['rest', 'peace', 'faith'], ['night']],
  ['Proverbs 3:24', ['rest', 'peace'], ['night']],
  ['Psalm 63:6-7', ['rest', 'faith'], ['night']],
  ['Psalm 3:5', ['rest', 'faith'], ['night']],
  ['Psalm 91:1-2', ['rest', 'peace', 'faith'], ['night']],
]

// Map a theme to the moments it naturally fits, so scripture inherits sensible
// contexts without hand-tagging every reference.
const THEME_CONTEXTS = {
  anxiety: ['rough', 'daily', 'idle'],
  peace: ['rough', 'daily', 'idle', 'break'],
  strength: ['complete', 'rough', 'idle'],
  rest: ['break', 'idle'],
  focus: ['idle', 'complete'],
  identity: ['rough', 'daily', 'idle'],
  hope: ['rough', 'daily', 'idle'],
  joy: ['breeze', 'complete', 'idle'],
  faith: ['daily', 'idle', 'rough'],
  neuro: ['idle', 'break'],
  cozy: ['break', 'idle'],
  celebration: ['complete', 'breeze'],
}

function contextsFromThemes(themes, extra = []) {
  const set = new Set(extra)
  for (const t of themes) for (const c of THEME_CONTEXTS[t] || []) set.add(c)
  return [...set]
}

// ── Assemble the library ─────────────────────────────────────────────────────
let _seq = 0
const nextId = () => `enc_${String(++_seq).padStart(4, '0')}`

const originalItems = ORIGINALS.map(([text, tone, themes, contexts]) => ({
  id: nextId(),
  type: 'original',
  text,
  ref: null,
  themes,
  tone,
  contexts,
}))

const scriptureItems = SCRIPTURE_REFS.map(([ref, themes, extra = []]) => ({
  id: nextId(),
  type: 'scripture',
  text: null, // filled from the cached verses map at runtime
  ref,
  themes,
  tone: 'scripture',
  contexts: contextsFromThemes(themes, extra),
}))

export const ENCOURAGEMENTS = [...originalItems, ...scriptureItems]

/** All scripture references the app would like cached (for fetchVerses). */
export const ALL_REFS = scriptureItems.map((s) => s.ref)

// ── Context weighting ────────────────────────────────────────────────────────
// Per moment, the tones we lean toward. Items get a base weight, multiplied if
// their tone is favoured for this context — so e.g. "complete" surfaces more
// celebration, "rough" leans comfort/faith, without ever excluding the rest.
export const CONTEXT_WEIGHTS = {
  daily: { faith: 3, cozy: 2, scripture: 3, neuro: 1, playful: 1 },
  morning: { faith: 3, cozy: 2, scripture: 2, playful: 1, neuro: 1 },
  night: { cozy: 3, faith: 3, scripture: 2, playful: 1, neuro: 1 },
  complete: { playful: 3, faith: 2, scripture: 2, neuro: 2, cozy: 1 },
  rough: { faith: 3, cozy: 3, scripture: 3, playful: 1, neuro: 1 },
  breeze: { playful: 3, cozy: 2, faith: 1, neuro: 1, scripture: 1 },
  break: { cozy: 3, neuro: 2, playful: 2, faith: 1, scripture: 1 },
  idle: { playful: 2, faith: 2, neuro: 2, cozy: 2, scripture: 2 },
}

// ── Selection ────────────────────────────────────────────────────────────────
/**
 * Resolve an item's display text — scripture pulls from the cached verses map.
 * Returns '' when a verse has no cached text yet (so callers can skip it).
 */
export function resolveText(item, verses = {}) {
  if (item.type === 'scripture') return verses[item.ref] || ''
  return item.text
}

function eligible(context, verses) {
  return ENCOURAGEMENTS.filter((it) => {
    if (!it.contexts.includes(context)) return false
    if (it.type === 'scripture' && !verses[it.ref]) return false // skip un-cached verses
    return true
  })
}

function weightedPick(pool, context) {
  const weights = CONTEXT_WEIGHTS[context] || {}
  let total = 0
  const cumulative = pool.map((it) => {
    total += weights[it.tone] || 1
    return total
  })
  const r = Math.random() * total
  for (let i = 0; i < pool.length; i++) if (r < cumulative[i]) return pool[i]
  return pool[pool.length - 1]
}

/**
 * Pick one encouragement for a context using a no-repeat shuffle bag.
 * `seen` is the list of recently-shown ids; we exclude them until the eligible
 * pool is exhausted, then reset. Returns { item, nextSeen, text } — never throws.
 *
 * @param {string} context  one of the context tags
 * @param {{ seen?: string[], verses?: Record<string,string> }} state
 */
export function pickByContext(context, { seen = [], verses = {} } = {}) {
  let pool = eligible(context, verses)
  // Fallbacks: if a context somehow has nothing cached, widen to 'idle', then
  // to any original — the sprite must always have something kind to say.
  if (pool.length === 0) pool = eligible('idle', verses)
  if (pool.length === 0) pool = ENCOURAGEMENTS.filter((it) => it.type === 'original')

  const seenSet = new Set(seen)
  let fresh = pool.filter((it) => !seenSet.has(it.id))
  let resetSeen = false
  if (fresh.length === 0) {
    fresh = pool // bag exhausted — reshuffle
    resetSeen = true
  }

  const item = weightedPick(fresh, context)
  // Keep every id seen this cycle so a context never repeats until its eligible
  // pool is exhausted (the cap must exceed the largest pool). On exhaustion the
  // bag resets and reshuffles.
  const base = resetSeen ? [] : seen
  const nextSeen = [...base, item.id].slice(-ENCOURAGEMENTS.length)
  return { item, nextSeen, text: resolveText(item, verses) }
}

// ── Verse of the day ─────────────────────────────────────────────────────────
function hashDate(dateStr) {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0
  return h
}

/**
 * A scripture item that is stable for the whole calendar day (seeded by date).
 * Prefers verses already cached; returns null if none are available yet.
 *
 * @param {Record<string,string>} verses  cached { ref: text } map
 * @param {string} dateStr  YYYY-MM-DD (defaults to today, local)
 */
export function verseOfDay(verses = {}, dateStr = dayStr()) {
  const cached = scriptureItems.filter((s) => verses[s.ref])
  const pool = cached.length > 0 ? cached : scriptureItems
  if (pool.length === 0) return null
  const item = pool[hashDate(dateStr) % pool.length]
  return { ...item, text: verses[item.ref] || '' }
}

// ── Letter sign-offs (rotating) ──────────────────────────────────────────────
export const SIGNOFFS = [
  '— your soot friend',
  '— here in the rain with you ☔',
  '— rooting for you, always',
  '— with a little cup of tea 🍵',
  '— from your cozy corner',
  '— the sprite who believes in you',
  '— softly, and on your side',
  '— see you after the next session 🌱',
  '— keeping the lamp on for you 🕯️',
  '— proud of you, truly',
]

export function randomSignoff() {
  return SIGNOFFS[Math.floor(Math.random() * SIGNOFFS.length)]
}
