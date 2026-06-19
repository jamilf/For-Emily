import { Component } from 'react'

/**
 * Top-level error boundary with a gentle, in-theme fallback. A render error in
 * any feature shows a calm "take a breath" card with a reload, instead of a
 * blank white screen — and crucially never touches Emily's saved data, which
 * lives untouched in localStorage.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Surface in the console for debugging; no remote logging by design.
    console.error('Sanctuary caught an error:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bgDim/80 p-4">
        <div
          role="alert"
          className="paper-grain w-full max-w-sm rounded-2xl border-2 border-brownDark/40 bg-cream p-7 text-center text-brownDark shadow-window"
        >
          <p className="font-display text-2xl text-brown">Let&apos;s take a breath 🍃</p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-brown/80">
            Something hiccupped, but your progress is safe on this device. A quick refresh should set things
            right.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-6 rounded-2xl bg-brown px-5 py-2.5 font-display text-cream transition-colors hover:bg-brownDark active:scale-95"
          >
            Refresh the sanctuary
          </button>
        </div>
      </div>
    )
  }
}
