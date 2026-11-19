import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import useInView from '../hooks/useInView';
import useTilt from '../hooks/useTilt';
import Rating from './Rating';
import { formatPrice, prettyCategory, onImgError } from '../utils';

export default function ProductCard({ product: p, index = 0 }) {
  const { addToCart, toggleWishlist, isWished } = useStore();
  const [viewRef, inView] = useInView({ threshold: 0.1 });
  const tilt = useTilt(6);
  const imgRef = useRef(null);
  const [pop, setPop] = useState(false);

  const wished = isWished(p.id);
  const soldOut = p.stock <= 0;
  const discount = Math.round(p.discountPercentage || 0);
  const href = `/product/${p.id}`;

  const onWish = () => {
    toggleWishlist(p);
    if (!wished) {
      setPop(true);
      setTimeout(() => setPop(false), 700);
    }
  };

  return (
    <div
      ref={viewRef}
      className={`card-wrap reveal reveal-up ${inView ? 'in' : ''}`}
      style={{ '--d': `${(index % 4) * 80}ms` }}
    >
      <article
        className="card"
        data-dept={p.dept}
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
      >
        <div className="card-media">
          <Link to={href} aria-label={p.title} tabIndex={-1}>
            <img ref={imgRef} src={p.thumbnail} alt={p.title} loading="lazy" width="400" height="400" onError={onImgError} />
          </Link>
          <div className="badges">
            {p.isNew && <span className="badge badge-new">New</span>}
            {discount >= 5 && <span className="badge badge-sale">-{discount}%</span>}
            {soldOut && <span className="badge badge-out">Sold out</span>}
          </div>
          <button
            className={`wish-btn ${wished ? 'active' : ''} ${pop ? 'pop' : ''}`}
            onClick={onWish}
            aria-pressed={wished}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={18} />
          </button>
        </div>

        <div className="card-body">
          <span className="card-cat">{p.brand || prettyCategory(p.category)}</span>
          <h3 className="card-title">
            <Link to={href}>{p.title}</Link>
          </h3>
          <Rating value={p.rating} count={p.reviews?.length} />
          <div className="card-foot">
            <div className="price">
              <strong>{formatPrice(p.price)}</strong>
              {discount >= 5 && <s>{formatPrice(p.originalPrice)}</s>}
            </div>
            <button
              className="btn btn-primary btn-sm add-btn"
              disabled={soldOut}
              onClick={() => addToCart(p, 1, { from: imgRef.current })}
              aria-label={`Add ${p.title} to cart`}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
