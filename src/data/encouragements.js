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
    'look at you, sitting down to think. your mind is quietly doing something lovely right now. 🧠',
    'playful',
    ['focus', 'neuro'],
    ['idle', 'complete'],
  ],
  [
    "i hope you can feel how easy you are to root for. you're going to be okay. more than okay. ✨",
    'playful',
    ['joy', 'identity'],
    ['idle', 'breeze'],
  ],
  [
    "Emily, breathe. you have made it through every hard day so far, every single one. i'm right here. 🤍",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "if your thoughts are racing, let's just choose one small thing together. that's the whole task today.",
    'playful',
    ['focus', 'anxiety'],
    ['idle', 'rough'],
  ],
  [
    "you don't have to do it all today, love. just the next small thing. i'll be right here for it.",
    'playful',
    ['focus', 'rest'],
    ['idle', 'break'],
  ],
  [
    'a hard grade is not who you are. it never could be. i love you just the same, no matter what. 🤍',
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'you are already loved, right now, before you finish a single thing. please hold onto that today. 💛',
    'playful',
    ['identity', 'faith'],
    ['idle', 'complete'],
  ],
  [
    "if your head feels like too much, that's okay. set it down gently and come back when you're ready.",
    'playful',
    ['anxiety', 'focus'],
    ['idle', 'rough'],
  ],
  [
    "no pressure. just one card, and then we'll see. i'm sitting right here beside you. 🃏",
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'you came here instead of somewhere easier. that quiet little choice matters more than you know.',
    'playful',
    ['focus', 'celebration'],
    ['idle'],
  ],
  [
    "a little, gently, often. that's how the big things get done. you don't have to be a hero today, Emily.",
    'playful',
    ['focus', 'rest'],
    ['idle', 'break'],
  ],
  [
    "soft lamp, quiet room, just the two of us. let's give it a few gentle minutes together. 📚",
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'your only job for a little while is to be here, even messily. that is allowed. that is plenty.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "you don't have to do this perfectly. you only have to do the next small bit. let's turn the page.",
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    "the you of tomorrow is going to be so grateful you began today. she's resting a little easier already. 💤",
    'playful',
    ['rest', 'hope'],
    ['break', 'idle'],
  ],
  [
    'you can still be growing and be proud of yourself at the very same time. both are true, always.',
    'playful',
    ['identity', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    "finishing this is a small kindness to the you of tomorrow. let's send it to her, gently. 💌",
    'playful',
    ['focus', 'celebration'],
    ['complete', 'idle'],
  ],
  [
    "yes, it's a lot. but you are steadier than you feel right now. i've seen it in you. lean on that.",
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    "you're allowed to set it down and rest. resting doesn't make you any less. it never has. 🤍",
    'playful',
    ['rest', 'identity'],
    ['break'],
  ],
  [
    "one card, love. then maybe one more, if you feel like it. that's how the whole thing softens.",
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    'starting was the hardest part, and you already did it. the rest is just walking now. so proud. 🌱',
    'playful',
    ['focus', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    'showing up tired is the bravest kind of showing up. i hope you can feel how much that counts.',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    "opening the notes was a real step, and i'm not letting it go unnoticed. well done, you. ⭐",
    'playful',
    ['celebration'],
    ['idle'],
  ],
  [
    "if your mind has a hundred things open, let's just close one together. one is real progress, truly.",
    'playful',
    ['focus', 'anxiety'],
    ['idle', 'rough'],
  ],
  [
    "imagine it's only you, the rain, and a warm desk. nothing to prove out there. just this quiet page. ☔",
    'playful',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    "you can't pour from an empty cup, so go fill yours. water, a snack, a breath. i'll be right here. 🧃",
    'playful',
    ['rest'],
    ['break'],
  ],
  [
    "that was a small win, and your heart felt it. let's gently reach for one more. 🌱",
    'playful',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    "you're doing a hard thing with a tired mind, and you keep going anyway. i'm so in awe of you.",
    'playful',
    ['strength', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'lower the bar until it feels almost too easy, then step right over it. small still counts, love.',
    'playful',
    ['focus'],
    ['rough', 'idle'],
  ],
  [
    'no one is grading how tidy your notes are. messy and real still teaches you. you are doing fine.',
    'playful',
    ['identity'],
    ['idle'],
  ],
  [
    'if it feels impossible, make it smaller, and smaller, until it feels easy. then begin right there.',
    'playful',
    ['focus'],
    ['rough', 'idle'],
  ],
  [
    "the part of you that wanted to stop didn't win today, because you're still here. that's everything.",
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    'just this one paragraph, love. everything else can wait for you. it will keep.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "trying cost you a lot today, and you did it anyway. i'm so quietly proud of you for that. 🤍",
    'playful',
    ['celebration', 'strength'],
    ['rough', 'complete'],
  ],
  [
    'your worth was never on that answer sheet. not once. you are precious to me exactly as you are.',
    'playful',
    ['identity'],
    ['rough', 'idle'],
  ],
  [
    "five gentle minutes are worth more than an hour of being hard on yourself. let's start the five.",
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "the deck isn't endless, i promise. you're closer to the end than it feels. keep going, softly.",
    'playful',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    "breathe in for four, out for six. there. now just one card, and i'm with you the whole way through.",
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'please be gentle with yourself today. being kind to you matters so much more than being perfect.',
    'playful',
    ['identity'],
    ['idle'],
  ],
  [
    'you chose the harder, kinder thing, and that quiet courage is so you. i see it. i always do. 🌟',
    'playful',
    ['strength', 'celebration'],
    ['complete', 'idle'],
  ],

  // ── Faith-original ────────────────────────────────────────────────────────
  [
    'Emily, your worth was settled at the cross long before any exam, and nothing you score will ever change how deeply you are loved.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'daily', 'idle'],
  ],
  [
    "He isn't asking you to be perfect, love. only to trust Him with the next hour. that's all.",
    'faith',
    ['faith', 'peace'],
    ['idle', 'rough'],
  ],
  [
    'the same God who holds the galaxies is holding your tired little heart tonight. you can rest now.',
    'faith',
    ['peace', 'faith'],
    ['night', 'rough'],
  ],
  [
    'you are not behind. you are exactly where grace can find you, and it already has.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'He started something good in you, and He is not the kind to leave it half-finished. you can trust that.',
    'faith',
    ['hope', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'when the worry lies to you, let the truth be louder: you are His, and He is good, and you are safe.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'rest is not quitting. even God rested, so you are allowed to close your eyes, love. truly.',
    'faith',
    ['rest', 'faith'],
    ['break', 'night'],
  ],
  [
    "you don't have to carry tomorrow's worry today. He is already there, waiting for you inside it.",
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'night'],
  ],
  [
    'grace means you can begin again right now. no clean slate required first. just begin, gently.',
    'faith',
    ['hope', 'faith'],
    ['idle', 'rough'],
  ],
  [
    'He calls you beloved before you have done a single thing today. that name is already yours.',
    'faith',
    ['identity', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'the One who made the universe knows your name and every eyelash. you are seen, completely, right now.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "you can bring Him the messy, half-finished version of today. He isn't scared of it, and He isn't scared of yours.",
    'faith',
    ['faith', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "peace isn't a personality trait you're missing. it's a Person you can lean on, and He's right here.",
    'faith',
    ['peace', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'He is so gentle with the ones who are tired. please, let Him be gentle with you tonight.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    "your whole future isn't riding on this one exam. it's held in steadier, kinder hands than that.",
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "even when you feel far away, He hasn't moved an inch from your side. not one inch, dear.",
    'faith',
    ['faith', 'peace'],
    ['rough', 'night'],
  ],
  [
    'He gives strength to the weary, and yes, that includes tired, burnt-out students like you.',
    'faith',
    ['strength', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you were knit together on purpose, for a purpose. you are not an accident, Emily. never were.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'lay the heavy thing down for just a moment. He never once asked you to lift it alone.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'His mercies are new again this morning, including for whatever yesterday held. you get to start fresh.',
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'you are fully known and fully loved at the very same time. that is the whole of it, really.',
    'faith',
    ['identity', 'faith'],
    ['idle', 'rough'],
  ],
  [
    "He isn't keeping the score you're afraid He is. love settled all of that a long time ago.",
    'faith',
    ['faith', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'the storm is loud, i know. but He is the ground beneath it, and you will not be swept away.',
    'faith',
    ['anxiety', 'faith'],
    ['rough'],
  ],
  [
    'He delights in you. not in what you produce, in you. let that be more than enough today.',
    'faith',
    ['identity', 'joy'],
    ['idle', 'breeze'],
  ],
  [
    'hand the worry over to Him. He has caught so much heavier, and He has never once dropped it.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'your studying can be a quiet kind of worship: small faithfulness, offered up with open hands.',
    'faith',
    ['focus', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'He is near to you right now, in the quiet, in the rain, in the trying. you are not alone in this.',
    'faith',
    ['peace', 'faith'],
    ['idle', 'rough'],
  ],
  [
    "you don't have to earn the love, Emily. you get to live from it. study from that fullness today.",
    'faith',
    ['identity', 'faith'],
    ['idle', 'daily'],
  ],
  [
    'He turns weariness into rest and fear into trust. give Him just a minute with your heart.',
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'whatever the result turns out to be, you remain His. that part was never up for examination.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'complete'],
  ],
  [
    'He is writing a much longer story than this one semester. you can trust the Author with it.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you are held by the One who never sleeps, so you, dear, are finally allowed to. rest now.',
    'faith',
    ['rest', 'faith'],
    ['night'],
  ],
  [
    'bring the panic to prayer before you bring it to the page. the order really does matter, love.',
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'His strength shows up best right in your weakness, so this tiredness is not the end of anything.',
    'faith',
    ['strength', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "you are a daughter, not a project. He isn't trying to fix you into someone worthy. you already are.",
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "the peace He gives isn't the exam disappearing. it's His presence with you, right in the middle of it.",
    'faith',
    ['peace', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'He has already gone ahead of you into tomorrow. it is not unguarded. so rest tonight, sweet friend.',
    'faith',
    ['peace', 'faith'],
    ['night'],
  ],
  [
    'joy is allowed, even in the middle of revision. He made you for so much more than just survival.',
    'faith',
    ['joy', 'faith'],
    ['breeze', 'idle'],
  ],
  [
    'you can do the next right thing and gently leave the outcome with Him.',
    'faith',
    ['faith', 'focus'],
    ['idle'],
  ],
  [
    "He is faithful even on the days your feelings aren't. lean on the fact, not the feeling, tonight.",
    'faith',
    ['faith', 'hope'],
    ['rough', 'idle'],
  ],

  // ── Neuro-nerdy ──────────────────────────────────────────────────────────
  [
    "every time you recall instead of reread, you're actually growing a stronger mind. that's real, love. i'm proud.",
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'your mind quietly tucks everything into place while you sleep, so that nap really is part of the work. 😴',
    'neuro',
    ['neuro', 'rest'],
    ['break', 'night'],
  ],
  [
    'your brain loves a small win. finish one card, feel the little spark, and let it carry you to the next.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    "when you're tense, focus narrows. one slow breath opens it back up. try it with me, just one. 🌬️",
    'neuro',
    ['neuro', 'anxiety'],
    ['rough', 'idle'],
  ],
  [
    "you're not bad at this, sweetheart. you're just early on the climb. it gets more familiar, i promise.",
    'neuro',
    ['neuro', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "your mind runs on a lot of energy. a little water, a snack, then we'll carry on together. 🧃",
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'tiny reviews now save you whole exhausting nights later. little and gentle really does add up.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "the struggle to remember IS the learning, not a sign you've done anything wrong. you're right on track.",
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'rough'],
  ],
  [
    "your mind perks up at something new. fresh room, fresh pen, same brave girl. let's begin there. ✏️",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'mixing topics feels harder and works better. that little bit of confusion is just your mind growing.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'a slow exhale actually calms your whole body down. you can soften this feeling, chemically and gently. 🌬️',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    "sleep is when today's learning becomes permanent. protecting it isn't lazy, love, it's wise. go rest.",
    'neuro',
    ['neuro', 'rest'],
    ['night', 'break'],
  ],
  [
    "everyone's short-term memory is small, so we write things down. it's not a flaw in you. it never was.",
    'neuro',
    ['neuro', 'identity'],
    ['idle'],
  ],
  [
    'a short walk is like fertiliser for your mind, and it sharpens your recall too. go stretch your legs. 🚶',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'attention is a muscle, and it gets tired. resting it is exactly how you get more of it back. so rest.',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    "guessing before you check builds the memory that lasts. close the notes, and just try first. you've got it.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "your mind keeps what's spaced out and revisited. so gentle review will always beat a frantic cram.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "one lane of focus at a time, love. switching has a real cost, so let's just protect this one little lane.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'that foggy feeling is sometimes just thirst. have a sip of water, and see if the page clears a little. 💧',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    "your mind keeps learning even during breaks. stepping away isn't slacking, it's part of the whole loop.",
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'a tiny treat after a card actually fuels the next one. be sweet to yourself between the small steps.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'you remember beginnings and endings best, so short sessions are full of good, sticky moments. keep them short.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'naming a feeling quiets it. even softly saying "i feel anxious" turns the volume right down. try it.',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    "forgetting is steep, but every review flattens the curve. you're gently bending it in your favour right now.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "your mind is still finishing its wiring into your mid-twenties. be patient with yourself, love. it's coming. 🧠",
    'neuro',
    ['neuro', 'identity'],
    ['idle', 'rough'],
  ],
  [
    'getting it wrong lights up the learning part of your mind. a mistake now is just you calibrating. it is okay.',
    'neuro',
    ['neuro', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'curiosity opens your mind right up, so let yourself find just one little thing interesting. start there.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'five minutes in daylight resets your focus and your mood at once. go find a little sun, love. ☀️',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    "your mind can't really multitask, only switch and pay a toll. do one thing, and keep the change. gently.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'deep breaths move you out of panic and into calm, and your memory lives in the calm. so breathe first.',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    "every repetition wraps your memories so recall comes faster. you're building something lasting, card by card. 🧵",
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'a little stress sharpens you; too much dulls you. breaks are how you stay on the kind side of that line.',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    "your mind is carrying a whole degree right now. so feed it, water it, rest it. it's earned the tenderness. 🧠",
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    "recall feels harder than just recognising, because it's working harder. that effort is the whole point, love.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "memory isn't a playback, it's a rebuild, and every time you recall, the trace gets a little stronger.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],

  // ── Cozy / Ghibli ─────────────────────────────────────────────────────────
  [
    "imagine this is a tiny study cottage, and the rain outside is on your side today. you're cosy in here. ☔",
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'break'],
  ],
  [
    "light the little lamp, pour the tea, and let's do this so gently, you and me. 🍵",
    'cozy',
    ['cozy', 'rest'],
    ['idle', 'break'],
  ],
  [
    'even the patient ones wait out the rain before the walk. your moment is coming, love. just rest for now. 🌳',
    'cozy',
    ['cozy', 'hope'],
    ['idle', 'rough'],
  ],
  [
    "you're not behind, just on the slow scenic route. try to enjoy the page you're on right now.",
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'picture soft rain on the window and a warm desk lamp. you are safe to think in here, love.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'steam off the mug, the page open, the world gone quiet. just you and one small thing. 🍵',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'let the afternoon be slow. learning settles best into an unhurried, gentle heart. no rush at all. 🌧️',
    'cozy',
    ['cozy', 'rest'],
    ['break', 'idle'],
  ],
  [
    'wrap up in the soft blanket of "good enough for now" and keep gently turning the pages.',
    'cozy',
    ['cozy', 'identity'],
    ['idle'],
  ],
  [
    'somewhere a little kettle is singing just for you. take the break, love, then come back to me. 🫖',
    'cozy',
    ['cozy', 'rest'],
    ['break'],
  ],
  [
    "the lamp is warm, the rain is steady, and you are exactly where you're meant to be tonight.",
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'rest under the tree before the long walk. even the smallest forest things know to do that. 🌲',
    'cozy',
    ['cozy', 'rest'],
    ['break'],
  ],
  [
    "cosy season, gentle pace. you're allowed to study like it's a quiet little ritual, just for you.",
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'imagine the café is empty, the music is soft, and the deadline is far away. now breathe, love.',
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'a candle, a window, a page. the small, quiet things will hold you steady while you work. 🕯️',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    "the rain is doing its quiet work outside. you only have to do one small thing in here. that's all.",
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    "curl up with the hard chapter like it's an old story you're slowly learning to love. take your time.",
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'soft start, soft pace. no thunder needed today, love. just steady, gentle rain and the two of us.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'morning'],
  ],
  [
    "the kettle, the lamp, the quiet. your little sanctuary is open, and i'm so glad you're back. 🏡",
    'cozy',
    ['cozy', 'peace'],
    ['daily', 'idle'],
  ],
  [
    "let your shoulders drop an inch, love. the page will still be here, calmer, whenever you're ready.",
    'cozy',
    ['cozy', 'rest'],
    ['break', 'rough'],
  ],
  [
    'a gentle afternoon of small progress is a beautiful, valid kind of day. i hope you feel proud of it.',
    'cozy',
    ['cozy', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    'imagine the little soot sprites gathering up your worries into a jar while you focus. you can set them down.',
    'cozy',
    ['cozy', 'anxiety'],
    ['idle', 'rough'],
  ],
  [
    "the storm can stay outside. in here it's warm, and quiet, and yours, and you're safe with me. ☔",
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'rough'],
  ],
  [
    'put the kettle on, Emily. everything goes down a little easier with something warm in your hands. 🍵',
    'cozy',
    ['cozy', 'rest'],
    ['break'],
  ],
  [
    'slow is still moving, love. the scenic route still gets you there. try to enjoy the trees on the way. 🌳',
    'cozy',
    ['cozy', 'hope'],
    ['idle'],
  ],
  [
    "tuck today in gently now that it's ending. you carried it well, sweetheart. rest. 🌙",
    'cozy',
    ['cozy', 'rest'],
    ['night'],
  ],

  // ── Anxiety & peace (comfort voice) ───────────────────────────────────────
  [
    "name three things you can see right now, Emily. you're here. you're okay. and you're held, by me, right now.",
    'cozy',
    ['anxiety', 'peace'],
    ['rough', 'idle'],
  ],
  [
    'the deadline feels like a wave, but the ground beneath it is steady. you will not be swept away, love.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "peace isn't the exam going away. it's a steadiness you can feel right in the middle of it. breathe into that.",
    'cozy',
    ['peace', 'anxiety'],
    ['rough', 'idle'],
  ],
  [
    'feet on the floor, breath in your chest. you can get through this moment. you always have, every time.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "the fear is loud, but it isn't the one in charge. you can be scared and still take one small step, love.",
    'cozy',
    ['anxiety', 'strength'],
    ['rough'],
  ],
  [
    "put the spiralling thought into the brain dump. it's safe there, i promise. now come back to me, to now.",
    'cozy',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    "you don't have to solve the whole worry, sweetheart. just the next five minutes. only those. i'm here for them.",
    'cozy',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    "your worry predicts a hundred disasters, and almost none of them ever come. you're allowed to not believe it.",
    'cozy',
    ['anxiety', 'hope'],
    ['rough'],
  ],
  [
    "slow your breath, and your body will follow. you're not in danger, love. you're just under a lot of pressure.",
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "this panic will rise and fall like every wave before it. you don't have to fight it. just ride it out with me.",
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "it's okay to feel far too much and still be completely okay underneath. both of those are true at once.",
    'cozy',
    ['anxiety', 'identity'],
    ['rough'],
  ],
  [
    'unclench your jaw, drop your shoulders, soften your hands. let your body lead you gently into the calm.',
    'cozy',
    ['anxiety', 'rest'],
    ['rough', 'break'],
  ],
  [
    "you have felt this overwhelmed before, and it passed. it will pass this time too, love. i'll stay till it does.",
    'cozy',
    ['anxiety', 'hope'],
    ['rough'],
  ],
  [
    'breathe like you have all the time in the world. the urgency is just a feeling, not the truth of things.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "quiet the worst-case story for just one breath. what's actually, truly real in this exact moment? start there.",
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],

  // ── Strength & perseverance ───────────────────────────────────────────────
  [
    "you're allowed to be tired and to keep going. both can be true at once, brave girl. i see both in you.",
    'playful',
    ['strength', 'rest'],
    ['rough', 'idle'],
  ],
  [
    "one more page, one more breath, one more small yes. that's honestly how the mountains move, love.",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "you've done hard things before and you're still here. that's the proof, and it's louder than the fear.",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    'the days you study tired are the ones building your real strength. this one counts double, sweetheart.',
    'playful',
    ['strength'],
    ['rough', 'complete'],
  ],
  [
    "resting and giving up aren't the same thing. rest, and then rise. please don't confuse the two, love.",
    'playful',
    ['strength', 'rest'],
    ['break', 'rough'],
  ],
  [
    "you're not failing. you're in the messy middle, where it always feels exactly like this. keep going, gently.",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "courage is just doing the scary thing a little bit anyway, and look, you're right in the middle of it.",
    'playful',
    ['strength'],
    ['rough'],
  ],
  [
    "that wall you hit a while in is normal, love. lean through it gently. it's thinner than it looks, i promise.",
    'playful',
    ['strength', 'focus'],
    ['rough', 'idle'],
  ],
  [
    "choosing what you want most over what you want right now is hard, and you're doing it. i'm proud of you.",
    'playful',
    ['strength', 'focus'],
    ['idle'],
  ],
  [
    "you keep showing up for something hard. that isn't small at all. that's the person you're quietly becoming.",
    'playful',
    ['strength', 'identity'],
    ['idle', 'complete'],
  ],
  [
    "the finish line doesn't care how slowly you went, only that you kept going. so keep going, love, at your pace.",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "endurance is built in the boring middle, not the shiny start. and you're building it right now, quietly.",
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    "heavy days are part of strong stories. yours isn't over just because today feels like a lot. i promise it isn't.",
    'playful',
    ['strength', 'hope'],
    ['rough'],
  ],
  [
    "you don't have to feel strong to be brave. just do the next small, scary thing, and i'll be right here.",
    'playful',
    ['strength'],
    ['rough'],
  ],
  [
    "the comeback is quieter than the setback, but it's happening, love. one little card at a time. i can see it.",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],

  // ── Celebration ───────────────────────────────────────────────────────────
  [
    "you finished. look at you, love. i'm so proud of you, and i hope you can feel proud of yourself too. 🎉",
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    "that's one more quiet brick in the life you're building. well done, sweetheart. it counts. 🧱",
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    "you showed up. that's the whole win, truly. i'm so proud of you. 🌿",
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'another session, gently done. the you of tomorrow is quietly, deeply grateful for this one. 💛',
    'playful',
    ['celebration', 'hope'],
    ['complete'],
  ],
  [
    "that focus was real and it mattered. take the win, love. please don't talk yourself out of it. 🏅",
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'look at the little tree you just grew. small, alive, and yours. well done, Emily. 🌱',
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    "you turned a knot of worry into something real and finished. that's no small thing, love. 🎉",
    'playful',
    ['celebration', 'strength'],
    ['complete'],
  ],
  [
    "all done. let it feel good for a moment before you reach for the next thing. you've earned the pause.",
    'playful',
    ['celebration', 'rest'],
    ['complete', 'break'],
  ],
  [
    'this is exactly how the big things get done: one gentle, finished session at a time. so proud of you.',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'you just kept a little promise to yourself. those add up into a whole life you can trust. 💌',
    'playful',
    ['celebration', 'identity'],
    ['complete'],
  ],
  [
    "card done, mind fed, tree grown. you're really doing the thing, love. genuinely. i see you. 🌳",
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    "that wasn't nothing. that was real, focused, finished work. let yourself feel good about it, okay?",
    'playful',
    ['celebration'],
    ['complete'],
  ],

  // ── Rest / break ──────────────────────────────────────────────────────────
  [
    'step away, stretch, look out the window, love. your mind tucks things into place best when you pause.',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    "a gentle nudge to drink some water, Emily. yes, right now. i'm looking out for you. 💧",
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    "you're not a machine, thank goodness. take five, love. you've more than earned it.",
    'cozy',
    ['rest', 'faith'],
    ['break'],
  ],
  [
    "unclench, love. you've been concentrating so hard. let this break be actually, properly restful.",
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'look at something far away for twenty seconds. your eyes and your mind both need a little horizon.',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    "rest before you're empty, not after. you're allowed to stop while there's still some light left in you.",
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'stand up, roll your shoulders, shake it all out. then sit back down a little softer, love. 🧘',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'the break is part of the work, not a betrayal of it. take it gently, and without a scrap of guilt.',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    "go find a little daylight for a minute, love. come back with a clearer, kinder head. i'll be here. ☀️",
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    "you've been so focused, sweetheart. let your shoulders come down and just breathe for a little while.",
    'cozy',
    ['rest', 'peace'],
    ['break'],
  ],
  [
    'water, a snack, a stretch: the small, unglamorous things that keep you going. go be kind to your body. 🧃',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'close your eyes for thirty seconds. nothing at all is required of you in this exact little moment.',
    'cozy',
    ['rest', 'peace'],
    ['break'],
  ],

  // ── Morning / fresh start ─────────────────────────────────────────────────
  [
    "good morning, Emily. you don't have to do it all today, love. just begin, gently, and i'll be right here. 🌅",
    'cozy',
    ['hope', 'peace'],
    ['morning', 'daily'],
  ],
  [
    "fresh page, fresh mercy, fresh you. yesterday doesn't get a single vote in how today goes.",
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'ease into it, sweetheart. the first little task of the day is just to begin, not to finish anything.',
    'cozy',
    ['focus', 'hope'],
    ['morning', 'daily'],
  ],
  [
    'today is allowed to be a slow, kind, ordinary day of small progress. that is more than enough, love.',
    'cozy',
    ['peace', 'rest'],
    ['morning', 'daily'],
  ],
  [
    "whatever today holds, you don't face it alone or empty-handed. begin gently, and lean on me. 🌷",
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    "one soft morning thought: you get to learn things today. that's a quiet little gift, if you let it be. 📖",
    'cozy',
    ['joy', 'focus'],
    ['morning', 'daily'],
  ],

  // ── Night / winding down ──────────────────────────────────────────────────
  [
    'you did enough today, Emily. truly, you did. now let the rest be the rest, love. 🌙',
    'cozy',
    ['rest', 'peace'],
    ['night'],
  ],
  [
    'whatever stayed unfinished can wait for morning. sleep is part of tomorrow getting done, i promise.',
    'cozy',
    ['rest', 'neuro'],
    ['night'],
  ],
  [
    "put the day down now, love. you're not behind, you're just tired, and at night those feel like the same thing.",
    'cozy',
    ['rest', 'anxiety'],
    ['night'],
  ],
  [
    'your mind will quietly sort today while you sleep. closing the laptop really is the last study task. 😴',
    'neuro',
    ['rest', 'neuro'],
    ['night'],
  ],
  [
    "before you sleep, find one thing from today to be proud of. just one, love. it's there, i promise.",
    'cozy',
    ['celebration', 'rest'],
    ['night'],
  ],
  [
    "the lamp is off, the day is held, and you are safe. rest now, brave girl. i've got the watch. 🌙",
    'faith',
    ['rest', 'peace'],
    ['night'],
  ],

  // ── General / identity & hope (idle mix) ──────────────────────────────────
  [
    'you are so much more than what you produce, Emily. on your best day and your hardest one, equally.',
    'faith',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'catching a distraction and setting it down is a win, love, not a slip. that was you, paying attention. 🧠',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    'starting small still counts as starting. tiny is never the same as nothing. you began, and that matters.',
    'playful',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'progress almost never goes in a straight line. yours is allowed to wander and still get you there.',
    'cozy',
    ['hope', 'focus'],
    ['idle', 'rough'],
  ],
  [
    "be as patient with yourself as you'd be with a dear friend learning the very same hard thing.",
    'cozy',
    ['identity', 'peace'],
    ['idle'],
  ],
  [
    "you're doing better than the anxious voice claims. it always, always underestimates you, love.",
    'playful',
    ['anxiety', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'comparison is a thief and a liar. your pace is the right pace for your mind. truly, it is.',
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    "the goal was never to stop struggling. it's to stay gentle with yourself right through the struggle.",
    'cozy',
    ['identity', 'peace'],
    ['idle', 'rough'],
  ],
  [
    'you can rest your way through a hard season instead of grinding through it. you really, truly can.',
    'cozy',
    ['rest', 'identity'],
    ['break', 'idle'],
  ],
  [
    'one honest, focused minute is worth more than an hour of being hard on yourself. just start the minute.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "hope isn't naive, love. it's just refusing to let one hard day write the whole rest of the story.",
    'faith',
    ['hope'],
    ['rough', 'idle'],
  ],
  [
    "you're learning to be gentle and steady at the very same time. that's a rare and beautiful thing.",
    'cozy',
    ['identity', 'focus'],
    ['idle'],
  ],
  [
    'the you who finishes this degree starts with the next small thing. say a little hi to her for me.',
    'playful',
    ['hope', 'focus'],
    ['idle'],
  ],
  [
    'let "good enough to keep going" be the bar today, love. perfect can come visit some other time.',
    'playful',
    ['focus', 'identity'],
    ['idle', 'rough'],
  ],
  [
    "your effort is real even when the results haven't shown up yet. keep watering the little seed. 🌱",
    'cozy',
    ['hope', 'strength'],
    ['idle', 'rough'],
  ],
  [
    "you're allowed to take up space, take your time, and take gentle care of yourself today. all of it.",
    'cozy',
    ['identity', 'rest'],
    ['idle'],
  ],
  [
    "the brain dump is right there if your head feels full. empty it out, love, and then we'll focus. 🧠",
    'playful',
    ['anxiety', 'focus'],
    ['idle', 'rough'],
  ],
  [
    "you don't need to feel motivated to begin. the motivation usually wanders in after you've started.",
    'neuro',
    ['focus'],
    ['idle'],
  ],
  [
    "small and steady quietly beats big and rare. you're building the quiet kind, and it lasts. 🌿",
    'cozy',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    'if today is just keeping things ticking over, that still keeps the whole thing alive. well done, love.',
    'cozy',
    ['rest', 'celebration'],
    ['idle', 'complete'],
  ],
  [
    "a brighter day, Emily. ride the good mood into a couple of cards while it's here. no pressure though. ☀️",
    'playful',
    ['joy', 'focus'],
    ['breeze'],
  ],
  [
    "feeling good today? tuck a little extra kindness aside for future, tired you. she'll be grateful. 💛",
    'playful',
    ['joy', 'hope'],
    ['breeze'],
  ],
  [
    "on the lighter days, study gently and gratefully. you won't always feel this clear, so enjoy it. ✨",
    'cozy',
    ['joy', 'focus'],
    ['breeze'],
  ],
  [
    'so glad it feels easier today. let that be a gift, love, not a new bar to keep reaching for. 🌼',
    'cozy',
    ['joy', 'peace'],
    ['breeze'],
  ],
  [
    "good day energy. use a little, save a little, and please don't burn it all at once, sweetheart. 🌞",
    'playful',
    ['joy', 'rest'],
    ['breeze'],
  ],
  [
    "the hard chapter isn't a verdict on how clever you are. it's just a hard chapter. it will turn.",
    'playful',
    ['identity', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "you're allowed to do this imperfectly. imperfect and done still beats perfect and never. every time.",
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    "being kind to yourself isn't a reward for finishing. it's the fuel that lets you keep going. use it now.",
    'cozy',
    ['identity', 'rest'],
    ['idle', 'rough'],
  ],
  [
    "the panic about the future shrinks the moment you do one real thing in the present. let's do one, love.",
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    "you're not lazy, love. you have a mind that needs different scaffolding, and you're quietly building it.",
    'neuro',
    ['identity', 'neuro'],
    ['idle', 'rough'],
  ],

  // ── Batch 2 ───────────────────────────────────────────────────────────────
  // More of the same voice, spread across tones/themes/contexts.
  [
    "we're not climbing the whole mountain today, love. just this one little rock. let's pick it up together. 🪨",
    'playful',
    ['focus'],
    ['idle', 'rough'],
  ],
  [
    'your attention came back the second you noticed it had wandered. that noticing is the whole skill, love. 👏',
    'playful',
    ['focus', 'neuro'],
    ['idle'],
  ],
  [
    "you've got such a quick, lovely mind. open the notes, and let's gently remind you of that. 🤓",
    'playful',
    ['focus', 'joy'],
    ['idle', 'breeze'],
  ],
  [
    "you're not behind anyone, love. you're on your own timeline, and it's exactly the right one for you. 🌷",
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'the hard part is just starting, and starting anyway is the brave bit. you are doing the brave bit. 💛',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "a low battery is allowed, love. plug in for five, then we'll pick it back up. you're not a broken thing. 🔋",
    'playful',
    ['rest', 'identity'],
    ['break'],
  ],
  [
    'borrow a little confidence for just one flashcard. you can grow into it as you go. i believe it for you. ✨',
    'playful',
    ['focus', 'strength'],
    ['idle'],
  ],
  [
    'the group chat can wait, love. this one paragraph is the whole assignment right now. eyes here, with me. 👀',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "you are literally reshaping your own mind right now. that's quietly extraordinary, you know. ✨",
    'playful',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'tiny progress is still the little bar inching forward. it counts, love. keep gently going. 📈',
    'playful',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    "if it's a bit silly but it works, it isn't silly. study however your mind actually likes to study.",
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    "you're allowed to want the rest and the degree, both. wanting both doesn't make you any less, love.",
    'playful',
    ['rest', 'identity'],
    ['idle', 'break'],
  ],
  [
    "your anxiety isn't a fortune teller, love. it's a smoke alarm with trust issues. breathe. you're safe. 🚨",
    'playful',
    ['anxiety'],
    ['rough', 'idle'],
  ],
  [
    'one flashcard is a small, finishable thing. and you can absolutely finish one small thing right now.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "the bar's on the floor today, and that's okay. step over it and let it count as a win, love. 🌼",
    'playful',
    ['focus', 'celebration'],
    ['rough', 'idle'],
  ],
  [
    'you showing up at thirty percent is braver than someone breezing in at a hundred. that thirty matters. 🤍',
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    "your mind isn't broken, love. it just runs a different way. let's start it up gently. 💻",
    'neuro',
    ['identity', 'neuro'],
    ['idle', 'rough'],
  ],
  [
    'ten gentle, focused minutes you can feel good about beat an hour spent being hard on yourself. ⏱️',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "the cards don't know you're tired, love. they just want one honest little guess. give them one. 🃏",
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "Emily, you're not behind on life. you're young and you're trying hard, and that's right on time. 🌷",
    'playful',
    ['identity', 'hope'],
    ['idle', 'rough'],
  ],
  [
    'let the perfectionist take a little nap. the gentle, good-enough you is driving this session. 😴',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    "progress over perfection, snacks over stress, rest over numbers. that's the order, love. 🧃",
    'playful',
    ['rest', 'focus'],
    ['break', 'idle'],
  ],
  [
    "you don't owe anyone a perfect study day. you only owe yourself a kind, honest one. that's all.",
    'cozy',
    ['identity', 'peace'],
    ['idle'],
  ],
  [
    'the dread is always bigger than the task itself. open it, and watch the dread quietly deflate. 🎈',
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'you can be soft and still be serious about your dreams. your softness was never weakness, love. 🌸',
    'cozy',
    ['identity', 'strength'],
    ['idle'],
  ],

  [
    "He isn't surprised by your weakness today, love. He has loved tired people since the very beginning.",
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "lay this exam at His feet before you pick up the pen. He'll carry what you simply can't, sweetheart.",
    'faith',
    ['anxiety', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "the worth He gave you doesn't rise and fall with your performance. it's fixed. it's finished. it's yours.",
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "you're allowed to come to Him empty. that's exactly the cup He most loves to fill. so come as you are.",
    'faith',
    ['rest', 'faith'],
    ['rough', 'break'],
  ],
  [
    "He is so patient with your becoming. you don't have to arrive today to be fully loved today, love.",
    'faith',
    ['identity', 'faith'],
    ['idle', 'rough'],
  ],
  [
    "the future you're anxious about is a place He already lives. you won't arrive there alone. i promise.",
    'faith',
    ['anxiety', 'hope', 'faith'],
    ['rough', 'night'],
  ],
  [
    'small, faithful study offered with open hands is a kind of quiet prayer. He sees it, and He treasures it.',
    'faith',
    ['focus', 'faith'],
    ['idle', 'daily'],
  ],
  [
    "when you can't feel Him near, He is near anyway. your feelings are weather, love. He is the climate.",
    'faith',
    ['faith', 'peace'],
    ['rough', 'night'],
  ],
  [
    "rest tonight like someone deeply loved, because you are. the striving can pause now. you're safe.",
    'faith',
    ['rest', 'faith'],
    ['night'],
  ],
  [
    "He isn't measuring you against your classmates. He made each of you on purpose, you included, beautifully.",
    'faith',
    ['identity', 'faith'],
    ['idle', 'rough'],
  ],
  [
    "hand Him the panic one breath at a time. He has never once been overwhelmed by it, and He won't start now.",
    'faith',
    ['anxiety', 'faith'],
    ['rough'],
  ],
  [
    "you can trust the slow, quiet work He's doing in you, even on the days you can't see any progress at all.",
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "the grade is temporary, love, and you are not. don't let the small thing define the big one. you're held.",
    'faith',
    ['identity', 'faith'],
    ['rough', 'complete'],
  ],
  [
    'He loves to give wisdom to anyone who asks. so ask, and then open the book with a settled, peaceful heart.',
    'faith',
    ['focus', 'faith'],
    ['idle', 'daily'],
  ],
  [
    "your tiredness isn't something to repent of. it's a limit He built into you, on purpose. so please, rest.",
    'faith',
    ['rest', 'faith'],
    ['break', 'rough'],
  ],
  [
    'He is writing kindness even into the days that felt wasted. nothing is truly lost with Him, love. nothing.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you are kept, held, named, chosen. none of that was ever contingent on how this one semester goes.',
    'faith',
    ['identity', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'bring the half-done day to Him with no apology, love. He works so beautifully with unfinished things.',
    'faith',
    ['hope', 'faith'],
    ['rough', 'night'],
  ],
  [
    "His love isn't a reward you unlock. it's the ground you're already standing on. study from there, love.",
    'faith',
    ['identity', 'faith'],
    ['idle', 'daily'],
  ],
  [
    "fear knocks loudly; faith answers softly. you don't have to shout it down, sweetheart. just gently trust.",
    'faith',
    ['anxiety', 'faith'],
    ['rough'],
  ],
  [
    "the peace that doesn't quite make sense is exactly His specialty. ask Him for a little of it tonight.",
    'faith',
    ['peace', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'you can be both a serious scholar and a beloved child. He holds both of you at once, tenderly, always.',
    'faith',
    ['identity', 'focus'],
    ['idle'],
  ],
  [
    "He is for you, not against you, even on the days the whole world feels like it's against you both.",
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    'let the last thought before sleep be this: you are safe, you are held, and you are never alone. 🌙',
    'faith',
    ['rest', 'peace'],
    ['night'],
  ],
  [
    'the work matters, love, but you matter so much more, and to Him you always have. keep that order, please.',
    'faith',
    ['identity', 'faith'],
    ['idle'],
  ],

  [
    'recall fails, then works, then sticks. that frustrating little gap in the middle is literally the learning, love.',
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'rough'],
  ],
  [
    "your mind keeps what you revisit and gently lets go of the rest. so come back to it, and it'll stay. ✂️",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "a quick little test teaches you more than a long reread, every time. quiz yourself, gently. you'll see.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "feeling something about a topic makes it stick. find one small thing to care about, and it'll hold.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "your mind follows what interests it, not what's important. so turn the dull bit into a tiny game, love. 🎯",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "your focus comes in waves. ride it when it's high, and rest kindly when it dips. both are part of it.",
    'neuro',
    ['neuro', 'rest'],
    ['idle', 'break'],
  ],
  [
    "a dip in concentration is often just low fuel. that's not weakness, love, it's a little snack signal. 🍎",
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'writing it in your own words makes it sink in far deeper than copying ever could. try putting it your way.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'your mind loves small groups: three things together beat seven things scattered. gather them up, love.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'a little daylight early sets your focus for the whole day. go catch some, and let it be gentle. ☀️',
    'neuro',
    ['neuro', 'rest'],
    ['morning', 'break'],
  ],
  [
    "confusion isn't failure, love. it's your mind right at the edge of what it knows. lean into that edge softly.",
    'neuro',
    ['neuro', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "two short reviews spaced out beat one long cram by a mile. you're doing the kind, smart thing already.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    "the more you reach for a fact, the quicker the path to it becomes. you're quietly paving little roads. 🛣️",
    'neuro',
    ['neuro', 'focus'],
    ['idle', 'complete'],
  ],
  [
    "tiredness is information, not a verdict. it's asking you to rest the system, not telling you it's broken.",
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'a short twenty-minute nap can genuinely lock in what you just learned. so rest, love. permission granted. 😴',
    'neuro',
    ['neuro', 'rest'],
    ['break'],
  ],
  [
    'a quieter room and fewer open tabs make remembering measurably easier. clear a little space for yourself.',
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'your mind stays able to learn your whole life. "too late to learn this" simply isn\'t true, love. 🧠',
    'neuro',
    ['neuro', 'hope'],
    ['idle', 'rough'],
  ],
  [
    'stress quietly blocks memory from forming, so calming down first really is the smarter way to study. breathe.',
    'neuro',
    ['neuro', 'anxiety'],
    ['rough'],
  ],
  [
    "you remember more when you predict the answer first, even if you're wrong. so have a guess before you peek.",
    'neuro',
    ['neuro', 'focus'],
    ['idle'],
  ],
  [
    'a little movement before studying floods your mind with focus. go wiggle and stretch for a minute, love. 🤸',
    'neuro',
    ['neuro', 'focus'],
    ['break', 'idle'],
  ],

  [
    "the rain is just soft background music for a mind doing brave, quiet work. you're doing so well, love. 🌧️",
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'imagine a soft blanket, a warm drink, and exactly one gentle task. that is more than enough, love. 🍵',
    'cozy',
    ['cozy', 'rest'],
    ['break', 'idle'],
  ],
  [
    'the little café in your mind is open late, and the corner seat is yours. settle in, sweetheart. ☕',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    "let the lamp glow and the page wait kindly. there's no rush at all in this little room, love. just us.",
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'a slow, rainy study afternoon is a gift, not a delay. sip it like tea and let yourself be cosy. 🌧️',
    'cozy',
    ['cozy', 'rest'],
    ['idle', 'break'],
  ],
  [
    'picture the little soot sprites stacking your finished thoughts into neat piles. a tidy, calm mind. ✨',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    'curl into the comfy chair of "i am allowed to go slowly" and turn just one gentle page. 🪑',
    'cozy',
    ['cozy', 'rest'],
    ['idle'],
  ],
  [
    'the wind outside, the warmth inside, the quiet in between. your sanctuary is holding you. breathe, love.',
    'cozy',
    ['cozy', 'peace'],
    ['idle', 'night'],
  ],
  [
    'light the little candle of one small intention, and let that be the only flame you tend tonight. 🕯️',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],
  [
    "a gentle pace isn't falling behind, love. the soft forest path still reaches the very same clearing. 🌲",
    'cozy',
    ['cozy', 'hope'],
    ['idle'],
  ],
  [
    'steam, lamplight, soft rain, one open book. you have everything you need right here, love. truly. 🍵',
    'cozy',
    ['cozy', 'peace'],
    ['idle'],
  ],
  [
    'let today be a quiet, ordinary, lovely little study day. those gentle ones are what quietly add up.',
    'cozy',
    ['cozy', 'focus'],
    ['idle'],
  ],

  [
    "the wave of overwhelm always looks taller from down inside it, love. you're bigger than it. breathe with me.",
    'cozy',
    ['anxiety', 'strength'],
    ['rough'],
  ],
  [
    'put one hand on your chest and feel it rise. see? still here. still okay. still held, right now, by me.',
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "you don't have to believe the worst-case story your mind is telling. you can decline it, gently and firmly.",
    'cozy',
    ['anxiety', 'hope'],
    ['rough'],
  ],
  [
    "the to-do list isn't a measure of your worth, love. it's just a list. you are a whole, precious person.",
    'cozy',
    ['anxiety', 'identity'],
    ['rough', 'idle'],
  ],
  [
    "let the next breath be a little slower than the last. that's the whole instruction right now, sweetheart.",
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],
  [
    "fear gets smaller in the light of one concrete next step. what's the tiniest one, love? let's just do that.",
    'cozy',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    "you are safe in this moment, even if your body has forgotten. tell it gently, with me: we're okay. we're okay.",
    'cozy',
    ['anxiety', 'peace'],
    ['rough'],
  ],

  [
    "you're tired because you're trying, love, not because you're failing. those two are complete opposites.",
    'playful',
    ['strength', 'identity'],
    ['rough', 'idle'],
  ],
  [
    "the middle of every hard thing feels exactly like this. it's not a sign to quit, sweetheart, just to rest.",
    'playful',
    ['strength', 'rest'],
    ['rough', 'break'],
  ],
  [
    "keep that little promise to yourself just a bit longer. one more small yes. you're so much closer than you feel.",
    'playful',
    ['strength', 'focus'],
    ['rough', 'idle'],
  ],
  [
    "real strength isn't gritted teeth. it's gently refusing to give up on yourself. so keep going, gently, love.",
    'playful',
    ['strength'],
    ['rough', 'idle'],
  ],
  [
    "you have outlasted every single hard week so far. your record is spotless, Emily. i wouldn't bet against you.",
    'playful',
    ['strength', 'hope'],
    ['rough', 'idle'],
  ],
  [
    "this hard part is temporary, but the strength you're building from it isn't. keep it. it's yours now. 💪",
    'playful',
    ['strength'],
    ['rough', 'complete'],
  ],
  [
    "you can do the next ten minutes. you don't have to do the whole degree right now, love. just the ten. with me.",
    'playful',
    ['strength', 'focus'],
    ['rough', 'idle'],
  ],

  [
    "that's done, and it's good. let yourself feel the small, bright spark of finishing it, love. you earned it. ✨",
    'playful',
    ['celebration', 'joy'],
    ['complete'],
  ],
  [
    "another session done. you're quietly becoming someone who finishes what she starts, and i'm so proud. 🌟",
    'playful',
    ['celebration', 'identity'],
    ['complete'],
  ],
  [
    "you gave your mind real, honest focus just now. that's self-respect in action, love. i'm proud of you. 💛",
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    'the little tree grew because you stayed. small, steady, alive, just like you and your progress. 🌱',
    'playful',
    ['celebration', 'hope'],
    ['complete'],
  ],
  [
    'take the win without a single "but," love. you focused, you finished, and that\'s the whole truth. well done. 🎉',
    'playful',
    ['celebration'],
    ['complete'],
  ],
  [
    "that effort was real whether or not it felt productive. honour it, love. you showed up, and that's huge. 🙌",
    'playful',
    ['celebration', 'strength'],
    ['complete'],
  ],
  [
    'look how the small sessions are quietly stacking into something real. brick by gentle brick, Emily. 🧱',
    'playful',
    ['celebration', 'hope'],
    ['complete'],
  ],

  [
    'step away from the desk before your mind has to beg you to. choosing rest early is a quiet superpower, love. 🦸',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    "drink the water, eat the snack, look up at the sky. looking after yourself isn't optional, it's wise. 🌤️",
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    'the work will keep, love. your wellbeing might not. take the break like it matters, because it truly does.',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    "stretch tall, breathe deep, and let the focus drain out for a minute. you'll fill it back up, i promise. 🧘",
    'cozy',
    ['rest', 'peace'],
    ['break'],
  ],
  [
    'a real break means actually resting, not being hard on yourself. close the laptop and let go, love. 🌿',
    'cozy',
    ['rest'],
    ['break'],
  ],
  [
    'you concentrated so hard. now let your mind wander on purpose for five minutes. it genuinely helps, love.',
    'cozy',
    ['rest', 'neuro'],
    ['break'],
  ],
  [
    "rest is productive. it's when everything you learned quietly files itself away. so enjoy the pause. 📂",
    'neuro',
    ['rest', 'neuro'],
    ['break'],
  ],

  [
    "good morning, brave girl. just open one little thing. that's the whole ask for now, i promise. 🌅",
    'cozy',
    ['hope', 'focus'],
    ['morning', 'daily'],
  ],
  [
    "the day is new, and so is its kindness. yesterday doesn't get to set the tone for today, love.",
    'faith',
    ['hope', 'faith'],
    ['morning', 'daily'],
  ],
  [
    'start soft, love. a slow, kind beginning still counts completely as beginning. just ease in, Emily. 🌷',
    'cozy',
    ['peace', 'hope'],
    ['morning', 'daily'],
  ],
  [
    "you don't have to earn this morning. you just get to show up to it, gently, exactly as you are. ☀️",
    'cozy',
    ['identity', 'peace'],
    ['morning', 'daily'],
  ],

  [
    'you carried today as well as you possibly could, and that is genuinely enough, love. rest now. 🌙',
    'cozy',
    ['rest', 'peace'],
    ['night'],
  ],
  [
    'close the books, love. the unfinished bits will still be there, calmer and smaller, in the morning.',
    'cozy',
    ['rest', 'anxiety'],
    ['night'],
  ],
  [
    "let sleep do its quiet filing work now. you've studied; let your tired mind tuck it all away. 😴",
    'neuro',
    ['rest', 'neuro'],
    ['night'],
  ],
  [
    'name one good thing about today, then let the rest go soft. you did okay, love. you really did. 🌟',
    'cozy',
    ['celebration', 'rest'],
    ['night'],
  ],

  [
    'you\'re allowed to define a good day as "i was kind to myself, and i tried." that counts, love. fully.',
    'cozy',
    ['identity', 'celebration'],
    ['idle'],
  ],
  [
    'the messy first attempt is the price of every good final draft. pay it gladly, love, and without shame.',
    'playful',
    ['focus', 'identity'],
    ['idle'],
  ],
  [
    "your pace isn't a problem to fix, love. it's just yours. let's work with it, gently, not against it. 🌿",
    'cozy',
    ['identity', 'peace'],
    ['idle'],
  ],
  [
    'one honest, focused minute is a little doorway. step through it, and the next minute quietly opens too.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "you don't have to feel fearless to keep going. scared and trying anyway is more than plenty, love.",
    'faith',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'the anxious voice exaggerates everything. the kind voice tells you the truth. listen to the kind one, love.',
    'cozy',
    ['anxiety', 'identity'],
    ['rough', 'idle'],
  ],
  [
    'begin before you feel ready. readiness is usually just a few gentle minutes of starting in disguise.',
    'playful',
    ['focus'],
    ['idle'],
  ],
  [
    "hard doesn't mean wrong, love. it just means hard. and you're allowed to do hard things slowly.",
    'cozy',
    ['strength', 'identity'],
    ['rough', 'idle'],
  ],
  [
    "you're building a whole future out of small, ordinary minutes like this one. lovely work, Emily. 🧱",
    'playful',
    ['hope', 'focus'],
    ['idle', 'complete'],
  ],
  [
    'let "i showed up" be a complete sentence today, love. you don\'t have to justify a single bit of the rest.',
    'cozy',
    ['identity', 'celebration'],
    ['idle', 'rough'],
  ],
  [
    "the seed never rushes the soil. so trust your slow, real, underground progress, love. it's happening. 🌱",
    'cozy',
    ['hope', 'identity'],
    ['idle', 'rough'],
  ],
  [
    'you can set the heavy feeling in the brain dump and pick the page back up. both of those are allowed, love.',
    'playful',
    ['anxiety', 'focus'],
    ['rough', 'idle'],
  ],
  [
    'feeling clear today? lovely. do a gentle bit, and quietly thank your mind for the easy hour. ✨',
    'playful',
    ['joy', 'focus'],
    ['breeze'],
  ],
  [
    'light-hearted day, light-handed study. just enjoy that it feels possible right now, love. 🌞',
    'cozy',
    ['joy', 'peace'],
    ['breeze'],
  ],
  [
    'ride the good mood into one small win, then let yourself simply enjoy feeling okay for a while. 🌼',
    'playful',
    ['joy', 'celebration'],
    ['breeze'],
  ],
  [
    "you are not the sum of your unfinished tasks, love. you're a whole, deeply loved, trying person.",
    'faith',
    ['identity'],
    ['rough', 'idle'],
  ],
  [
    "the comparison game has no winners, only tired players. set the controller down, love. you're doing fine. 🎮",
    'playful',
    ['identity'],
    ['idle', 'rough'],
  ],
  [
    'small, repeated, gentle effort is how every big thing has ever truly been built. yours included.',
    'cozy',
    ['focus', 'hope'],
    ['idle'],
  ],
  [
    "you don't need to see the whole staircase, love. just trust enough to take the one first step. 🪜",
    'faith',
    ['hope', 'faith'],
    ['rough', 'idle'],
  ],
  [
    "rest isn't a reward you earn at the end of being worthy. it's a need, and you're allowed to meet it now.",
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
  'all my love, your soot friend',
  'here in the rain with you, always ☔',
  'rooting for you with my whole heart',
  'yours, over a little cup of tea 🍵',
  'from me to you, with so much love',
  'always in your corner, always 🤍',
  'softly, and forever on your side',
  'so proud of you, truly, today and always',
  'keeping the lamp on for you 🕯️',
  'see you after the next little session 🌱',
]

export function randomSignoff() {
  return SIGNOFFS[Math.floor(Math.random() * SIGNOFFS.length)]
}
