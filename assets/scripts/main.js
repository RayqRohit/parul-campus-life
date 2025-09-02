document.addEventListener('DOMContentLoaded', function () {
  const statsCards = document.querySelectorAll('.pu-stat-item');
  const campusImage = document.querySelector('#campusImage img');
  const defaultImage = './assets/images/campus-1.jpg';
  const defaultAlt = 'Green campus areas and gardens';

  // Optimized image preloading with lazy loading
  const imageCache = new Map();

  // Preload only the first few hover images
  statsCards.forEach((card, index) => {
    const hoverImage = card.dataset.image;
    if (hoverImage && index < 2) { // Only preload first 2 images
      const img = new Image();
      img.src = hoverImage;
      imageCache.set(hoverImage, img);
    }
  });

  // Debounced image switching
  let imageChangeTimeout;
  function debounceImageChange(imageSrc, imageAlt, delay = 50) {
    clearTimeout(imageChangeTimeout);
    imageChangeTimeout = setTimeout(() => {
      campusImage.src = imageSrc;
      campusImage.alt = imageAlt;
      campusImage.style.opacity = '0.3';
      setTimeout(() => {
        campusImage.style.opacity = '1';
      }, 50);
    }, delay);
  }

  statsCards.forEach(card => {
    const hoverImage = card.dataset.image;
    const hoverAlt = card.dataset.alt;

    if (hoverImage) {
      card.addEventListener('mouseenter', function () {
        // Lazy load image if not cached
        if (!imageCache.has(hoverImage)) {
          const img = new Image();
          img.src = hoverImage;
          imageCache.set(hoverImage, img);
        }
        debounceImageChange(hoverImage, hoverAlt);
      });

      card.addEventListener('mouseleave', function () {
        debounceImageChange(defaultImage, defaultAlt);
      });
    }
  });
});



// Virtual Tour Slider JavaScript - Optimized
// campus slider: drag + trackpad only, center only first image on load
/* Campus slider: drag + trackpad + smooth autoplay (infinite loop) - Performance Optimized */
(() => {
  const slider = document.getElementById('campusSlider');        // .slider-wrapper
  if (!slider) return;
  const track = slider.querySelector('.slider-track');
  if (!track) return;

  /* ===== Controls (override via data-speed / data-pause) ===== */
  const SPEED_DEFAULT = 40;   // px per second (reduced for performance)
  const PAUSE_DEFAULT = 1500;  // ms resume delay after drag (increased)

  const SPEED = Number(slider.dataset.speed) || SPEED_DEFAULT;
  const PAUSE_MS = Number(slider.dataset.pause) || PAUSE_DEFAULT;

  let loopWidth = 0;
  let rafId = null, lastTs = 0;
  let autoplay = true;
  let isVisible = true; // Track visibility for performance

  /* build seamless loop */
  const originals = Array.from(track.children);
  if (originals.length) originals.forEach(n => track.appendChild(n.cloneNode(true)));

  function imagesReady() {
    const imgs = track.querySelectorAll('img');
    return Promise.all(Array.from(imgs).map(img =>
      img.complete ? Promise.resolve() : new Promise(r => img.addEventListener('load', r, { once: true }))
    ));
  }

  function recalc() { loopWidth = track.scrollWidth / 2; }

  /* Optimized RAF loop with visibility check */
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(50, ts - lastTs);
    lastTs = ts;

    // Only animate if visible and autoplay is enabled
    if (autoplay && isVisible) {
      slider.scrollLeft += (SPEED * dt / 1000);
      if (slider.scrollLeft >= loopWidth) slider.scrollLeft -= loopWidth;
    }
    rafId = requestAnimationFrame(tick);
  }

  const start = () => { if (rafId == null) rafId = requestAnimationFrame(tick); };
  const stop = () => { if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; } };

  /* pause helper (only used after drag) */
  const pause = (() => {
    let t;
    return (ms = PAUSE_MS) => {
      autoplay = false;
      clearTimeout(t);
      t = setTimeout(() => { autoplay = true; }, ms);
    };
  })();

  /* drag to scroll (mouse / touch / pen) - Optimized */
  let isDown = false, startX = 0, startScroll = 0;

  slider.addEventListener('pointerdown', (e) => {
    isDown = true;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
    slider.classList.add('dragging');
    slider.setPointerCapture(e.pointerId);
    autoplay = false;           // pause while user is dragging
    e.preventDefault();         // helps cursor + avoids text selection
  });

  slider.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    slider.scrollLeft = startScroll - (e.clientX - startX);
    e.preventDefault();         // keeps drag smooth on some browsers
  });

  const endDrag = (e) => {
    if (!isDown) return;
    isDown = false;
    slider.classList.remove('dragging');
    try { slider.releasePointerCapture(e.pointerId); } catch { }
    pause();                    // resume after a short delay
  };

  slider.addEventListener('pointerup', endDrag);
  slider.addEventListener('pointercancel', endDrag);
  slider.addEventListener('mouseleave', () => { if (isDown) endDrag({}); });

  /* Intersection Observer for performance optimization */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (!isVisible) {
        autoplay = false; // Pause when not visible
      } else if (!isDown) {
        autoplay = true; // Resume when visible (unless dragging)
      }
    });
  }, { threshold: 0.1 });

  observer.observe(slider);

  /* respect reduced motion only if you want — comment the next 3 lines to always autoplay */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) autoplay = false;
  mq.addEventListener?.('change', e => { autoplay = !e.matches; });

  /* pause loop when tab hidden; resume on return */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
      isVisible = false;
    } else {
      lastTs = 0;
      start();
      isVisible = true;
    }
  });

  /* init with debounced resize */
  imagesReady().then(() => {
    recalc();
    slider.scrollLeft = 0;
    start();

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const pos = loopWidth ? (slider.scrollLeft % loopWidth) : 0;
        recalc();
        slider.scrollLeft = pos;
      }, 200); // Increased debounce time
    });
  });
})();


