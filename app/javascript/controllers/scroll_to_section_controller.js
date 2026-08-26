import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"

// Connects to data-controller="scroll-to-section"
export default class extends Controller {
  connect() {
    gsap.registerPlugin(ScrollToPlugin)

    if (window.location.pathname === "/" && window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash)
        if (target) {
          gsap.to(window, {
            duration: 0.1,
            scrollTo: {
              y: window.location.hash,
              offsetY: 120
            }
          })
        }
      }, 50)
    }
  }

  scroll(event) {
    const rawHref = event.currentTarget.getAttribute("href")
    if (!rawHref) return

    const isHomePage = window.location.pathname === "/"
    const hashIndex = rawHref.indexOf("#")
    const hash = hashIndex !== -1 ? rawHref.substring(hashIndex) : null

    if (isHomePage && hash) {
      const target = document.querySelector(hash)
      if (target) {
        event.preventDefault()
        gsap.to(window, {
          duration: 0.1,
          scrollTo: {
            y: hash,
            offsetY: 120
          }
        })
      }
    }
  }
}
