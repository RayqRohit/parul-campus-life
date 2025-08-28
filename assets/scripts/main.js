document.addEventListener('DOMContentLoaded', function () {
  const statsCards = document.querySelectorAll('.pu-stat-item');
  const campusImage = document.querySelector('#campusImage img');
  const defaultImage = './assets/images/campus-1.png'; // Your default image
  const defaultAlt = 'Beautiful green campus with walkways and trees';

  // Preload images for smooth transitions
  const preloadImages = [];

  statsCards.forEach(card => {
    const imageSrc = card.dataset.image;
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      preloadImages.push(img);
    }
  });

  // Add hover event listeners
  statsCards.forEach(card => {
    const hoverImage = card.dataset.image;
    const hoverAlt = card.dataset.alt;

    if (hoverImage) {
      // Mouse enter event
      card.addEventListener('mouseenter', function () {
        campusImage.style.opacity = '0';

        setTimeout(() => {
          campusImage.src = hoverImage;
          campusImage.alt = hoverAlt;
          campusImage.style.opacity = '1';
        }, 200); // Half of the transition time
      });

      // Mouse leave event
      card.addEventListener('mouseleave', function () {
        campusImage.style.opacity = '0';

        setTimeout(() => {
          campusImage.src = defaultImage;
          campusImage.alt = defaultAlt;
          campusImage.style.opacity = '1';
        }, 200);
      });
    }
  });
});


// slider functionality

// Virtual Tour Slider JavaScript
// campus slider: drag + trackpad only, center only first image on load
/* Campus slider: drag + trackpad + smooth autoplay (infinite loop) */
(() => {
  const slider = document.getElementById('campusSlider');        // .slider-wrapper
  if (!slider) return;
  const track = slider.querySelector('.slider-track');
  if (!track) return;

  /* ===== Controls (override via data-speed / data-pause) ===== */
  const SPEED_DEFAULT = 60;   // px per second (faster)
  const PAUSE_DEFAULT = 1200;  // ms resume delay after drag

  const SPEED = Number(slider.dataset.speed) || SPEED_DEFAULT;
  const PAUSE_MS = Number(slider.dataset.pause) || PAUSE_DEFAULT;

  let loopWidth = 0;
  let rafId = null, lastTs = 0;
  let autoplay = true;

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

  /* RAF loop (never stops unless tab hidden) */
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(50, ts - lastTs);
    lastTs = ts;

    if (autoplay) {
      slider.scrollLeft += (SPEED * dt / 1000);
      if (slider.scrollLeft >= loopWidth) slider.scrollLeft -= loopWidth;
    }
    rafId = requestAnimationFrame(tick);
  }
  // const start = () => { if (rafId == null) rafId = requestAnimationFrame(tick); };
  // const stop = () => { if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; } };

  /* pause helper (only used after drag) */
  const pause = (() => {
    let t;
    return (ms = PAUSE_MS) => {
      autoplay = false;
      clearTimeout(t);
      t = setTimeout(() => { autoplay = true; }, ms);
    };
  })();

  /* drag to scroll (mouse / touch / pen) */
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

  /* NO hover/wheel pause anymore */
  // (removed mouseenter/mouseleave/wheel listeners)

  /* respect reduced motion only if you want — comment the next 3 lines to always autoplay */
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) autoplay = false;
  mq.addEventListener?.('change', e => { autoplay = !e.matches; });

  /* pause loop when tab hidden; resume on return */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else { lastTs = 0; start(); }
  });

  /* init */
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
      }, 160);
    });
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