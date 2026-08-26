import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="toast"
export default class extends Controller {
  static values = {
    duration: { type: Number, default: 2000 }
  }

  connect() {
    this.startTimer()
  }

  disconnect() {
    this.clearTimer()
  }

  startTimer() {
    this.clearTimer()
    this.timeout = setTimeout(() => {
      this.dismiss()
    }, this.durationValue)
  }

  clearTimer() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  dismiss() {
    this.clearTimer()
    this.element.classList.add("opacity-0")
    setTimeout(() => {
      this.element.remove()
    }, 300)
  }
}
