import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="navbar"
export default class extends Controller {
  connect() {
    this.prevScrollPos = window.pageYOffset

    this.handleScroll = this.handleScroll.bind(this)
    window.addEventListener("scroll", this.handleScroll)
  }

  disconnect() {
    window.removeEventListener("scroll", this.handleScroll)
  }

  handleScroll() {
    const currentScrollPos = window.pageYOffset

    if (this.prevScrollPos > currentScrollPos) {
      this.element.style.transform = "translateY(0)"
    } else {
      this.element.style.transform = "translateY(-100%)"
    }

    this.prevScrollPos = currentScrollPos
  }
}
