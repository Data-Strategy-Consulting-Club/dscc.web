import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="navbar"
export default class extends Controller {
  connect() {
    this.prevScrollPos = this.getScrollY()
    this.lastScrollY = this.prevScrollPos
    this.isHidden = false
    this.ticking = false
    this.threshold = 10 // Ignore micro-jitters below 10px

    this.onScroll = this.onScroll.bind(this)
    this.updateNavbar = this.updateNavbar.bind(this)

    // Hardware acceleration and GPU layer isolation
    this.element.style.willChange = "transform"
    this.element.style.backfaceVisibility = "hidden"
    this.element.style.transform = "translate3d(0, 0, 0)"

    window.addEventListener("scroll", this.onScroll, { passive: true })
  }

  disconnect() {
    window.removeEventListener("scroll", this.onScroll)
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getScrollY() {
    return Math.max(0, window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
  }

  onScroll() {
    this.lastScrollY = this.getScrollY()

    if (!this.ticking) {
      this.rafId = requestAnimationFrame(this.updateNavbar)
      this.ticking = true
    }
  }

  updateNavbar() {
    this.ticking = false
    const currentScrollPos = this.lastScrollY
    const scrollDelta = currentScrollPos - this.prevScrollPos

    // Always keep navbar visible near the top (including iOS elastic bounce)
    if (currentScrollPos <= 60) {
      if (this.isHidden) {
        this.show()
      }
      this.prevScrollPos = currentScrollPos
      return
    }

    // Ignore tiny scroll movements below threshold to prevent flickering
    if (Math.abs(scrollDelta) < this.threshold) {
      return
    }

    if (scrollDelta > 0 && !this.isHidden) {
      // Scrolling down -> Hide navbar
      this.hide()
    } else if (scrollDelta < 0 && this.isHidden) {
      // Scrolling up -> Show navbar
      this.show()
    }

    this.prevScrollPos = currentScrollPos
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

