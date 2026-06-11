import { Controller } from "@hotwired/stimulus"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollSmoother } from "gsap/ScrollSmoother"

// Connects to data-controller="t-reals"
export default class extends Controller {
  connect() {
    console.log(ScrollTrigger)
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

      horizontalSections.forEach(function (sec) {
        const pinWraps = sec.querySelectorAll(".horiz-gallery-strip");

        pinWraps.forEach(function(pinWrap, j) {
          const direction = j % 2 === 0 ? -1 : 1;
          const scrollLength = pinWrap.scrollWidth - window.innerWidth;

          if (direction === -1) {
            gsap.to(pinWrap, {
              scrollTrigger: {
                scrub: true,
                trigger: sec,
                pin: j === 0 ? sec : false,
                markers: true,
                start: "center center",
                end: () => `+=${pinWrap.scrollWidth}`,
                invalidateOnRefresh: true
              },
              x: () => -scrollLength,
              ease: "none"
            });
          } else {
            gsap.fromTo(pinWrap,
              { x: () => -scrollLength },
              {
                scrollTrigger: {
                  scrub: true,
                  trigger: sec,
                  pin: false,
                  markers: true,
                  start: "center center",
                  end: () => `+=${pinWrap.scrollWidth}`,
                  invalidateOnRefresh: true
                },
                x: 0,
                ease: "none"
              }
            );
          }
        });
      });
    }
  }
}
