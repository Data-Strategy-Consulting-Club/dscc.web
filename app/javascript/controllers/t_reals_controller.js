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
      smooth: 2,
      effects: false,
      normalizeScroll: {
        allowNestedScroll: true
      },
      ignoreMobileResize: true
    })

    this.triggers = []
    this.setupGalleries()
    this.setupImageWatchers()
  }

  setupGalleries() {
    const portfolio = document.getElementById("portfolio")
    if (!portfolio) return

    const horizontalSections = gsap.utils.toArray(".horiz-gallery-wrapper")

    horizontalSections.forEach((sec) => {
      const pinWraps = Array.from(sec.querySelectorAll(".horiz-gallery-strip"))
      if (!pinWraps.length) return

      // Single timeline for the pinned section ensures all strips move synchronously
      const tl = gsap.timeline({
        scrollTrigger: {
          id: "three-reals",
          trigger: sec,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          start: "center center",
          end: () => {
            const maxScroll = Math.max(
              ...pinWraps.map((pw) => Math.max(0, pw.scrollWidth - window.innerWidth))
            )
            return `+=${maxScroll + window.innerHeight * 0.5}`
          },
          invalidateOnRefresh: true
        }
      })

      pinWraps.forEach((pinWrap, j) => {
        const direction = j % 2 === 0 ? -1 : 1
        const getDistance = () => Math.max(0, pinWrap.scrollWidth - window.innerWidth)

        if (direction === -1) {
          tl.to(
            pinWrap,
            {
              x: () => -getDistance(),
              ease: "none",
              force3D: true
            },
            0
          )
        } else {
          tl.fromTo(
            pinWrap,
            { x: () => -getDistance() },
            {
              x: 0,
              ease: "none",
              force3D: true
            },
            0
          )
        }
      })

      if (tl.scrollTrigger) {
        this.triggers.push(tl.scrollTrigger)

        // Track the entire #reals section from its top header to the end of the pinned gallery
        const sectionTrigger = ScrollTrigger.create({
          id: "three-reals-section",
          trigger: this.element,
          start: "top 80px",
          end: () => tl.scrollTrigger.end
        })
        this.triggers.push(sectionTrigger)
      }
    })

    ScrollTrigger.refresh()
  }

  setupImageWatchers() {
    let refreshTimeout = null
    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => {
        ScrollTrigger.refresh()
      }, 60)
    }

    const images = this.element.querySelectorAll("img")
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", debouncedRefresh, { once: true })
        img.addEventListener("error", debouncedRefresh, { once: true })
      }
    })
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

