import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"

// Connects to data-controller="gallery-draggable"
export default class extends Controller {
  static targets = ["item", "canvas"]

  connect() {
    gsap.registerPlugin(Draggable)

    let highestZ = 30

    this.draggables = Draggable.create(this.itemTargets, {
      type: "x,y",
      bounds: this.hasCanvasTarget ? this.canvasTarget : undefined,
      edgeResistance: 0.65,
      cursor: "grab",
      activeCursor: "grabbing",
      onPress() {
        highestZ += 1
        this.target.style.zIndex = highestZ
      },
      onDragStart() {
        this.target.classList.add("shadow-2xl")
      },
      onDragEnd() {
        this.target.classList.remove("shadow-2xl")
      }
    })
  }

  disconnect() {
    if (this.draggables) {
      this.draggables.forEach((d) => d.kill())
      this.draggables = []
    }
  }
}
