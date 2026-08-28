import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="navbar"
export default class extends Controller {
  connect() {
    this.prevScrollPos = window.pageYOffset || document.documentElement.scrollTop || 0
    this.lastScrollY = this.prevScrollPos
    this.isHidden = false
    this.ticking = false
    this.threshold = 8 // Ignore micro-jitters below 8px

    this.onScroll = this.onScroll.bind(this)
    this.updateNavbar = this.updateNavbar.bind(this)

    // Hardware acceleration hint
    this.element.style.willChange = "transform"

    window.addEventListener("scroll", this.onScroll, { passive: true })
  }

  disconnect() {
    window.removeEventListener("scroll", this.onScroll)
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  onScroll() {
    this.lastScrollY = Math.max(0, window.pageYOffset || document.documentElement.scrollTop || 0)

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
    if (currentScrollPos <= 50) {
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
    this.isHidden = false
    this.element.style.transform = "translateY(0)"
  }

  hide() {
    this.isHidden = true
    this.element.style.transform = "translateY(-100%)"
  }
}

