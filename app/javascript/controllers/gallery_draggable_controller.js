import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { Draggable } from "gsap/Draggable"

// Connects to data-controller="gallery-draggable"
export default class extends Controller {
  static targets = ["canvas", "container", "watermark", "watermarkText", "item"]

  connect() {
    gsap.registerPlugin(Draggable)

    this.prevHtmlOverflow = document.documentElement.style.overflow
    this.prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"

    this.highestZ = 20
    this.draggables = []
    this.isInitialized = false
    this.lastLayoutWidth = 0
    this.lastLayoutHeight = 0

    // Bind resize handlers
    this.debouncedResize = this.debounce(this.handleResize.bind(this), 160)
    window.addEventListener("resize", this.debouncedResize)
    window.addEventListener("orientationchange", this.debouncedResize)

    // Wait for DOM & styles/fonts ready
    this.initLayoutTimeout = setTimeout(() => {
      this.calculateAndApplyLayout(false)
      this.setupDraggables()
      this.setupResizeHandles()
    }, 40)
  }

  disconnect() {
    document.documentElement.style.overflow = this.prevHtmlOverflow || ""
    document.body.style.overflow = this.prevBodyOverflow || ""

    clearTimeout(this.initLayoutTimeout)
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout)
    window.removeEventListener("resize", this.debouncedResize)
    window.removeEventListener("orientationchange", this.debouncedResize)

