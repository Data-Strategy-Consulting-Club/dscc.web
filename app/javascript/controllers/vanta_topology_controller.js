import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="vanta-topology"
export default class extends Controller {
  connect() {
    this.initVanta()
    this.setupObserver()
  }

  disconnect() {
    this.cleanupObserver()
    this.destroyVanta()
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!this.effect) return
        if (!entry.isIntersecting) {
          if (this.effect.renderer && this.effect.renderer.pause) {
            this.effect.renderer.pause()
          }
        } else {
          if (this.effect.renderer && this.effect.renderer.play) {
            this.effect.renderer.play()
          }
        }
      })
    }, { threshold: 0.05 })

    this.observer.observe(this.element)
  }

  cleanupObserver() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }

  initVanta() {
    if (window.VANTA && window.VANTA.TOPOLOGY && window.p5) {
      this.destroyVanta()
      this.effect = window.VANTA.TOPOLOGY({
        el: this.element,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        scale: 0.20,
        scaleMobile: 1.00,
        color: 0x3176db,
        backgroundColor: 0xffffff
      })
    } else {
      this.loadScriptsAndInit()
    }
  }

  destroyVanta() {
    if (this.effect && typeof this.effect.destroy === "function") {
      this.effect.destroy()
      this.effect = null
    }
  }

  async loadScriptsAndInit() {
    try {
      await this.ensureScript("p5-script", "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js")
      await this.ensureScript("vanta-topology-script", "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.topology.min.js")

      if (!this.element || !this.element.isConnected) return

      if (window.VANTA && window.VANTA.TOPOLOGY && window.p5) {
        this.destroyVanta()
        this.effect = window.VANTA.TOPOLOGY({
          el: this.element,
          mouseControls: true,
          touchControls: false,
          gyroControls: false,
          scale: 0.20,
          scaleMobile: 1.00,
          color: 0x3176db,
          backgroundColor: 0xffffff
        })
      }
    } catch (e) {
      console.warn("Failed to load Vanta topology scripts:", e)
    }
  }

  ensureScript(id, src) {
    return new Promise((resolve, reject) => {
      const isLoaded = () => {
        if (id === "p5-script") return typeof window.p5 !== "undefined"
        if (id === "vanta-topology-script") return typeof window.VANTA !== "undefined" && typeof window.VANTA.TOPOLOGY !== "undefined"
        return false
      }

      if (isLoaded()) {
        return resolve()
      }

      let script = document.getElementById(id)
      if (script) {
        const interval = setInterval(() => {
          if (isLoaded()) {
            clearInterval(interval)
            resolve()
          }
        }, 50)
        setTimeout(() => {
          clearInterval(interval)
          resolve()
        }, 3000)
        return
      }

      script = document.createElement("script")
      script.id = id
      script.src = src
      script.onload = () => resolve()
      script.onerror = (e) => reject(e)
      document.head.appendChild(script)
    })
  }
}
