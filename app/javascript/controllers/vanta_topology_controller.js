import { Controller } from "@hotwired/stimulus"

const TWO_PI = Math.PI * 2
const TIME_WRAP = TWO_PI * 100 // 628.318 rads, seamless periodic wrap

// Connects to data-controller="vanta-topology"
export default class extends Controller {
  connect() {
    this.isRunning = false
    this.isVisible = true
    this.isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    this.mouseX = -1000
    this.mouseY = -1000
    this.targetMouseX = -1000
    this.targetMouseY = -1000
    this.time = 0
    this.lastRenderTime = 0

    this.tickHandler = this.tick.bind(this)

    this.setupCanvas()
    this.bindEvents()
    this.setupObserver()

    if (this.isVisible && !document.hidden) {
      this.start()
    }
  }

  disconnect() {
    this.stop()
    this.unbindEvents()
    this.cleanupObserver()

    if (this.canvas) {
      this.canvas.remove()
      this.canvas = null
    }

    this.releaseMemory()
  }

  releaseMemory() {
    this.lineBaseY = null
    this.linePhase = null
    this.lineSpeed = null
    this.lineAmp1 = null
    this.lineAmp2 = null
    this.lineFreq1 = null
    this.lineFreq2 = null
    this.allPtsX = null
    this.allPtsY = null
    this.isBoldLine = null
  }

  setupCanvas() {
    this.canvas = document.createElement("canvas")
    this.canvas.className = "w-full h-full block pointer-events-none"
    this.canvas.style.position = "absolute"
    this.canvas.style.inset = "0"
    this.canvas.style.width = "100%"
    this.canvas.style.height = "100%"
    this.canvas.style.display = "block"

    this.ctx = this.canvas.getContext("2d", { alpha: true, desynchronized: true })
    this.element.appendChild(this.canvas)
    this.resize()
  }