    if (this.draggables) {
      this.draggables.forEach((d) => d.kill())
      this.draggables = []
    }
  }

  debounce(func, wait) {
    return (...args) => {
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => func(...args), wait)
    }
  }

  handleResize() {
    const currentWidth = window.innerWidth
    const currentHeight = window.innerHeight

    // Recalculate on significant dimension change or breakpoint crossing
    const widthDiff = Math.abs(currentWidth - this.lastLayoutWidth)
    const heightDiff = Math.abs(currentHeight - this.lastLayoutHeight)

    if (widthDiff >= 20 || heightDiff >= 40 || this.isCrossBreakpoint(this.lastLayoutWidth, currentWidth)) {
      this.calculateAndApplyLayout(true)
      this.refreshAllBounds()
    }
  }

  isCrossBreakpoint(w1, w2) {
    const b768 = (w1 < 768 && w2 >= 768) || (w1 >= 768 && w2 < 768)
    const b1024 = (w1 < 1024 && w2 >= 1024) || (w1 >= 1024 && w2 < 1024)
    return b768 || b1024
  }

  calculateAndApplyLayout(isResize = false) {
    const items = this.itemTargets
    if (items.length === 0) return

    const canvas = this.hasCanvasTarget ? this.canvasTarget : this.element
    const vw = window.innerWidth
    const vh = window.innerHeight

    this.lastLayoutWidth = vw
    this.lastLayoutHeight = vh

    const isMobile = vw < 768
    const isTablet = vw >= 768 && vw < 1024
    const isDesktop = vw >= 1024

    // 1. Dynamic Canvas Height: Prioritize fitting within viewport, only expanding slightly if needed for high photo density
    let requiredMinHeight
    if (isMobile) {
      // Prioritize 100vh viewport; only expand slightly if > 6 photos
      const extraHeight = items.length > 6 ? Math.min(vh * 0.35, (items.length - 6) * 36) : 0
      requiredMinHeight = Math.max(vh, vh + extraHeight)
    } else if (isTablet) {
      const extraHeight = items.length > 10 ? (items.length - 10) * 30 : 0
      requiredMinHeight = Math.max(vh, 720 + extraHeight)
    } else {
      requiredMinHeight = Math.max(vh, 700)
    }

    canvas.style.minHeight = `${requiredMinHeight}px`
    const canvasRect = canvas.getBoundingClientRect()
    const canvasWidth = canvas.clientWidth || vw
    const canvasHeight = Math.max(requiredMinHeight, canvas.clientHeight || vh)

    // 2. Usable Boundaries (padding / margins)
    const topNavbarOffset = isMobile ? 64 : 76
    const sidePadding = isMobile ? 8 : (isTablet ? 20 : 32)
    const bottomPadding = isMobile ? 16 : (isTablet ? 28 : 40)

    const minX = sidePadding
    const maxX = canvasWidth - sidePadding
    const minY = topNavbarOffset
    const maxY = canvasHeight - bottomPadding

    // 3. Measure Strict Central Watermark Exclusion Zone
    const exclusionZone = this.computeExclusionZone(canvasRect, canvasWidth, canvasHeight, isMobile, isTablet)

    // 4. Calculate Sizing for each photo
    const photoSizes = items.map((item, idx) => {
      return this.computeItemSize(item, idx, vw, isMobile, isTablet, isDesktop, canvasWidth)
    })

    // 5. Space-Aware Placement Algorithm (Multi-zone candidate sampling & collision evaluation)
    const placements = this.findOptimalPlacements(
      photoSizes,
      minX,
      maxX,
      minY,
      maxY,
      exclusionZone,
      canvasWidth,
      canvasHeight,
      isMobile,
      isTablet
    )

    // 6. Apply Calculated Positions & Rotations
    items.forEach((item, index) => {
      const placement = placements[index]
      const size = photoSizes[index]

      item.style.position = "absolute"
      item.style.top = "0px"
      item.style.left = "0px"
      item.style.margin = "0px"
      item.style.width = `${size.width}px`
      item.style.height = `${size.height}px`
      item.style.zIndex = placement.zIndex

      if (!this.isInitialized && !isResize) {
        // Initial organic entrance animation
        gsap.set(item, {
          x: placement.x,
          y: placement.y,
          rotation: placement.rotation,
          scale: 0.85,
          opacity: 0
        })

        gsap.to(item, {
          scale: 1,
          opacity: 1,
          duration: 0.65,
          delay: 0.05 + index * 0.035,
          ease: "back.out(1.3)"
        })
      } else {
        // Smooth transition on resize
        gsap.to(item, {
          x: placement.x,
          y: placement.y,
          rotation: placement.rotation,
          duration: 0.5,
          ease: "power2.out"
        })
      }
    })

    this.isInitialized = true
  }

  computeExclusionZone(canvasRect, canvasWidth, canvasHeight, isMobile, isTablet) {
    let wmLeft, wmTop, wmWidth, wmHeight

    const watermarkEl = this.hasWatermarkTextTarget
      ? this.watermarkTextTarget
      : (this.hasWatermarkTarget ? this.watermarkTarget : null)

    if (watermarkEl) {
      const wmRect = watermarkEl.getBoundingClientRect()
      wmLeft = wmRect.left - canvasRect.left
      wmTop = wmRect.top - canvasRect.top
      wmWidth = wmRect.width
      wmHeight = wmRect.height
    } else {
      // Fallback relative center
      wmWidth = isMobile ? 200 : (isTablet ? 340 : 460)
      wmHeight = isMobile ? 110 : (isTablet ? 150 : 190)
      wmLeft = (canvasWidth - wmWidth) / 2
      wmTop = (canvasHeight - wmHeight) / 2
    }

    // Safety margin around watermark
    const clearanceX = isMobile ? 16 : (isTablet ? 28 : 42)
    const clearanceY = isMobile ? 14 : (isTablet ? 22 : 32)

    return {
      left: Math.max(0, wmLeft - clearanceX),
      top: Math.max(56, wmTop - clearanceY),
      right: Math.min(canvasWidth, wmLeft + wmWidth + clearanceX),
      bottom: wmTop + wmHeight + clearanceY,
      width: wmWidth + clearanceX * 2,
      height: wmHeight + clearanceY * 2
    }
  }

  computeItemSize(item, idx, vw, isMobile, isTablet, isDesktop, canvasWidth) {
    // 3 size tiers: Small, Medium, Large for visual depth and rhythm
    const tierCycle = idx % 3
    let baseWidth

    if (isDesktop) {
      if (tierCycle === 0) baseWidth = 230 + (idx * 17) % 25 // Small: 230-255
      else if (tierCycle === 1) baseWidth = 275 + (idx * 23) % 25 // Medium: 275-300
      else baseWidth = 320 + (idx * 31) % 30 // Large: 320-350
    } else if (isTablet) {
      if (tierCycle === 0) baseWidth = 170 + (idx * 13) % 20 // 170-190
      else if (tierCycle === 1) baseWidth = 200 + (idx * 17) % 20 // 200-220
      else baseWidth = 235 + (idx * 21) % 25 // 235-260
    } else {
      // Mobile: compact yet readable sizing, fits within narrow screen
      const maxMobileW = Math.min(155, Math.floor(canvasWidth * 0.40))
      if (tierCycle === 0) baseWidth = Math.min(115 + (idx * 7) % 12, maxMobileW)
      else if (tierCycle === 1) baseWidth = Math.min(128 + (idx * 9) % 12, maxMobileW)
      else baseWidth = Math.min(142 + (idx * 11) % 13, maxMobileW)
    }

    // Aspect ratio: determine natural or pleasing ratio (1.2 to 1.4)
    let aspectRatio = 1.3
    const img = item.querySelector("img")
    if (img && img.naturalWidth && img.naturalHeight) {
      aspectRatio = img.naturalWidth / img.naturalHeight
      aspectRatio = Math.max(0.75, Math.min(1.5, aspectRatio))
    } else {
      const ratios = [1.333, 1.25, 1.38, 1.18, 1.35]
      aspectRatio = ratios[idx % ratios.length]
    }

    const itemWidth = Math.round(baseWidth)
    const itemHeight = Math.round(baseWidth / aspectRatio)

    return {
      width: itemWidth,
      height: itemHeight,
      area: itemWidth * itemHeight
    }
  }

  findOptimalPlacements(photoSizes, minX, maxX, minY, maxY, exclusionZone, canvasWidth, canvasHeight, isMobile, isTablet) {
    const totalPhotos = photoSizes.length
    const placedBoxes = []
    const placedCenters = []
    const placements = []

    const wmCenterX = (exclusionZone.left + exclusionZone.right) / 2
    const wmCenterY = (exclusionZone.top + exclusionZone.bottom) / 2

    // 1. Define the 8 Major Framing Regions (Cardinal + Ordinal)
    const regions = {
      T: {
        key: "T", isCorner: false,
        minX: Math.max(minX, exclusionZone.left - 40),
        maxX: Math.min(maxX, exclusionZone.right + 40),
        minY: minY,
        maxY: Math.max(minY + 30, exclusionZone.top - 10)
      },
      B: {
        key: "B", isCorner: false,
        minX: Math.max(minX, exclusionZone.left - 40),
        maxX: Math.min(maxX, exclusionZone.right + 40),
        minY: Math.min(maxY - 30, exclusionZone.bottom + 10),
        maxY: maxY
      },
      L: {
        key: "L", isCorner: false,
        minX: minX,
        maxX: Math.max(minX + 30, exclusionZone.left - 10),
        minY: Math.max(minY, wmCenterY - 140),
        maxY: Math.min(maxY, wmCenterY + 140)
      },
      R: {
        key: "R", isCorner: false,
        minX: Math.min(maxX - 30, exclusionZone.right + 10),
        maxX: maxX,
        minY: Math.max(minY, wmCenterY - 140),
        maxY: Math.min(maxY, wmCenterY + 140)
      },
      TL: {
        key: "TL", isCorner: true,
        minX: minX,
        maxX: Math.max(minX + 40, wmCenterX - 20),
        minY: minY,
        maxY: Math.max(minY + 50, wmCenterY - 30)
      },
      TR: {
        key: "TR", isCorner: true,
        minX: Math.min(maxX - 40, wmCenterX + 20),
        maxX: maxX,
        minY: minY,
        maxY: Math.max(minY + 50, wmCenterY - 30)
      },
      BL: {
        key: "BL", isCorner: true,
        minX: minX,
        maxX: Math.max(minX + 40, wmCenterX - 20),
        minY: Math.min(maxY - 50, wmCenterY + 30),
        maxY: maxY
      },
      BR: {
        key: "BR", isCorner: true,
        minX: Math.min(maxX - 40, wmCenterX + 20),
        maxX: maxX,
        minY: Math.min(maxY - 50, wmCenterY + 30),
        maxY: maxY
      }
    }

    const regionCounts = { T: 0, B: 0, L: 0, R: 0, TL: 0, TR: 0, BL: 0, BR: 0 }

    // 2. Initialize Dynamic 2D Spatial Density Grid
    const gridCols = isMobile ? 4 : 6
    const gridRows = isMobile ? 6 : 5
    const cellW = (maxX - minX) / gridCols
    const cellH = (maxY - minY) / gridRows

    const densityGrid = []
    for (let r = 0; r < gridRows; r++) {
      densityGrid[r] = []
      for (let c = 0; c < gridCols; c++) {
        densityGrid[r][c] = {
          count: 0,
          occupiedArea: 0,
          minX: minX + c * cellW,
          maxX: minX + (c + 1) * cellW,
          minY: minY + r * cellH,
          maxY: minY + (r + 1) * cellH,
          centerX: minX + (c + 0.5) * cellW,
          centerY: minY + (r + 0.5) * cellH
        }
      }
    }

    // Helper: Determine which major region a box belongs to
    const getBoxRegion = (box) => {
      const bCenterX = (box.left + box.right) / 2
      const bCenterY = (box.top + box.bottom) / 2

      const isTop = bCenterY < wmCenterY - 30
      const isBottom = bCenterY > wmCenterY + 30
      const isLeft = bCenterX < wmCenterX - 30
      const isRight = bCenterX > wmCenterX + 30

      if (isTop && isLeft) return "TL"
      if (isTop && isRight) return "TR"
      if (isBottom && isLeft) return "BL"
      if (isBottom && isRight) return "BR"
      if (isTop) return "T"
      if (isBottom) return "B"
      if (isLeft) return "L"
      if (isRight) return "R"
      return bCenterX < wmCenterX ? "L" : "R"
    }

    // Helper: Query average density across touched grid cells
    const evaluateCellDensity = (box) => {
      let touched = 0
      let totalCount = 0
      let totalOccupancy = 0
      let maxCountInCell = 0

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const cell = densityGrid[r][c]
          const intArea = this.computeIntersectionArea(box, cell)
          if (intArea > 0) {
            touched++
            totalCount += cell.count
            totalOccupancy += (cell.occupiedArea / (cellW * cellH))
            if (cell.count > maxCountInCell) maxCountInCell = cell.count
          }
        }
      }

      return {
        avgCount: touched > 0 ? totalCount / touched : 0,
        avgOccupancy: touched > 0 ? totalOccupancy / touched : 0,
        maxCount: maxCountInCell
      }
    }

    // Helper: Update density grid with a newly placed box
    const recordPlacedBoxInGrid = (box) => {
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const cell = densityGrid[r][c]
          const intArea = this.computeIntersectionArea(box, cell)
          if (intArea > 0) {
            cell.count++
            cell.occupiedArea += intArea
          }
        }
      }
    }

    // Pass 1 target sequence for broad initial framing (cardinal first, then corners)
    const leftWidth = exclusionZone.left - minX
    const rightWidth = maxX - exclusionZone.right
    const hasRoomOnSides = leftWidth >= 160 && rightWidth >= 160

    const pass1Regions = hasRoomOnSides
      ? ["T", "B", "L", "R", "TL", "TR", "BL", "BR"]
      : ["T", "B", "TL", "TR", "BL", "BR"]
    const pass1TargetCount = Math.min(pass1Regions.length, totalPhotos)

    // 3. Two-Pass Placement Process
    photoSizes.forEach((size, i) => {
      const w = size.width
      const h = size.height
      const area = w * h
      const isPass1 = i < pass1TargetCount
      const minComfortRadius = isMobile ? (w * 0.68) : (w * 0.82)

      // Target region prioritization
      let prioritizedRegionKeys
      if (isPass1) {
        // In Pass 1, assign to the next underpopulated anchor region
        const targetKey = pass1Regions[i % pass1Regions.length]
        prioritizedRegionKeys = [targetKey, ...Object.keys(regions).filter(k => k !== targetKey)]
      } else {
        // In Pass 2, sort all regions by current photo count ascending (least populated first)
        prioritizedRegionKeys = Object.keys(regions).sort((a, b) => regionCounts[a] - regionCounts[b])
      }

      // Generate Candidate Points across regions with anti-clustering bias
      const candidatePoints = []

      prioritizedRegionKeys.forEach((regKey, rIdx) => {
        const reg = regions[regKey]
        if ((regKey === "L" || regKey === "R") && !hasRoomOnSides) return

        const sampleCount = isPass1 && rIdx === 0 ? 30 : Math.max(12, 28 - rIdx * 3)

        const rMinX = Math.max(minX, reg.minX)
        const rMaxX = Math.min(maxX - w, reg.maxX - w)
        const rMinY = Math.max(minY, reg.minY)
        const rMaxY = Math.min(maxY - h, reg.maxY - h)

        if (rMaxX >= rMinX && rMaxY >= rMinY) {
          for (let s = 0; s < sampleCount; s++) {
            const rx = rMinX + Math.random() * (rMaxX - rMinX)
            const ry = rMinY + Math.random() * (rMaxY - rMinY)
            candidatePoints.push({ x: rx, y: ry, preferredRegion: regKey })
          }
        }
      })

      // Add uniform global candidate points across the usable canvas
      for (let g = 0; g < 60; g++) {
        const gx = minX + Math.random() * Math.max(0, maxX - minX - w)
        const gy = minY + Math.random() * Math.max(0, maxY - minY - h)
        candidatePoints.push({ x: gx, y: gy, preferredRegion: null })
      }

      let bestCandidate = null
      let bestScore = -Infinity

      // Evaluate each candidate position with Global Composition Scoring
      candidatePoints.forEach((pt) => {
        const cand = {
          left: Math.round(pt.x),
          top: Math.round(pt.y),
          right: Math.round(pt.x + w),
          bottom: Math.round(pt.y + h),
          width: w,
          height: h,
          area: area
        }

        // Constraint A: Strict Usable Boundaries (HARD)
        if (cand.left < minX || cand.right > maxX || cand.top < minY || cand.bottom > maxY) {
          return
        }

        // Constraint B: Strict Watermark Exclusion Zone (HARD: 100% unobstructed)
        if (this.rectsIntersect(cand, exclusionZone)) {
          return
        }

        const candCenterX = (cand.left + cand.right) / 2
        const candCenterY = (cand.top + cand.bottom) / 2

        // Constraint C: Center-to-Center Distance & Local Proximity
        let minDistToCenter = Infinity
        let nearbyCount = 0

        for (let p = 0; p < placedBoxes.length; p++) {
          const pc = placedCenters[p]
          const dist = Math.hypot(candCenterX - pc.x, candCenterY - pc.y)
          if (dist < minDistToCenter) minDistToCenter = dist

          if (dist < minComfortRadius) {
            nearbyCount++
          }
        }

        // Hard rejection: centers right on top of each other
        if (placedBoxes.length > 0 && minDistToCenter < minComfortRadius * 0.40) {
          return
        }

        // Constraint D: Rectangle Overlap Evaluation
        let totalOverlapArea = 0
        let maxSingleOverlapRatio = 0

        for (let p = 0; p < placedBoxes.length; p++) {
          const placed = placedBoxes[p]
          const overlap = this.computeIntersectionArea(cand, placed)
          if (overlap > 0) {
            totalOverlapArea += overlap
            const ratio = overlap / Math.min(area, placed.area)
            if (ratio > maxSingleOverlapRatio) {
              maxSingleOverlapRatio = ratio
            }
          }
        }

        const overlapRatio = totalOverlapArea / area

        // In Pass 1, strictly require zero overlap to establish clean global anchors
        if (isPass1 && totalOverlapArea > 0) {
          return
        }

        // Hard rejection: excessive single overlap (> 38%)
        if (maxSingleOverlapRatio > 0.38) {
          return
        }

        // --- GLOBAL COMPOSITION SCORE CALCULATION ---
        let score = 6000

        // 1. Regional Density Balance Score
        const candRegionKey = getBoxRegion(cand)
        const regionCount = regionCounts[candRegionKey] || 0
        const minRegCount = Math.min(...Object.values(regionCounts))
        const maxRegCount = Math.max(...Object.values(regionCounts))

        // Bonus for under-populated regions; penalty for over-populated regions
        score += (maxRegCount - regionCount) * 2000
        score -= (regionCount - minRegCount) * 1600

        // 2. Anti-Corner-Magnet Protection
        const isCornerRegion = regions[candRegionKey]?.isCorner || false
        if (isCornerRegion) {
          if (regionCount >= 1) {
            score -= (regionCount * 2200)
          }
          const avgCardinal = (regionCounts.T + regionCounts.B + regionCounts.L + regionCounts.R) / 4
          if (regionCount > avgCardinal) {
            score -= 1800
          }
        } else {
          score += 800
        }

        // 3. Dynamic Spatial Density Grid Score
        const densityData = evaluateCellDensity(cand)
        score -= (densityData.avgCount * 1100)
        score -= (densityData.avgOccupancy * 1600)
        if (densityData.maxCount >= 2) {
          score -= 1400 * (densityData.maxCount - 1)
        }

        // 4. Center-to-Center Distance Score (Push away from existing photo centers)
        if (placedBoxes.length > 0) {
          score += Math.min(minDistToCenter, 350) * 4.0
        }

        // 5. Local Proximity Penalty
        if (nearbyCount === 0) {
          score += 1500
        } else if (nearbyCount === 1) {
          score += 400
        } else {
          score -= (nearbyCount - 1) * 2200
        }

        // 6. Controlled Organic Overlap Score
        if (!isPass1) {
          if (totalOverlapArea === 0) {
            score += 1200
          } else if (maxSingleOverlapRatio <= 0.20) {
            score += 600 - (overlapRatio * 900)
          } else {
            score -= (maxSingleOverlapRatio - 0.20) * 8000 + (overlapRatio * 3500)
          }
        }

        // 7. Balanced Margin & Framing Bonus
        const distBorderX = Math.min(cand.left - minX, maxX - cand.right)
        const distBorderY = Math.min(cand.top - minY, maxY - cand.bottom)
        score += Math.min(distBorderX, 24) + Math.min(distBorderY, 24)

        // 8. Controlled Subtle Jitter
        score += Math.random() * 40

        if (score > bestScore) {
          bestScore = score
          bestCandidate = { ...cand, regionKey: candRegionKey }
        }
      })

      // Fallback: If no candidate passed all constraints, run a spatially-aware grid sweep
      if (!bestCandidate || bestScore <= -10000) {
        bestCandidate = this.fallbackPositionSearch(
          w, h, area, minX, maxX, minY, maxY,
          exclusionZone, placedBoxes, placedCenters,
          densityGrid, regionCounts, regions, gridRows, gridCols, cellW, cellH
        )
      }

      // Record Placed Box
      placedBoxes.push(bestCandidate)
      const finalCenterX = (bestCandidate.left + bestCandidate.right) / 2
      const finalCenterY = (bestCandidate.top + bestCandidate.bottom) / 2
      placedCenters.push({ x: finalCenterX, y: finalCenterY })

      // Update Density Grid & Region Tracking
      recordPlacedBoxInGrid(bestCandidate)
      const finalRegion = bestCandidate.regionKey || getBoxRegion(bestCandidate)
      if (regionCounts[finalRegion] !== undefined) {
        regionCounts[finalRegion]++
      }

      // Subtle Organic Rotation (range: -5.5° to +5.5°)
      const baseRotation = (i % 2 === 0 ? 1 : -1) * (1.6 + ((i * 2.1) % 3.6))
      const jitterRotation = (Math.random() * 1.6 - 0.8)
      const rotation = parseFloat((baseRotation + jitterRotation).toFixed(2))

      placements.push({
        x: Math.round(bestCandidate.left),
        y: Math.round(bestCandidate.top),
        rotation: rotation,
        zIndex: 15 + i
      })
    })

    return placements
  }

  fallbackPositionSearch(
    w, h, area, minX, maxX, minY, maxY,
    exclusionZone, placedBoxes, placedCenters,
    densityGrid, regionCounts, regions, gridRows, gridCols, cellW, cellH
  ) {
    const stepX = 16
    const stepY = 16
    let bestPoint = null
    let bestScore = -Infinity

    for (let y = minY; y <= maxY - h; y += stepY) {
      for (let x = minX; x <= maxX - w; x += stepX) {
        const testRect = {
          left: x,
          top: y,
          right: x + w,
          bottom: y + h,
          width: w,
          height: h,
          area: area
        }

        // Must strictly NEVER intersect exclusion zone
        if (!this.rectsIntersect(testRect, exclusionZone)) {
          let overlap = 0
          let maxSingle = 0
          for (let p = 0; p < placedBoxes.length; p++) {
            const intArea = this.computeIntersectionArea(testRect, placedBoxes[p])
            overlap += intArea
            const ratio = intArea / Math.min(area, placedBoxes[p].area)
            if (ratio > maxSingle) maxSingle = ratio
          }

          const centerX = x + w / 2
          const centerY = y + h / 2
          let minDist = Infinity
          for (let p = 0; p < placedCenters.length; p++) {
            const d = Math.hypot(centerX - placedCenters[p].x, centerY - placedCenters[p].y)
            if (d < minDist) minDist = d
          }

          // Evaluate score for fallback
          const score = (minDist * 3) - (overlap / area) * 4000 - (maxSingle * 5000)
          if (score > bestScore) {
            bestScore = score
            bestPoint = testRect
          }
        }
      }
    }

    if (!bestPoint) {
      // Emergency safe coordinate (safely above or below exclusion zone)
      const safeY = exclusionZone.bottom + 20 <= maxY - h ? exclusionZone.bottom + 20 : Math.max(minY, exclusionZone.top - h - 20)
      bestPoint = { left: minX, top: safeY, right: minX + w, bottom: safeY + h, width: w, height: h, area: area }
    }

    return bestPoint
  }

  rectsIntersect(r1, r2) {
    return !(
      r1.right <= r2.left ||
      r1.left >= r2.right ||
      r1.bottom <= r2.top ||
      r1.top >= r2.bottom
    )
  }

  computeIntersectionArea(r1, r2) {
    const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left))
    const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top))
    return xOverlap * yOverlap
  }

  setupDraggables() {
    if (this.draggables && this.draggables.length > 0) {
      this.draggables.forEach((d) => d.kill())
      this.draggables = []
    }

    const controller = this

    this.draggables = Draggable.create(this.itemTargets, {
      type: "x,y",
      edgeResistance: 0.85,
      cursor: "grab",
      activeCursor: "grabbing",
      cancel: ".resize-handle",
      onPress() {
        controller.highestZ = Math.max(controller.highestZ + 1, 30)
        this.target.style.zIndex = controller.highestZ
        gsap.to(this.target, { scale: 1.03, duration: 0.18, ease: "power1.out" })
        this.target.classList.add("shadow-2xl")
        controller.applyCustomBounds(this)
      },
      onRelease() {
        gsap.to(this.target, { scale: 1, duration: 0.22, ease: "power1.out" })
        this.target.classList.remove("shadow-2xl")
      }
    })

    this.refreshAllBounds()
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

    this.highestZ = Math.max(this.highestZ + 1, 30)
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

      const canvas = this.hasCanvasTarget ? this.canvasTarget : this.element
      const maxW = Math.max(90, (canvas.clientWidth || window.innerWidth) - 24)

      const newWidth = Math.max(90, Math.min(maxW, Math.round(startWidth + delta)))
      const newHeight = Math.round(newWidth / aspectRatio)

      item.style.width = `${newWidth}px`
      item.style.height = `${newHeight}px`
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
    const container = this.hasCanvasTarget ? this.canvasTarget : this.element

    const width = el.offsetWidth || parseFloat(el.style.width) || 200
    const height = el.offsetHeight || parseFloat(el.style.height) || 150

    const containerW = container.clientWidth || window.innerWidth
    const containerH = container.clientHeight || window.innerHeight

    // Allow each photo to extend beyond the screen edge, but no more than 80% of the photo itself outside the viewport
    // (i.e. at least 20% of the photo width/height remains visible inside the viewport)
    const minX = Math.round(-0.80 * width)
    const maxX = Math.round(containerW - 0.20 * width)
    const minY = Math.round(-0.80 * height)
    const maxY = Math.round(containerH - 0.20 * height)

    draggable.applyBounds({
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY
    })
  }
}

