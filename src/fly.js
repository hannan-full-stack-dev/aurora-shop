// "Fly to cart" animation: clones the product image and arcs it into the cart icon.

function bump(el) {
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth; // restart the animation
  el.classList.add('bump');
}

export function flyToCart(source) {
  const target = document.querySelector('[data-cart-target]');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!source || !target || reduce || !source.getBoundingClientRect) {
    bump(target);
    return;
  }

  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  if (!s.width || !s.height) {
    bump(target);
    return;
  }

  const clone = document.createElement('img');
  clone.src = source.currentSrc || source.src;
  clone.alt = '';
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${s.left}px`,
    top: `${s.top}px`,
    width: `${s.width}px`,
    height: `${s.height}px`,
    objectFit: 'contain',
    zIndex: '200',
    pointerEvents: 'none',
    borderRadius: '18px',
    filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.25))',
  });
  document.body.appendChild(clone);

  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);

  const anim = clone.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(0.55) rotate(120deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.06) rotate(300deg)`, opacity: 0.5 },
    ],
    { duration: 850, easing: 'cubic-bezier(.5,0,.25,1)' }
  );
  const done = () => {
    clone.remove();
    bump(target);
  };
  anim.onfinish = done;
  anim.oncancel = done;
}
