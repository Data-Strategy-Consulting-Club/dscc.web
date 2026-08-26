import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"

// Connects to data-controller="gallery-draggable"
export default class extends Controller {
  static targets = ["item", "canvas", "grid"]

  connect() {
    gsap.registerPlugin(Draggable)

    this.highestZ = 30
    const controller = this

    // Position each item absolutely so resizing or dragging one item NEVER moves others
    this.initializePositions()

    this.draggables = Draggable.create(this.itemTargets, {
      type: "x,y",
      edgeResistance: 0.85,
      cursor: "grab",
      activeCursor: "grabbing",
      cancel: ".resize-handle",
      onPress() {
        controller.highestZ += 1
        this.target.style.zIndex = controller.highestZ
        controller.applyCustomBounds(this)
      },
      onDragStart() {
        this.target.classList.add("shadow-2xl")
      },
      onDragEnd() {
        this.target.classList.remove("shadow-2xl")
      }
    })

    this.setupResizeHandles()
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

  initializePositions() {
    if (this.itemTargets.length === 0) return

    const container = this.hasGridTarget ? this.gridTarget : (this.hasCanvasTarget ? this.canvasTarget : document.documentElement)
    const containerRect = container.getBoundingClientRect()

    // 1. Record layout positions of each item relative to the container
    const positions = this.itemTargets.map((item) => {
      const rect = item.getBoundingClientRect()
      return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      }
    })

    // 2. Lock each item to absolute positioning with recorded coordinates
    this.itemTargets.forEach((item, index) => {
      const pos = positions[index]
      item.style.position = "absolute"
      item.style.top = "0px"
      item.style.left = "0px"
      item.style.margin = "0px"
      item.style.width = `${pos.width}px`
      item.style.height = `${pos.height}px`
      gsap.set(item, { x: pos.x, y: pos.y })
    })
  }

  setupResizeHandles() {
    this.itemTargets.forEach((item) => {
      const handles = item.querySelectorAll(".resize-handle")
      handles.forEach((handle) => {
        const onStart = (e) => this.startResize(e, item, handle)
        handle.addEventListener("pointerdown", onStart, { capture: true, passive: false })
      })
    })
  }

  startResize(e, item, handle) {
    e.stopPropagation()
    if (e.cancelable) e.preventDefault()

    const draggable = Draggable.get(item)
    if (draggable) {
      draggable.disable()
    }

    this.highestZ += 1
    item.style.zIndex = this.highestZ

    const clientX = e.clientX
    const clientY = e.clientY

    const rect = item.getBoundingClientRect()
    const startWidth = rect.width
    const startHeight = rect.height
    const aspectRatio = startWidth / startHeight

    const isEast = handle.classList.contains("se-handle") || handle.classList.contains("ne-handle")
    const isSouth = handle.classList.contains("se-handle") || handle.classList.contains("sw-handle")

    const onMove = (moveEvent) => {
      moveEvent.stopPropagation()
      if (moveEvent.cancelable) moveEvent.preventDefault()

      const curX = moveEvent.clientX
      const curY = moveEvent.clientY

      const deltaX = isEast ? (curX - clientX) : (clientX - curX)
      const deltaY = isSouth ? (curY - clientY) : (clientY - curY)
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY

      const newWidth = Math.max(80, Math.min(1200, Math.round(startWidth + delta)))
      const newHeight = Math.round(newWidth / aspectRatio)

      item.style.width = `${newWidth}px`
      item.style.height = `${newHeight}px`
      item.style.maxWidth = "none"
      item.style.maxHeight = "none"
    }

    const onEnd = (endEvent) => {
      endEvent.stopPropagation()
      window.removeEventListener("pointermove", onMove, true)
      window.removeEventListener("pointerup", onEnd, true)
      window.removeEventListener("pointercancel", onEnd, true)

      if (draggable) {
        draggable.enable()
        this.applyCustomBounds(draggable)
      }
    }

    window.addEventListener("pointermove", onMove, { capture: true, passive: false })
    window.addEventListener("pointerup", onEnd, { capture: true, passive: false })
    window.addEventListener("pointercancel", onEnd, { capture: true, passive: false })
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
