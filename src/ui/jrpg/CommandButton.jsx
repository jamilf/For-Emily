import useUiSound from '../../hooks/useUiSound.js'

/**
 * CommandButton — a beveled pixel command button with clear hover / focus / press
 * states. A drop-in over the app's existing button styling; plays an optional
 * confirm/cancel blip (no-op unless audio is on and UI sounds are enabled). Sound
 * is never the only signal: the visual press + focus ring always convey the action.
 */
const TONES = {
  primary: 'bg-brown text-cream hover:bg-brownDark',
  ghost: 'bg-cream text-brown hover:bg-paper',
  dark: 'bg-jrpg-window text-jrpg-text hover:brightness-110',
  danger: 'bg-ever-red/20 text-brownDark hover:bg-ever-red/30',
}

export default function CommandButton({
  children,
  onClick,
  variant = 'primary',
  sound = 'confirm',
  type = 'button',
  className = '',
  ...rest
}) {
  const play = useUiSound()
  function handleClick(e) {
    play(sound)
    onClick?.(e)
  }
  return (
    <button
      type={type}
      onClick={handleClick}
      className={`pixel-bevel inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-display text-sm transition-[filter,transform] active:translate-y-px disabled:opacity-50 ${TONES[variant] || TONES.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