// Auto-scroll enhancement for Virtual Tour (campusSlider)
// This adds automatic scrolling to the existing slider functionality
(() => {
  const slider = document.getElementById('campusSlider');
  if (!slider) return;

  let autoScrolling = true;
  const scrollSpeed = 0.5; // pixels per frame (adjust for speed)

  function autoScroll() {
    if (autoScrolling) {
      slider.scrollLeft += scrollSpeed;

      // Reset to beginning when reaching the end for infinite loop
      if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth) {
        slider.scrollLeft = 0;
      }
    }
    requestAnimationFrame(autoScroll);
  }

  // Start auto-scrolling when page loads
  window.addEventListener('load', () => {
    setTimeout(() => {
      autoScroll();
    }, 1000); // Start after 1 second delay
  });
})();





// accordion functionality
document.addEventListener('DOMContentLoaded', () => {
  const items = Array.from(document.querySelectorAll('.faq-item'));

  // init: open items use natural height
  items.forEach(setInitialHeight);

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // close all
      items.forEach(closeItem);

      // open clicked if it wasn't already open
      if (!isOpen) openItem(item);
    });

    // keyboard arrows to move focus
    btn.addEventListener('keydown', (e) => {
      if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      const next = items[(items.indexOf(item) + dir + items.length) % items.length]
        .querySelector('.faq-question');
      next.focus();
    });
  });

  function openItem(item) {
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');

    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');

    // set to content height so it can animate open
    panel.style.maxHeight = panel.scrollHeight + 'px';

    // after the transition, let it be auto-sized
    const onEnd = (ev) => {
      if (ev.propertyName !== 'max-height') return;
      panel.style.maxHeight = 'none';
      panel.removeEventListener('transitionend', onEnd);
    };
    panel.addEventListener('transitionend', onEnd);
  }

  function closeItem(item) {
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');

    if (!item.classList.contains('open')) return;

    // if it's 'auto' (none), lock to current height first so we can animate
    if (getComputedStyle(panel).maxHeight === 'none') {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      // force reflow so the next change animates
      // eslint-disable-next-line no-unused-expressions
      panel.offsetHeight;
    }

    item.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';
  }

  function setInitialHeight(item) {
    const panel = item.querySelector('.faq-answer');
    if (item.classList.contains('open')) {
      // allow natural height from the start for default-open item
      panel.style.maxHeight = 'none';
    } else {
      panel.style.maxHeight = '0';
    }
  }

  // if layout changes (fonts swap, window resize), open panels keep auto height
  // nothing needed here; but if you dynamically inject content and want a
  // quick re-measure during animation, you can re-run openItem on the open one.
});



// back to top button

