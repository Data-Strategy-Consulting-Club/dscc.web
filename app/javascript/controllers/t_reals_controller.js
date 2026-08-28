import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

// Connects to data-controller="t-reals"
export default class extends Controller {
  connect() {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

    // Manual scroll restoration prevents browser from prematurely jumping before ScrollTrigger initializes
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }

    // Clean up any stale smoother or triggers from prior page visits
    this.cleanup()

    this.smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.2,
      effects: false,
      normalizeScroll: false,
      ignoreMobileResize: true
    })

    this.triggers = []

    // Horizontal Scroll Galleries
    const portfolio = document.getElementById("portfolio")
    if (portfolio) {
      const horizontalSections = gsap.utils.toArray(".horiz-gallery-wrapper")

      horizontalSections.forEach((sec) => {
        const pinWraps = sec.querySelectorAll(".horiz-gallery-strip")

        pinWraps.forEach((pinWrap, j) => {
          const direction = j % 2 === 0 ? -1 : 1
          const scrollLength = pinWrap.scrollWidth - window.innerWidth

          if (direction === -1) {
            const tween = gsap.to(pinWrap, {
              scrollTrigger: {
                scrub: 1,
                trigger: sec,
                pin: j === 0 ? sec : false,
                start: "center center",
                end: () => `+=${pinWrap.scrollWidth}`,
                invalidateOnRefresh: true
              },
              x: () => -scrollLength,
              ease: "none"
            })
            if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger)
          } else {
            const tween = gsap.fromTo(
              pinWrap,
              { x: () => -scrollLength },
              {
                scrollTrigger: {
                  scrub: 1,
                  trigger: sec,
                  pin: false,
                  start: "center center",
                  end: () => `+=${pinWrap.scrollWidth}`,
                  invalidateOnRefresh: true
                },
                x: 0,
                ease: "none"
              }
            )
            if (tween.scrollTrigger) this.triggers.push(tween.scrollTrigger)
          }
        })
      })
    }

    ScrollTrigger.refresh()
  }

  disconnect() {
    this.cleanup()
  }

  cleanup() {
    if (this.triggers && this.triggers.length > 0) {
      this.triggers.forEach((t) => {
        try {
          t.kill()
        } catch (e) {
          // ignore
        }
      })
      this.triggers = []
    }

    const existingSmoother = ScrollSmoother.get()
    if (existingSmoother) {
      try {
        existingSmoother.kill()
      } catch (e) {
        // ignore
      }
    }
    this.smoother = null
  }
}

