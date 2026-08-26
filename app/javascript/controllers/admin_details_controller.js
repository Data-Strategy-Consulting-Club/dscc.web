import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="admin-details"
export default class extends Controller {
  static values = { key: String }

  connect() {
    const savedState = sessionStorage.getItem(`admin_details_${this.keyValue}`)
    if (savedState !== null) {
      this.element.open = savedState === "true"
    }

    this.toggleHandler = () => {
      sessionStorage.setItem(`admin_details_${this.keyValue}`, this.element.open)
    }
    this.element.addEventListener("toggle", this.toggleHandler)
  }

  disconnect() {
    if (this.toggleHandler) {
      this.element.removeEventListener("toggle", this.toggleHandler)
    }
  }
}
