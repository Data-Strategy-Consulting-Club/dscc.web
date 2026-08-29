import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["track", "wrapper", "primarySet"]

  connect() {
    this.setup()
    this.resizeHandler = this.debounce(this.setup.bind(this), 120)
    window.addEventListener("resize", this.resizeHandler)
  }

  disconnect() {
    window.removeEventListener("resize", this.resizeHandler)
    if (this.resizeHandler && typeof this.resizeHandler.cancel === "function") {
      this.resizeHandler.cancel()
    }
  }

  debounce(func, wait) {
    let timeout
    const debounced = (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), wait)
    }
    debounced.cancel = () => {
      clearTimeout(timeout)
      timeout = null
    }
    return debounced
  }

  setup() {
    if (!this.hasPrimarySetTarget) return

    const images = this.primarySetTarget.querySelectorAll("img")
    const unloaded = Array.from(images).filter(img => !img.complete)

    if (unloaded.length > 0) {
      Promise.all(
        unloaded.map(img => new Promise(res => {
          img.onload = img.onerror = res
        }))
      ).then(() => this.checkOverflow())
    } else {
      this.checkOverflow()
    }
  }

  checkOverflow() {
    if (!this.hasTrackTarget || !this.hasPrimarySetTarget) return

    const wrapper = this.hasWrapperTarget ? this.wrapperTarget : this.element
    const track = this.trackTarget
    const primarySet = this.primarySetTarget

    const wrapperWidth = wrapper.clientWidth
    const setWidth = primarySet.scrollWidth

    if (setWidth > wrapperWidth) {
      if (!this.secondarySet) {
        this.secondarySet = primarySet.cloneNode(true)
        this.secondarySet.setAttribute("aria-hidden", "true")
        this.secondarySet.classList.add("trusted-by-set")
        track.appendChild(this.secondarySet)
      }

      primarySet.classList.add("pr-8", "md:pr-12")
      this.secondarySet.classList.add("pr-8", "md:pr-12")
      track.classList.remove("justify-center", "w-full")
      track.classList.add("w-max", "is-animating")
      wrapper.classList.add("has-overflow")
    } else {
      if (this.secondarySet) {
        this.secondarySet.remove()
        this.secondarySet = null
      }

      primarySet.classList.remove("pr-8", "md:pr-12")
      track.classList.remove("w-max", "is-animating")
      track.classList.add("justify-center", "w-full")
      wrapper.classList.remove("has-overflow")
    }
  }
}

