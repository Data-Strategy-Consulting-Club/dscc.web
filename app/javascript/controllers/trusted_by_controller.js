import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["track"]

  connect() {
    this.checkOverflow()
    this.resizeHandler = this.checkOverflow.bind(this)
    window.addEventListener("resize", this.resizeHandler)
  }

  disconnect() {
    window.removeEventListener("resize", this.resizeHandler)
  }

  checkOverflow() {
    const track = this.trackTarget
    if (track.children.length === 0) return

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    const singleSetWidth = Array.from(track.children).reduce(
      (sum, child) => sum + child.offsetWidth + gap,
      0
    ) - gap

    if (singleSetWidth > track.parentElement.clientWidth) {
      if (track.dataset.duplicated) return
      Array.from(track.children).forEach(child => {
        track.appendChild(child.cloneNode(true))
      })
      track.dataset.duplicated = "true"
      track.classList.add("is-animating")
    }
  }
}
