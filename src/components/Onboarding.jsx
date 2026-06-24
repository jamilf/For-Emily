import { useState } from 'react'
import useFocusTrap from '../hooks/useFocusTrap.js'
import DialogueBox from '../ui/jrpg/DialogueBox.jsx'
import CommandButton from '../ui/jrpg/CommandButton.jsx'

/**
 * A gentle, skippable, companion-led first-run intro. The soot sprite says hello,
 * explains the sanctuary in a few beats, helps set a daily goal, optionally takes a
 * name, then gets out of the way. Built on the JRPG DialogueBox (portrait + skippable
 * typewriter, full text in the DOM for screen readers). Focus-trapped, Esc skips,
 * every control is keyboard + tap reachable, and nothing here is required.
 *
 * @param {{ onDone: () => void, onSetName: (raw: string) => void,
 *   onSetGoal: (min: number) => void }} props
 */
const GOALS = [
  { min: 30, label: 'Something gentle', hint: 'about 30 min' },
  { min: 60, label: 'A solid day', hint: 'about 60 min' },
  { min: 100, label: 'A bigger day', hint: 'about 100 min' },
]

export default function Onboarding({ onDone, onSetName, onSetGoal }) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState('')
  const [savedName, setSavedName] = useState(null)

  const trapRef = useFocusTrap(true, { onEscape: () => finish() })

  function finish() {
    onDone()
  }
  function next() {
    setStep((s) => s + 1)
  }
  function chooseGoal(min) {
    onSetGoal(min)
    next()
  }
  function saveName(e) {
    e?.preventDefault()
    const v = draft.trim()
    if (v) {
      onSetName(v)
      setSavedName(v)
    }
    next()
  }

  const who = savedName || 'soot sprite'
  const lines = [
    'Oh, hello. I am the little soot sprite who looks after this grove. I am so glad you came.',
    'This is your study sanctuary. You focus for a while, and a small grove grows beside you. There is no pace to keep up with here, and a quiet day is never a failure.',
    'Shall we set a gentle daily goal? It is only ever a soft target, and you can change it whenever you like.',
    'One more thing, if you would like it. You can give me a name.',
    `${savedName ? `${savedName} it is. ` : ''}Start a session whenever you feel ready. I will be right here.`,
  ]

  return (
    <div className="animate-fade-in modal-overlay-pad fixed inset-0 z-[55] flex items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 bg-bgDim/80 sm:backdrop-blur-sm" />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome"
        tabIndex={-1}
        className="animate-modal-in relative z-10 w-full max-w-sm"
      >
        <DialogueBox name={who} text={lines[step]} onAdvance={step === 0 || step === 1 ? next : undefined}>
          {step === 2 && (
            <div className="space-y-2">
              <div className="flex flex-col gap-1.5" role="group" aria-label="Daily goal">
                {GOALS.map((g) => (
                  <button
                    key={g.min}
                    type="button"
                    onClick={() => chooseGoal(g.min)}
                    className="flex items-center justify-between rounded-md border-2 border-jrpg-edge bg-cream/95 px-3 py-2 text-left font-display text-sm text-brownDark transition-colors hover:bg-cream focus-visible:ring-2 focus-visible:ring-ever-yellow"
                  >
                    <span>{g.label}</span>
                    <span className="text-xs text-brown/60">{g.hint}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                className="text-xs text-jrpg-text/70 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
              >
                Decide later
              </button>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={saveName} className="space-y-2">
              <label htmlFor="onboard-name" className="sr-only">
                A name for the sprite
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="onboard-name"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={24}
                  placeholder="what should you call me?"
                  className="min-w-0 flex-1 rounded-md border-2 border-jrpg-edge bg-cream/95 px-2.5 py-1.5 text-sm text-brownDark placeholder:text-brown/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ever-yellow"
                />
                <CommandButton type="submit" className="shrink-0">
                  {draft.trim() ? 'Save' : 'Skip'}
                </CommandButton>
              </div>
            </form>
          )}

          {step === 4 && (
            <CommandButton onClick={finish} className="w-full justify-center">
              Let us begin
            </CommandButton>
          )}
        </DialogueBox>

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={finish}
            className="font-display text-xs text-cream/80 underline-offset-2 transition-colors hover:text-cream hover:underline focus-visible:ring-2 focus-visible:ring-ever-yellow"
          >
            Skip intro
          </button>
        </div>
      </div>
    </div>
  )
}
