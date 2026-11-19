export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid-products" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card skeleton" key={i}>
          <div className="card-media sk-block" />
          <div className="card-body">
            <div className="sk-line w40" />
            <div className="sk-line w90" />
            <div className="sk-line w60" />
          </div>
        </div>
      ))}
    </div>
  );
}