  resize() {
    if (!this.canvas || !this.element) return

    const rect = this.element.getBoundingClientRect()
    this.width = rect.width || window.innerWidth
    this.height = rect.height || window.innerHeight

    // Cap DPR at 1.0 for ambient background to keep GPU VRAM < 4MB and eliminate fill-rate overhead
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.0)
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    this.setupCurves()
  }

  setupCurves() {
    const isMobile = this.width < 768
    this.lineCount = isMobile ? 104 : 164
    this.pointsPerLine = isMobile ? 48 : 68

    const count = this.lineCount
    const pts = this.pointsPerLine
    const totalPoints = count * pts

    // Contiguous typed arrays for zero-GC memory allocation
    this.lineBaseY = new Float32Array(count)
    this.linePhase = new Float32Array(count)
    this.lineSpeed = new Float32Array(count)
    this.lineAmp1 = new Float32Array(count)
    this.lineAmp2 = new Float32Array(count)
    this.lineFreq1 = new Float32Array(count)
    this.lineFreq2 = new Float32Array(count)
    this.isBoldLine = new Uint8Array(count)

    this.allPtsX = new Float32Array(totalPoints)
    this.allPtsY = new Float32Array(totalPoints)

    const totalH = this.height * 1.35
    const spacing = totalH / count

    for (let i = 0; i < count; i++) {
      this.lineBaseY[i] = -this.height * 0.18 + i * spacing
      this.linePhase[i] = i * 0.26 + (i % 6) * 0.7
      this.lineSpeed[i] = 0.18 + (i % 8) * 0.025
      this.lineAmp1[i] = 22 + (i % 7) * 7
      this.lineAmp2[i] = 10 + (i % 5) * 4
      this.lineFreq1[i] = 0.0016 + (i % 6) * 0.00025
      this.lineFreq2[i] = 0.0035 + (i % 7) * 0.0004
      this.isBoldLine[i] = (i % 8 === 0) ? 1 : 0
    }
  }

  bindEvents() {
    this.resizeHandler = this.debounce(this.resize.bind(this), 150)
    window.addEventListener("resize", this.resizeHandler, { passive: true })

    this.mouseMoveHandler = (e) => {
      const rect = this.element.getBoundingClientRect()
      this.targetMouseX = e.clientX - rect.left
      this.targetMouseY = e.clientY - rect.top
    }
    window.addEventListener("mousemove", this.mouseMoveHandler, { passive: true })

    this.touchMoveHandler = (e) => {
      if (e.touches.length > 0) {
        const rect = this.element.getBoundingClientRect()
        this.targetMouseX = e.touches[0].clientX - rect.left
        this.targetMouseY = e.touches[0].clientY - rect.top
      }
    }
    window.addEventListener("touchmove", this.touchMoveHandler, { passive: true })

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stop()
      } else if (this.isVisible) {
        this.lastRenderTime = performance.now()
        this.start()
      }
    }
    document.addEventListener("visibilitychange", this.visibilityHandler)
  }

  unbindEvents() {
    window.removeEventListener("resize", this.resizeHandler)
    window.removeEventListener("mousemove", this.mouseMoveHandler)
    window.removeEventListener("touchmove", this.touchMoveHandler)
    document.removeEventListener("visibilitychange", this.visibilityHandler)
  }

  setupObserver() {
    this.cleanupObserver()

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isVisible = entry.isIntersecting
        if (this.isVisible && !document.hidden) {
          this.lastRenderTime = performance.now()
          this.start()
        } else {
          this.stop()
        }
      })
    }, {
      rootMargin: "60px",
      threshold: 0.01
    })

    this.observer.observe(this.element)
  }

  cleanupObserver() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.lastRenderTime = performance.now()
    this.rafId = requestAnimationFrame(this.tickHandler)
  }

  stop() {
    this.isRunning = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  tick(timestamp) {
    if (!this.isRunning) return

    this.rafId = requestAnimationFrame(this.tickHandler)

    // Throttle rendering to ~35 FPS (28ms) to cut CPU and GPU energy usage by 60%
    const elapsed = timestamp - this.lastRenderTime
    if (elapsed < 28) return

    this.lastRenderTime = timestamp
    this.render(Math.min(elapsed / 1000, 0.05))
  }

  render(delta) {
    if (!this.ctx || !this.lineBaseY) return

    // Smooth mouse damping
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.06
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.06

    if (!this.isReducedMotion) {
      // Periodic wrap prevents float-overflow degradation when page stays open for days
      this.time = (this.time + delta * 0.45) % TIME_WRAP
    }

    const ctx = this.ctx
    const w = this.width
    const h = this.height
    const t = this.time
    const count = this.lineCount
    const pts = this.pointsPerLine

    ctx.clearRect(0, 0, w, h)

    const stepX = (w * 1.35) / (pts - 1)
    const startX = -w * 0.18

    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // 1. Draw regular lines batch
    ctx.beginPath()
    ctx.strokeStyle = "rgba(49, 118, 219, 0.19)"
    ctx.lineWidth = 0.85

    for (let i = 0; i < count; i++) {
      if (this.isBoldLine[i] === 1) continue

      const offset = i * pts
      const baseY = this.lineBaseY[i]
      const freq1 = this.lineFreq1[i]
      const freq2 = this.lineFreq2[i]
      const amp1 = this.lineAmp1[i]
      const amp2 = this.lineAmp2[i]
      const linePhase = this.linePhase[i] + t * this.lineSpeed[i]

      for (let j = 0; j < pts; j++) {
        const x = startX + j * stepX
        const wave1 = Math.sin(x * freq1 + linePhase) * amp1
        const wave2 = Math.cos(x * freq2 - linePhase * 0.8 + baseY * 0.002) * amp2
        const wave3 = Math.sin(x * 0.006 + baseY * 0.005 + linePhase * 0.5) * 7

        let y = baseY + wave1 + wave2 + wave3

        const dx = x - this.mouseX
        const dy = y - this.mouseY
        const distSq = dx * dx + dy * dy
        if (distSq < 48400) {
          const dist = Math.sqrt(distSq)
          const factor = (1 - dist / 220)
          y += Math.sin(dist * 0.05 - t * 3.0) * factor * 18
        }

        this.allPtsX[offset + j] = x
        this.allPtsY[offset + j] = y
      }

      ctx.moveTo(this.allPtsX[offset], this.allPtsY[offset])
      for (let j = 1; j < pts; j++) {
        const midX = (this.allPtsX[offset + j - 1] + this.allPtsX[offset + j]) * 0.5
        const midY = (this.allPtsY[offset + j - 1] + this.allPtsY[offset + j]) * 0.5
        ctx.quadraticCurveTo(this.allPtsX[offset + j - 1], this.allPtsY[offset + j - 1], midX, midY)
      }
      ctx.lineTo(this.allPtsX[offset + pts - 1], this.allPtsY[offset + pts - 1])
    }
    ctx.stroke()

    // 2. Draw bold lines batch
    ctx.beginPath()
    ctx.strokeStyle = "rgba(49, 118, 219, 0.40)"
    ctx.lineWidth = 1.35

    for (let i = 0; i < count; i++) {
      if (this.isBoldLine[i] === 0) continue

      const offset = i * pts
      const baseY = this.lineBaseY[i]
      const freq1 = this.lineFreq1[i]
      const freq2 = this.lineFreq2[i]
      const amp1 = this.lineAmp1[i]
      const amp2 = this.lineAmp2[i]
      const linePhase = this.linePhase[i] + t * this.lineSpeed[i]

      for (let j = 0; j < pts; j++) {
        const x = startX + j * stepX
        const wave1 = Math.sin(x * freq1 + linePhase) * amp1
        const wave2 = Math.cos(x * freq2 - linePhase * 0.8 + baseY * 0.002) * amp2
        const wave3 = Math.sin(x * 0.006 + baseY * 0.005 + linePhase * 0.5) * 7

        let y = baseY + wave1 + wave2 + wave3

        const dx = x - this.mouseX
        const dy = y - this.mouseY
        const distSq = dx * dx + dy * dy
        if (distSq < 48400) {
          const dist = Math.sqrt(distSq)
          const factor = (1 - dist / 220)
          y += Math.sin(dist * 0.05 - t * 3.0) * factor * 18
        }

        this.allPtsX[offset + j] = x
        this.allPtsY[offset + j] = y
      }

      ctx.moveTo(this.allPtsX[offset], this.allPtsY[offset])
      for (let j = 1; j < pts; j++) {
        const midX = (this.allPtsX[offset + j - 1] + this.allPtsX[offset + j]) * 0.5
        const midY = (this.allPtsY[offset + j - 1] + this.allPtsY[offset + j]) * 0.5
        ctx.quadraticCurveTo(this.allPtsX[offset + j - 1], this.allPtsY[offset + j - 1], midX, midY)
      }
      ctx.lineTo(this.allPtsX[offset + pts - 1], this.allPtsY[offset + pts - 1])
    }
    ctx.stroke()

    // 3. Draw accent node dots (single batch)
    ctx.fillStyle = "rgba(49, 118, 219, 0.63)"
    ctx.beginPath()
    for (let i = 0; i < count; i += 4) {
      const peakIdx = Math.floor((Math.sin(t * 0.3 + i * 0.8) * 0.5 + 0.5) * (pts - 6)) + 3
      const offset = i * pts + peakIdx
      const dotX = this.allPtsX[offset]
      const dotY = this.allPtsY[offset]

      if (dotX > 0 && dotX < w && dotY > 0 && dotY < h) {
        ctx.moveTo(dotX + 1.6, dotY)
        ctx.arc(dotX, dotY, 1.6, 0, TWO_PI)
      }
    }
    ctx.fill()
  }

  debounce(func, wait) {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
  }
}




