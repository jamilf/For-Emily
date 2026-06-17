// Flashcard model + simple Leitner-style spaced repetition.
// A card: { id, deck, front, back, box, due }  (due = timestamp in ms)

const DAY = 24 * 60 * 60 * 1000
// Spacing per Leitner box; "Got it" promotes a box, "Review again" resets to 0.
export const SPACING_DAYS = [0, 1, 3, 7, 14]

export function nextDue(box) {
  const days = SPACING_DAYS[Math.min(box, SPACING_DAYS.length - 1)]
  return Date.now() + days * DAY
}

export function isDue(card) {
  return (card.due ?? 0) <= Date.now()
}

export function countDue(cards) {
  return cards.filter(isDue).length
}

export function makeCard(front, back, deck) {
  return {
    id: Date.now() + Math.random(),
    deck: deck?.trim() || 'My deck',
    front: front.trim(),
    back: back.trim(),
    box: 0,
    due: Date.now(), // due immediately on creation
  }
}

// A tiny starter deck so the feature isn't empty on first open (clearable).
export const SEED_CARDS = [
  makeCard('What does the hippocampus do?', 'Forms new memories & spatial navigation', 'Neuroscience'),
  makeCard('Role of dopamine?', 'Reward, motivation, and movement signalling', 'Neuroscience'),
  makeCard('What is qualia?', 'The subjective, felt quality of experience', 'Philosophy'),
]
