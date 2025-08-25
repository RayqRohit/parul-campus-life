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
const slider = document.getElementById('campusSlider'); // .slider-wrapper
if (!slider) console.warn('#campusSlider not found');

const firstSlide = slider?.querySelector('.slide');

let isDown = false;
let startX = 0;
let startScroll = 0;
let movedDuringDrag = false;
let userMovedAway = false;      // once true, stop re-centering on resize
let suppressMark = false;       // ignore scroll events triggered by our own centering

/* ---------- helpers ---------- */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function targetLeftFor(el) {
    const center = el.offsetLeft + el.offsetWidth / 2;
    return clamp(center - slider.clientWidth / 2, 0, slider.scrollWidth - slider.clientWidth);
}

function nearFirst(threshold = 6) {
    const t = targetLeftFor(firstSlide);
    return Math.abs(slider.scrollLeft - t) <= threshold;
}

function centerFirstSlide() {
    if (!slider || !firstSlide) return;

    // wait until layout/image is ready
    if (firstSlide.offsetWidth === 0) {
        requestAnimationFrame(centerFirstSlide);
        return;
    }

    suppressMark = true;
    slider.scrollLeft = targetLeftFor(firstSlide);
    setTimeout(() => (suppressMark = false), 60);
}

/* ---------- center first on load; resize only until user scrolls ---------- */
window.addEventListener('load', centerFirstSlide);

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!userMovedAway || nearFirst()) centerFirstSlide();
    }, 120);
});

/* ---------- mark when user moved away (trackpad or drag) ---------- */
slider.addEventListener('scroll', () => {
    if (!suppressMark && !nearFirst()) userMovedAway = true;
});

/* ---------- drag to scroll (mouse / pen / touch) ---------- */
slider.addEventListener('pointerdown', (e) => {
    isDown = true;
    movedDuringDrag = false;
    startX = e.clientX;
    startScroll = slider.scrollLeft;
    slider.classList.add('dragging');
    slider.setPointerCapture(e.pointerId);
});

slider.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 0) movedDuringDrag = true;
    slider.scrollLeft = startScroll - dx;
});

function endDrag(e) {
    if (!isDown) return;
    isDown = false;
    slider.classList.remove('dragging');
    try { slider.releasePointerCapture?.(e.pointerId); } catch { }
    if (movedDuringDrag) userMovedAway = true;
}
slider.addEventListener('pointerup', endDrag);
slider.addEventListener('pointercancel', endDrag);
slider.addEventListener('mouseleave', () => {
    if (isDown) { isDown = false; slider.classList.remove('dragging'); }
});

/* prevent ghost image drag */
slider.addEventListener('dragstart', (e) => e.preventDefault());




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
