import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="services-carousel"
export default class extends Controller {
  static targets = ["track"]

  connect() {
    this.track = this.hasTrackTarget ? this.trackTarget : this.element
    this.isDragging = false
    this.startX = 0
    this.startY = 0
    this.scrollLeft = 0

    this.bindTouch()
    this.bindMouse()
    this.bindWheel()
  }

  disconnect() {
    this.unbindTouch()
    this.unbindMouse()
    this.unbindWheel()
  }

  bindTouch() {
    this.onTouchStart = (e) => {
      this.startX = e.touches[0].pageX
      this.startY = e.touches[0].pageY
    }

    this.onTouchMove = (e) => {
      if (!e.touches.length) return
      const dx = Math.abs(e.touches[0].pageX - this.startX)
      const dy = Math.abs(e.touches[0].pageY - this.startY)

      // If user is swiping horizontally, stop propagation so GSAP ScrollSmoother doesn't hijack the touch
      if (dx > dy && dx > 6) {
        e.stopPropagation()
      }
    }

    this.track.addEventListener("touchstart", this.onTouchStart, { passive: true })
    this.track.addEventListener("touchmove", this.onTouchMove, { passive: true })
  }

  unbindTouch() {
    if (this.onTouchStart) this.track.removeEventListener("touchstart", this.onTouchStart)
    if (this.onTouchMove) this.track.removeEventListener("touchmove", this.onTouchMove)
  }

  bindMouse() {
    this.onMouseDown = (e) => {
      if (window.innerWidth >= 1280) return
      this.isDragging = true
      this.startX = e.pageX - this.track.offsetLeft
      this.scrollLeft = this.track.scrollLeft
      this.track.style.cursor = "grabbing"
      this.track.style.userSelect = "none"

      window.addEventListener("mousemove", this.onMouseMove)
      window.addEventListener("mouseup", this.onMouseUp)
    }

    this.onMouseMove = (e) => {
      if (!this.isDragging) return
      e.preventDefault()
      e.stopPropagation()
      const x = e.pageX - this.track.offsetLeft
      const walk = (x - this.startX) * 1.5
      this.track.scrollLeft = this.scrollLeft - walk
    }

    this.onMouseUp = () => {
      if (!this.isDragging) return
      this.isDragging = false
      this.track.style.cursor = ""
      this.track.style.removeProperty("user-select")

      window.removeEventListener("mousemove", this.onMouseMove)
      window.removeEventListener("mouseup", this.onMouseUp)
    }

    this.track.addEventListener("mousedown", this.onMouseDown)
  }

  unbindMouse() {
    if (this.onMouseDown) this.track.removeEventListener("mousedown", this.onMouseDown)
    if (this.onMouseMove) window.removeEventListener("mousemove", this.onMouseMove)
    if (this.onMouseUp) window.removeEventListener("mouseup", this.onMouseUp)
  }

  bindWheel() {
    this.onWheel = (e) => {
      if (window.innerWidth >= 1280) return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.stopPropagation()
      }
    }
    this.track.addEventListener("wheel", this.onWheel, { passive: true })
  }

  unbindWheel() {
    if (this.onWheel) this.track.removeEventListener("wheel", this.onWheel)
  }

  prev() {
    const cards = this.track.querySelectorAll(".snap-center")
    const cardWidth = cards[0]?.offsetWidth || 340
    this.track.scrollBy({ left: -(cardWidth + 24), behavior: "smooth" })
  }

  next() {
    const cards = this.track.querySelectorAll(".snap-center")
    const cardWidth = cards[0]?.offsetWidth || 340
    this.track.scrollBy({ left: cardWidth + 24, behavior: "smooth" })
  }
}

