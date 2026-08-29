import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { ScrollSmoother } from "gsap/ScrollSmoother"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Connects to data-controller="scroll-to-section"
export default class extends Controller {
  connect() {
    gsap.registerPlugin(ScrollToPlugin, ScrollSmoother, ScrollTrigger)

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    this.timeouts = []
    this.handleInitialHash()
  }

  disconnect() {
    if (this.timeouts) {
      this.timeouts.forEach((id) => clearTimeout(id))
      this.timeouts = []
    }
  }

  handleInitialHash() {
    const hash = window.location.hash
    if (!hash) return

    const performScroll = () => {
      const target = document.querySelector(hash)
      if (target) {
        ScrollTrigger.refresh()
        const smoother = ScrollSmoother.get()
        if (smoother) {
          smoother.scrollTo(target, true, "top 80px")
        } else {
          gsap.to(window, {
            duration: 0.8,
            ease: "power2.inOut",
            scrollTo: {
              y: target,
              offsetY: 80
            }
          })
        }
      }
    }

    if (document.readyState === "complete") {
      this.timeouts.push(setTimeout(performScroll, 120))
    } else {
      window.addEventListener("load", () => {
        this.timeouts.push(setTimeout(performScroll, 80))
      }, { once: true })
      this.timeouts.push(setTimeout(performScroll, 220))
    }
  }

  scroll(event) {
    const rawHref = event.currentTarget.getAttribute("href")
    if (!rawHref) return

    const isHomePage = window.location.pathname === "/" || window.location.pathname === ""
    const hashIndex = rawHref.indexOf("#")
    const hash = hashIndex !== -1 ? rawHref.substring(hashIndex) : null

    if (isHomePage && hash) {
      const target = document.querySelector(hash)
      if (target) {
        event.preventDefault()
        this.scrollToElement(target, hash)
      }
    }
  }

  scrollToElement(target, hash, smooth = true) {
    if (!target) return

    // Close mobile navbar if open
    const mobileMenu = document.getElementById("navbar-cta")
    if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
      mobileMenu.classList.add("hidden")
    }

    ScrollTrigger.refresh()

    const smoother = ScrollSmoother.get()
    if (smoother) {
      smoother.scrollTo(target, smooth, "top 80px")
    } else {
      if (smooth) {
        gsap.to(window, {
          duration: 0.8,
          ease: "power2.inOut",
          scrollTo: {
            y: target,
            offsetY: 80
          }
        })
      } else {
        const top = target.getBoundingClientRect().top + window.pageYOffset - 80
        window.scrollTo(0, top)
      }
    }

    if (hash && window.location.hash !== hash) {
      history.pushState(null, null, hash)
    }
  }
}



