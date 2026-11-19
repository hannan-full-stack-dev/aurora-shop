import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import useProducts from '../hooks/useProducts';
import useTitle from '../hooks/useTitle';
import { useStore } from '../context/StoreContext';

export default function Wishlist() {
  useTitle('Wishlist');
  const { wishlist } = useStore();
  const { products, loading, error, reload } = useProducts();

  const items = useMemo(() => products.filter((p) => wishlist.includes(p.id)), [products, wishlist]);

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Your wishlist</h1>
        <p className="muted">{wishlist.length} saved items</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && wishlist.length > 0 ? (
        <ProductGridSkeleton count={Math.min(wishlist.length, 8)} />
      ) : items.length === 0 ? (
        <div className="state-box">
          <Heart size={36} />
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any product to keep it here for later.</p>
          <Link to="/shop" className="btn btn-primary">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid-products">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
