import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="vanta-topology"
export default class extends Controller {
  static scriptPromise = null

  connect() {
    this.isVisible = true
    this.isPaused = false
    this.isDestroyed = false

    this.visibilityHandler = this.handleVisibilityChange.bind(this)
    document.addEventListener("visibilitychange", this.visibilityHandler)

    this.setupObserver()
    this.start()
  }

  disconnect() {
    this.isDestroyed = true

    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler)
      this.visibilityHandler = null
    }

    this.cleanupObserver()
    this.destroyVanta()
  }

  setupObserver() {
    this.cleanupObserver()

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.isVisible = entry.isIntersecting
        if (this.isVisible) {
          this.resume()
        } else {
          this.pause()
        }
      })
    }, {
      rootMargin: "80px",
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

  handleVisibilityChange() {
    if (document.hidden) {
      this.pause()
    } else if (this.isVisible) {
      this.resume()
    }
  }

  pause() {
    if (!this.effect) return
    this.isPaused = true

    try {
      if (this.effect.p5 && typeof this.effect.p5.noLoop === "function") {
        this.effect.p5.noLoop()
      }
    } catch (e) {
      // ignore
    }
  }

  resume() {
    if (!this.effect || !this.isVisible || document.hidden) return
    this.isPaused = false

    try {
      if (this.effect.p5 && typeof this.effect.p5.loop === "function") {
        this.effect.p5.loop()
      }
    } catch (e) {
      // ignore
    }
  }

  async start() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    try {
      await this.loadDependencies()

      if (this.isDestroyed || !this.element || !this.element.isConnected) {
        return
      }

      this.initVanta()
    } catch (e) {
      console.warn("Vanta Topology initialization failed:", e)
    }
  }

  initVanta() {
    if (!window.VANTA?.TOPOLOGY || !window.p5) return
    if (this.isDestroyed || !this.element || !this.element.isConnected) return

    this.destroyVanta()

    try {
      this.effect = window.VANTA.TOPOLOGY({
        el: this.element,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x3176db,
        backgroundColor: 0xffffff
      })

      if (!this.isVisible || document.hidden) {
        this.pause()
      }
    } catch (err) {
      console.warn("Failed to create Vanta instance:", err)
      this.destroyVanta()
    }
  }

  destroyVanta() {
    if (this.effect) {
      try {
        if (this.effect.p5 && typeof this.effect.p5.noLoop === "function") {
          this.effect.p5.noLoop()
        }
        if (this.effect.p5 && typeof this.effect.p5.remove === "function") {
          this.effect.p5.remove()
        }
        if (typeof this.effect.destroy === "function") {
          this.effect.destroy()
        }
      } catch (e) {
        console.warn("Error during Vanta effect destruction:", e)
      }
      this.effect = null
    }

    if (this.element) {
      const leftoverCanvases = this.element.querySelectorAll("canvas, .vanta-canvas")
      leftoverCanvases.forEach(c => c.remove())
    }
  }

  loadDependencies() {
    if (window.VANTA?.TOPOLOGY && window.p5) {
      return Promise.resolve()
    }

    if (this.constructor.scriptPromise) {
      return this.constructor.scriptPromise
    }

    this.constructor.scriptPromise = (async () => {
      try {
        await this.loadScript("p5-script", "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js", () => typeof window.p5 !== "undefined")
        await this.loadScript("vanta-topology-script", "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.topology.min.js", () => typeof window.VANTA?.TOPOLOGY !== "undefined")
      } catch (err) {
        this.constructor.scriptPromise = null
        throw err
      }
    })()

    return this.constructor.scriptPromise
  }

  loadScript(id, src, checkLoaded) {
    return new Promise((resolve, reject) => {
      if (checkLoaded()) return resolve()

      const existing = document.getElementById(id)
      if (existing) {
        const interval = setInterval(() => {
          if (checkLoaded()) {
            clearInterval(interval)
            resolve()
          }
        }, 50)

        setTimeout(() => {
          clearInterval(interval)
          if (checkLoaded()) resolve()
          else reject(new Error(`Timeout waiting for script ${id}`))
        }, 5000)
        return
      }

      const script = document.createElement("script")
      script.id = id
      script.src = src
      script.async = true
      script.onload = () => {
        if (checkLoaded()) {
          resolve()
        } else {
          const poll = setInterval(() => {
            if (checkLoaded()) {
              clearInterval(poll)
              resolve()
            }
          }, 30)
          setTimeout(() => {
            clearInterval(poll)
            resolve()
          }, 1000)
        }
      }
      script.onerror = (e) => reject(e)
      document.head.appendChild(script)
    })
  }
}