(() => {
  const btn = document.getElementById('pu-backtop');
  if (!btn) return;

  const SHOW_AT = 250; // px scrolled before showing the button
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (window.scrollY > SHOW_AT) btn.classList.add('show');
      else btn.classList.remove('show');
      ticking = false;
    });
  }

  // smooth scroll to top (respects reduced motion)
  btn.addEventListener('click', () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();



// navbar hiding - Optimized
document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.querySelector('.pu-topbar');
  const virtualTour = document.querySelector('.pu-virtual-tour'); // Must match the Virtual Tour section only

  if (!navbar || !virtualTour) return;

  // Throttle the observer callback for better performance
  let ticking = false;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        if (entry.isIntersecting) {
          navbar.classList.add('hidden-nav');   // Hide navbar
        } else {
          navbar.classList.remove('hidden-nav'); // Show navbar
        }
        ticking = false;
      });
    },
    {
      root: null,
      threshold: 0.1, // Increased threshold for better performance
      rootMargin: '0px 0px -10% 0px' // Add margin for smoother transitions
    }
  );

  observer.observe(virtualTour);
});


// pillars code

(() => {
  const root = document.querySelector('.pu-coverflow');
  const deck = root.querySelector('.cf-deck');
  const allCards = [...deck.querySelectorAll('.cf-card')];
  const prevB = root.querySelector('.cf-prev');
  const nextB = root.querySelector('.cf-next');

  // Tabs
  const tabs = document.querySelectorAll('.pu-pillar-tabs .chip');
  let currentFilter =
    document.querySelector('.pu-pillar-tabs .chip.active')?.dataset.filter || 'community';

  // Center start
  let active = 0;

  /* --- helpers --- */
  const visibleCards = () => allCards.filter(c => c.dataset.cat === currentFilter);

  function updateTabs() {
    tabs.forEach(btn => {
      const isActive = btn.dataset.filter === currentFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  /* --- layout (coverflow + dynamic height) --- */
  function layout() {
    const space = 100;   // horizontal spacing
    const tilt = -18;   // deg per step
    const shrink = 0.08;  // width scale/step
    const blurP = 0.5;   // px blur/step
    const shadeP = 0.18;  // overlay/step

    // height behaviour (center tallest)
    const deckH = deck.clientHeight;
    const dropPerStep = 0.14;  // more = sides shorter
    const minRatio = 0.65;  // min edge height (0..1)

    // show only current category
    const list = visibleCards();
    const n = list.length;
    allCards.forEach(c => { c.style.display = (c.dataset.cat === currentFilter) ? 'block' : 'none'; });

    // safety: if no slides for a filter, bail
    if (!n) return;

    // circular coverflow math
    list.forEach((card, i) => {
      let d = i - active;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;

      const a = Math.abs(d);

      card.style.setProperty('--x', `${d * space}px`);
      card.style.setProperty('--ry', `${d * tilt}deg`);
      card.style.setProperty('--scale', `${Math.max(0.72, 1 - a * shrink)}`);
      card.style.setProperty('--z', `${50 - a}`);
      card.style.setProperty('--blur', `${a * blurP}px`);
      card.style.setProperty('--dim', `${1 - Math.min(a * 0.12, 0.55)}`);
      card.style.setProperty('--shade', `${Math.min(a * shadeP, .65)}`);

      // height from center (if you don't want this, remove these 2 lines)
      const ratio = Math.max(1 - a * dropPerStep, minRatio);
      card.style.setProperty('--card-h', `${deckH * ratio}px`);

      card.classList.toggle('is-center', d === 0);
      card.setAttribute('aria-hidden', d !== 0);
    });
  }

  /* --- controls --- */
  function prev() { const n = visibleCards().length; active = (active - 1 + n) % n; layout(); }
  function next() { const n = visibleCards().length; active = (active + 1) % n; layout(); }

  prevB.addEventListener('click', prev);
  nextB.addEventListener('click', next);

  deck.addEventListener('click', (e) => {
    const card = e.target.closest('.cf-card'); if (!card) return;
    const list = visibleCards(); const idx = list.indexOf(card);
    if (idx >= 0) { active = idx; layout(); }
  });

  // Tabs -> filter change
  tabs.forEach(btn => btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    updateTabs();
    active = Math.floor(visibleCards().length / 2);
    layout();
  }));

  // keyboard + resize
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); });
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120); });

  // init
  updateTabs();
  active = Math.floor(visibleCards().length / 2);
  layout();
})();


