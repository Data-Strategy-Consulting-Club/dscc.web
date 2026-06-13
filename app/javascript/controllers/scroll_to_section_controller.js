import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"

// Connects to data-controller="scroll-to-section"
export default class extends Controller {
  connect() {
    gsap.registerPlugin(ScrollToPlugin)
  }

  scroll(event) {
    event.preventDefault()

    const href = event.currentTarget.getAttribute("href")

    gsap.to(window, {
      duration: 0.1,
      scrollTo: {
        y: href,
        offsetY: 120
      }
    })
  }
}
