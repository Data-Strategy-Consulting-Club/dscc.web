import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

// Connects to data-controller="t-reals"
export default class extends Controller {
  connect() {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 2,
      normalizeScroll: true,
      ignoreMobileResize: true,
      preventDefault: true
    });

    //Horizontal Scroll Galleries
    if (document.getElementById("portfolio")) {
      const horizontalSections = gsap.utils.toArray(".horiz-gallery-wrapper");

      horizontalSections.forEach(function (sec, i) {
        const pinWrap = sec.querySelector(".horiz-gallery-strip");

        let pinWrapWidth;
        let horizontalScrollLength;

        function refresh() {
          pinWrapWidth = pinWrap.scrollWidth;
          horizontalScrollLength = pinWrapWidth - window.innerWidth;
        }

        refresh();
        // Pinning and horizontal scrolling
        gsap.to(pinWrap, {
          scrollTrigger: {
            scrub: true,
            trigger: sec,
            pin: sec,
            start: "center center",
            end: () => `+=${pinWrapWidth}`,
            invalidateOnRefresh: true
          },
          x: () => -horizontalScrollLength,
          ease: "none"
        });

        ScrollTrigger.addEventListener("refreshInit", refresh);
      });
    }
  }
}
