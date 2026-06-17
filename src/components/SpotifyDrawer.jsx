import Drawer from './Drawer.jsx'

/**
 * Feature 6 (part) — Spotify embed. Stays mounted while collapsed so playback
 * continues; Zen Mode fades it without unmounting.
 */
export default function SpotifyDrawer({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose} title="🎵 Zen Music" className="zen-hide">
      <p className="mb-2 text-xs text-brown/60">A calm lo-fi playlist to settle into.</p>
      <iframe
        title="Spotify lo-fi playlist"
        src="https://open.spotify.com/embed/playlist/37i9dQZF1DX7cBprxbt1Fn?utm_source=generator&theme=0"
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: '12px' }}
      />
    </Drawer>
  )
}
