import { Link } from 'react-router-dom';
import useTitle from '../hooks/useTitle';

export default function NotFound() {
  useTitle('Page not found');
  return (
    <div className="container page">
      <div className="state-box">
        <h1 className="big-404">404</h1>
        <h2>We can’t find that page</h2>
        <p>The link may be broken or the page may have moved.</p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
