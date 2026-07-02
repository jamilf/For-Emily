// The soot companion's one spoken line for the talk panel. Pure and injected (no
// I/O, no clock reads), so it is deterministic and unit-testable. It notices Emily's
// real state, in a warm, never-shaming way: a waiting letter and due cards come
// first, then it acknowledges a streak / this week's momentum / how her last session
// felt, and otherwise offers a calm, part-of-day idle line. All copy is em-dash-free.

const GREETING = {
  dawn: 'The grove is just waking up',
  day: 'It is a good, bright hour',
  dusk: 'The light is going soft and gold',
  night: 'It is late, and the grove is hushed',
}

// The most meaningful thing the companion can notice about how things are going,
// in priority order. Falls back to a gentle greeting for the time of day.
function noticingLine({ who, partOfDay, streak, weekTrend, lastMood }) {
  if (streak >= 3) return `That is ${streak} days in a row now${who}. I am a little proud of you.`
  if (weekTrend === 'up') return 'This week has more little trees than last. Lovely to see.'
  if (lastMood === 'rain') return 'Last time felt heavy. I am glad you came back anyway.'
  if (weekTrend === 'down') return 'A gentler week than last. Resting is part of the rhythm too.'
  if (lastMood === 'sun') return 'Last time felt bright. I hope today carries a little of that.'
  return `${GREETING[partOfDay] || GREETING.day}${who}.`
}

// True when there is something worth gently noticing (so the companion does not just
// say a generic idle line when her week actually has shape).
function hasNotableState({ streak, weekTrend, lastMood }) {
  return (
    streak >= 3 || weekTrend === 'up' || weekTrend === 'down' || lastMood === 'rain' || lastMood === 'sun'
  )
}

/**
 * @param {object} ctx
 * @param {string|null} [ctx.companionName]
 * @param {number} [ctx.dueCount]
 * @param {boolean} [ctx.hasMail]
 * @param {boolean} [ctx.running]
 * @param {'dawn'|'day'|'dusk'|'night'} [ctx.partOfDay]
 * @param {number} [ctx.streak]
 * @param {'first'|'up'|'steady'|'down'} [ctx.weekTrend]
 * @param {'rain'|'cloud'|'sun'|null} [ctx.lastMood]
 * @param {number} [ctx.seed]  varies the idle line without churn (caller-supplied)
 * @param {boolean} [ctx.welcomeBack]  she just resumed after a wither pause
 * @returns {string}
 */
export function companionLine({
  companionName = null,
  dueCount = 0,
  hasMail = false,
  running = false,
  partOfDay = 'day',
  streak = 0,
  weekTrend = 'first',
  lastMood = null,
  seed = 0,
  welcomeBack = false,
} = {}) {
  const who = companionName ? `, ${companionName}` : ''

  // Resuming after stepping away is the freshest moment: acknowledge it warmly,
  // above everything else, and never mention how long she was gone.
  if (welcomeBack) {
    const lines = [
      `Oh, there you are${who}. Good to see you.`,
      `Welcome back${who}. Whenever you are ready, we can pick up right here.`,
      `You are here${who}. The tree is still growing, right where you left it.`,
    ]
    return lines[Math.abs(seed) % lines.length]
  }

  // A waiting letter is the most important thing to mention.
  if (hasMail) return 'Oh, before you go. I left a little letter for you, for whenever you have a moment.'

  // Mid focus run: stay calm and out of the way.
  if (running) return 'You are in the middle of something. I will keep the grove quiet for you.'

  // Cards waiting, offered gently.
  if (dueCount > 0) {
    return `There are ${dueCount} card${dueCount === 1 ? '' : 's'} waiting whenever you feel like it. No rush at all.`
  }

  // Notice how her week is going, when there is something to notice.
  if (hasNotableState({ streak, weekTrend, lastMood })) {
    return noticingLine({ who, partOfDay, streak, weekTrend, lastMood })
  }

  // Otherwise a calm idle line, varied by the caller's seed so it does not churn.
  const idle = [
    `${GREETING[partOfDay] || GREETING.day}${who}.`,
    `Take your time here. I am happy just to keep you company${who}.`,
    'Whenever you are ready, we can begin. And if not, that is alright too.',
    'The grove is quiet and the kettle is warm. What feels good right now?',
  ]
  return idle[Math.abs(seed) % idle.length]
}
