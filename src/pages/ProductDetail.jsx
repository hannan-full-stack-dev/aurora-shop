import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, RotateCcw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QtyStepper from '../components/QtyStepper';
import Rating from '../components/Rating';
import ErrorState from '../components/ErrorState';
import useProducts from '../hooks/useProducts';
import useTitle from '../hooks/useTitle';
import { useStore } from '../context/StoreContext';
import { formatDate, formatPrice, prettyCategory, onImgError } from '../utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading, error, reload } = useProducts();
  const { addToCart, toggleWishlist, isWished, openCart } = useStore();

  const product = useMemo(() => products.find((p) => String(p.id) === id), [products, id]);
  useTitle(product?.title);

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const mainImg = useRef(null);

  useEffect(() => {
    setActive(0);
    setQty(1);
    setTab('description');
  }, [id]);

  const related = useMemo(
    () =>
      product ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4) : [],
    [products, product]
  );

  if (loading) {
    return (
      <div className="container page">
        <div className="pd-grid" aria-busy="true">
          <div className="sk-block pd-skel-img" />
          <div>
            <div className="sk-line w40" />
            <div className="sk-line w90" />
            <div className="sk-line w60" />
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container page">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container page">
        <div className="state-box">
          <h2>Product not found</h2>
          <p>It may have been removed or the link is incorrect.</p>
          <Link to="/shop" className="btn btn-primary">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.thumbnail];
  const discount = Math.round(product.discountPercentage || 0);
  const soldOut = product.stock <= 0;
  const wished = isWished(product.id);
  const stockLabel = soldOut ? 'Out of stock' : product.stock <= 10 ? `Only ${product.stock} left` : 'In stock';

  const buyNow = () => {
    addToCart(product, qty);
    navigate('/checkout');
  };

  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop?category=${product.category}`}>{prettyCategory(product.category)}</Link>
      </nav>

      <div className="pd-grid">
        <div className="gallery">
          <div
            className={`gallery-main ${zoom.on ? 'zoomed' : ''}`}
            data-dept={product.dept}
            onPointerMove={(e) => {
              if (e.pointerType !== 'mouse') return;
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onPointerLeave={() => setZoom((z) => ({ ...z, on: false }))}
          >
            <img
              ref={mainImg}
              src={images[active]}
              alt={product.title}
              onError={onImgError}
              style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }}
            />
            <div className="badges">
              {product.isNew && <span className="badge badge-new">New</span>}
              {discount >= 5 && <span className="badge badge-sale">-{discount}%</span>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  className={i === active ? 'active' : ''}
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          {product.brand && <span className="card-cat">{product.brand}</span>}
          <h1>{product.title}</h1>
          <Rating value={product.rating} count={product.reviews?.length} size={18} />

          <div className="pd-price">
            <strong>{formatPrice(product.price)}</strong>
            {discount >= 5 && (
              <>
                <s>{formatPrice(product.originalPrice)}</s>
                <span className="save">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="pd-lead">{product.description}</p>

          <p className={`stock ${soldOut ? 'out' : product.stock <= 10 ? 'low' : ''}`}>{stockLabel}</p>

          <div className="pd-actions">
            <QtyStepper value={qty} max={Math.max(product.stock, 1)} onChange={(n) => setQty(Math.max(1, n))} />
            <button
              className="btn btn-primary btn-lg"
              disabled={soldOut}
              onClick={() => addToCart(product, qty, { open: true, from: mainImg.current })}
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
            <button
              className={`btn btn-ghost btn-lg icon-only ${wished ? 'wished' : ''}`}
              onClick={() => toggleWishlist(product)}
              aria-pressed={wished}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} />
            </button>
          </div>
          <button className="btn btn-dark btn-block btn-lg" disabled={soldOut} onClick={buyNow}>
            Buy it now
          </button>

          <ul className="pd-perks">
            {product.shippingInformation && (
              <li>
                <Truck size={18} /> {product.shippingInformation}
              </li>
            )}
            {product.warrantyInformation && (
              <li>
                <ShieldCheck size={18} /> {product.warrantyInformation}
              </li>
            )}
            {product.returnPolicy && (
              <li>
                <RotateCcw size={18} /> {product.returnPolicy}
              </li>
            )}
          </ul>
        </div>
      </div>

      <section className="tabs-section">
        <div className="tabs" role="tablist">
          {['description', 'details', 'reviews'].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t === 'reviews' ? `Reviews (${product.reviews?.length || 0})` : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="tab-panel" role="tabpanel">
          {tab === 'description' && <p>{product.description}</p>}

          {tab === 'details' && (
            <dl className="specs">
              <dt>Category</dt>
              <dd>{prettyCategory(product.category)}</dd>
              {product.brand && (
                <>
                  <dt>Brand</dt>
                  <dd>{product.brand}</dd>
                </>
              )}
              {product.sku && (
                <>
                  <dt>SKU</dt>
                  <dd>{product.sku}</dd>
                </>
              )}
              {product.weight != null && (
                <>
                  <dt>Weight</dt>
                  <dd>{product.weight} oz</dd>
                </>
              )}
              {product.dimensions && (
                <>
                  <dt>Dimensions</dt>
                  <dd>
                    {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} cm
                  </dd>
                </>
              )}
              {product.availabilityStatus && (
                <>
                  <dt>Availability</dt>
                  <dd>{product.availabilityStatus}</dd>
                </>
              )}
              {product.tags?.length > 0 && (
                <>
                  <dt>Tags</dt>
                  <dd>{product.tags.join(', ')}</dd>
                </>
              )}
            </dl>
          )}

          {tab === 'reviews' &&
            (product.reviews?.length ? (
              <ul className="reviews">
                {product.reviews.map((r, i) => (
                  <li key={i}>
                    <div className="review-head">
                      <strong>{r.reviewerName}</strong>
                      <span className="muted">{formatDate(r.date)}</span>
                    </div>
                    <Rating value={r.rating} />
                    <p>{r.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No reviews yet.</p>
            ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>You may also like</h2>
          </div>
          <div className="grid-products">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
