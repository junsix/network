// net·viz common runtime
// - Top nav active state
// - Mouse-tracking spotlight on .card.spot
// - IntersectionObserver-driven entrance reveals (.reveal, .reveal.stagger)
// - Subtle hero parallax (fade + scale + y) on scroll
// - NetViz.flyPacket(): packet animation primitive used by every page

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Active nav highlight ----------
  function applyActiveNav() {
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".topnav nav a").forEach((a) => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const target = href.split("/").pop();
      if (target === path) a.classList.add("active");
    });
  }

  // ---------- Mouse-tracking spotlight ----------
  function bindSpotlights() {
    document.querySelectorAll(".card.spot").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  // ---------- Reveal on scroll ----------
  function bindReveal() {
    if (reduceMotion) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    // Assign --i for staggered children to drive transition-delay
    document.querySelectorAll(".reveal.stagger").forEach((wrap) => {
      Array.from(wrap.children).forEach((child, i) => {
        child.style.setProperty("--i", i);
      });
    });

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
  }

  // ---------- Hero parallax ----------
  function bindHeroParallax() {
    if (reduceMotion) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    let ticking = false;
    function update() {
      const y = window.scrollY;
      // Subtle: fades over first ~500px, scales 1 → 0.97, y shift up to 80px
      const fadeMax = 500;
      const opacity = Math.max(0, 1 - y / fadeMax);
      const scale = Math.max(0.97, 1 - y / 4000);
      const translate = Math.min(80, y * 0.18);
      hero.style.transform = `translate3d(0, ${translate}px, 0) scale(${scale})`;
      hero.style.opacity = String(opacity);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  // ---------- Packet animation primitive ----------
  // Public API. Flies a chip across a `.lane` element.
  //   opts: { label, cls, duration, from: 'left'|'right', delay }
  function flyPacket(lane, opts) {
    const o = Object.assign(
      { label: "PKT", cls: "data", duration: 1200, from: "left", delay: 0 },
      opts || {}
    );
    return new Promise((resolve) => {
      const start = () => {
        const pkt = document.createElement("div");
        pkt.className = "pkt " + o.cls;
        pkt.textContent = o.label;
        // Initial position
        if (o.from === "left") {
          pkt.style.left = "16px";
          pkt.style.transform = "translate(0px, -50%)";
        } else {
          pkt.style.right = "16px";
          pkt.style.transform = "translate(0px, -50%)";
        }
        lane.appendChild(pkt);

        const laneWidth = lane.clientWidth;
        const pktWidth = pkt.offsetWidth;
        const offset = Math.max(40, laneWidth - pktWidth - 32);
        const dur = reduceMotion ? 0 : o.duration;

        requestAnimationFrame(() => {
          pkt.style.transition =
            "transform " + dur + "ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out";
          const dx = o.from === "left" ? offset : -offset;
          pkt.style.transform = `translate(${dx}px, -50%)`;
        });

        setTimeout(() => {
          pkt.style.opacity = "0";
          setTimeout(() => pkt.remove(), 280);
          resolve();
        }, dur);
      };

      if (o.delay > 0 && !reduceMotion) {
        setTimeout(start, o.delay);
      } else {
        start();
      }
    });
  }

  // Convenience: run a sequence of async step functions
  async function runSequence(steps) {
    for (const step of steps) await step();
  }

  // ---------- Boot ----------
  function boot() {
    applyActiveNav();
    bindSpotlights();
    bindReveal();
    bindHeroParallax();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.NetViz = window.NetViz || {};
  window.NetViz.flyPacket = flyPacket;
  window.NetViz.runSequence = runSequence;
})();
