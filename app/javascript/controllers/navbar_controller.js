import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Connects to data-controller="navbar"
export default class extends Controller {
  connect() {
    gsap.registerPlugin(ScrollTrigger)

    this.isHidden = false

    // Hardware acceleration and GPU layer isolation
    this.element.style.willChange = "transform"
    this.element.style.backfaceVisibility = "hidden"
    this.element.style.transform = "translate3d(0, 0, 0)"

    this.setupScrollTrigger()
  }

  setupScrollTrigger() {
    this.cleanupTrigger()

    this.trigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const currentScrollPos = self.scroll()
        const direction = self.direction // 1 for scrolling down, -1 for scrolling up

        // Always keep navbar visible near the top (including iOS elastic bounce)
        if (currentScrollPos <= 60) {
          if (this.isHidden) this.show()
          return
        }

        // When scrolling inside the 3 Reels section, keep navbar closed
        const realsSectionTrigger = ScrollTrigger.getById("three-reals-section") || ScrollTrigger.getById("three-reals")
        if (realsSectionTrigger && realsSectionTrigger.isActive) {
          if (!this.isHidden) this.hide()
          return
        }

        if (direction === 1 && !this.isHidden) {
          this.hide()
        } else if (direction === -1 && this.isHidden) {
          this.show()
        }
      }
    })
  }

  disconnect() {
    this.cleanupTrigger()
  }

  cleanupTrigger() {
    if (this.trigger) {
      this.trigger.kill()
      this.trigger = null
    }
  }

  show() {
    if (!this.isHidden) return
    this.isHidden = false
    this.element.style.transform = "translate3d(0, 0, 0)"
  }

  hide() {
    if (this.isHidden) return
    this.isHidden = true
    this.element.style.transform = "translate3d(0, -100%, 0)"
  }
}


