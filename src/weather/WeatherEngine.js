// WeatherEngine — a tiny, framework-agnostic canvas weather system driven by the
// ambient mixer's sliders. Built for long study sessions: one requestAnimationFrame
// loop, an object-pooled raindrop array (no per-frame allocations), and it pauses
// when the tab is hidden or there's nothing to draw.
//
// Elements are registered in a list so new ones (Snow, Fog, Stars, Leaves) can be
// added later without touching the loop. Each element implements
// update(dt, state) and draw(ctx, state).

const MAX_DROPS = 260

class Rain {
  constructor() {
    // Pre-allocate the whole pool once; activate a slice based on density.
    this.pool = Array.from({ length: MAX_DROPS }, () => ({
      x: 0,
      y: 0,
      len: 0,
      speed: 0,
      active: false,
    }))
  }

  _spawn(drop, w, h) {
    drop.x = Math.random() * w
    drop.y = Math.random() * -h
    drop.len = 8 + Math.random() * 14
    drop.speed = 1
    drop.active = true
  }

  update(dt, s) {
    const target = Math.floor(s.rain * MAX_DROPS)
    let live = 0
    const fallSpeed = (260 + s.rain * 520) * dt // px/sec scaled by intensity
    for (let i = 0; i < this.pool.length; i++) {
      const d = this.pool[i]
      if (i < target) {
        if (!d.active) this._spawn(d, s.w, s.h)
        d.y += fallSpeed * (0.7 + d.len / 22)
        if (d.y > s.h) this._spawn(d, s.w, s.h), (d.y = -d.len)
        live++
      } else {
        d.active = false
      }
    }
    this.live = live
  }

  draw(ctx, s) {
    if (s.rain <= 0) return
    ctx.strokeStyle = `rgba(200, 214, 230, ${0.08 + s.rain * 0.32})`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < this.pool.length; i++) {
      const d = this.pool[i]
      if (!d.active) continue
      ctx.moveTo(d.x, d.y)
      ctx.lineTo(d.x + 1.5, d.y + d.len) // slight diagonal
    }
    ctx.stroke()
  }
}

// Thunder drives the DOM flash element (capped, randomized, never strobing).
class Thunder {
  constructor(flashEl) {
    this.flashEl = flashEl
    this.next = 0
    this.flashUntil = 0
    this.peak = 0
  }

  update(_dt, s, now) {
    if (!this.flashEl) return
    if (s.thunder <= 0) {
      if (this.peak !== 0) (this.peak = 0), (this.flashEl.style.opacity = '0')
      this.next = 0
      return
    }
    if (this.next === 0) {
      this.next = now + 5000 + Math.random() * 8000
      return
    }
    if (now >= this.next && now >= this.flashUntil) {
      // Begin a flash. Max opacity capped at 30%; min spacing ≥5s.
      this.peak = Math.min(0.3, 0.12 + s.thunder * 0.18)
      this.flashUntil = now + 700
      this.next = now + 5000 + (1 - s.thunder) * 15000 + Math.random() * 6000
    }
    // Ease the flash down to 0 over its lifetime.
    if (now < this.flashUntil) {
      const k = (this.flashUntil - now) / 700
      this.flashEl.style.opacity = String(this.peak * k)
    } else if (this.peak !== 0) {
      this.peak = 0
      this.flashEl.style.opacity = '0'
    }
  }

  draw() {
    /* flash is a DOM layer, nothing to paint on canvas */
  }
}

export default class WeatherEngine {
  constructor(canvas, flashEl) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.elements = [new Rain(), new Thunder(flashEl)]
    this.state = { rain: 0, thunder: 0, w: 0, h: 0 }
    this.reduced = false
    this.running = false
    this.last = 0
    this._frame = this._frame.bind(this)
    this.resize()
  }

  setLevels({ rain, thunder }) {
    if (typeof rain === 'number') this.state.rain = rain
    if (typeof thunder === 'number') this.state.thunder = thunder
    // Wake the loop if there's something to show.
    if (!this.running && (this.state.rain > 0 || this.state.thunder > 0)) this.start()
  }

  setReducedMotion(v) {
    this.reduced = v
    if (v) this._drawCalmFrame()
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    this.canvas.width = w * dpr
    this.canvas.height = h * dpr
    this.canvas.style.width = w + 'px'
    this.canvas.style.height = h + 'px'
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.state.w = w
    this.state.h = h
  }

  start() {
    if (this.running || this.reduced) return
    this.running = true
    this.last = performance.now()
    this._raf = requestAnimationFrame(this._frame)
  }

  stop() {
    this.running = false
    if (this._raf) cancelAnimationFrame(this._raf)
  }

  _drawCalmFrame() {
    // A single faint static frame for reduced-motion users.
    const { ctx, state } = this
    ctx.clearRect(0, 0, state.w, state.h)
    if (state.rain <= 0) return
    ctx.strokeStyle = `rgba(200,214,230,${0.06 + state.rain * 0.12})`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < Math.floor(state.rain * 60); i++) {
      const x = (i * 137.5) % state.w
      const y = (i * 89.3) % state.h
      ctx.moveTo(x, y)
      ctx.lineTo(x + 1, y + 10)
    }
    ctx.stroke()
  }

  _frame(now) {
    if (!this.running) return
    let dt = (now - this.last) / 1000
    if (dt > 0.05) dt = 0.05 // clamp after tab-switch / jank
    this.last = now

    const { ctx, state } = this
    ctx.clearRect(0, 0, state.w, state.h)
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i].update(dt, state, now)
      this.elements[i].draw(ctx, state)
    }

    // Idle out when there's nothing to animate (saves battery).
    if (state.rain <= 0 && state.thunder <= 0) {
      this.stop()
      return
    }
    this._raf = requestAnimationFrame(this._frame)
  }
}
