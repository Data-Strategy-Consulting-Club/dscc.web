import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"

// Connects to data-controller="gallery-draggable"
export default class extends Controller {
  static targets = ["item", "canvas"]

  connect() {
    gsap.registerPlugin(Draggable)

    let highestZ = 30
    const controller = this

    this.draggables = Draggable.create(this.itemTargets, {
      type: "x,y",
      edgeResistance: 0.85,
      cursor: "grab",
      activeCursor: "grabbing",
      onPress() {
        highestZ += 1
        this.target.style.zIndex = highestZ
        controller.applyCustomBounds(this)
      },
      onDragStart() {
        this.target.classList.add("shadow-2xl")
      },
      onDragEnd() {
        this.target.classList.remove("shadow-2xl")
      }
    })

    this.refreshAllBounds()

    this.resizeHandler = () => this.refreshAllBounds()
    window.addEventListener("resize", this.resizeHandler)
  }

  disconnect() {
    window.removeEventListener("resize", this.resizeHandler)
    if (this.draggables) {
      this.draggables.forEach((d) => d.kill())
      this.draggables = []
    }
  }

  refreshAllBounds() {
    if (!this.draggables) return
    this.draggables.forEach((d) => this.applyCustomBounds(d))
  }

  applyCustomBounds(draggable) {
    const el = draggable.target
    const container = this.hasCanvasTarget ? this.canvasTarget : document.documentElement

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    const currentX = gsap.getProperty(el, "x") || 0
    const currentY = gsap.getProperty(el, "y") || 0

    const naturalLeft = elRect.left - currentX
    const naturalTop = elRect.top - currentY
    const width = elRect.width
    const height = elRect.height

    // Allow up to 80% outside the container area (at least 20% remains inside)
    const minX = containerRect.left - naturalLeft - 0.8 * width
    const maxX = containerRect.right - naturalLeft - 0.2 * width
    const minY = containerRect.top - naturalTop - 0.8 * height
    const maxY = containerRect.bottom - naturalTop - 0.2 * height

    draggable.applyBounds({
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY
    })
  }
}
