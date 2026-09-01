import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-px py-32 text-center">
      <p className="font-display text-6xl text-wine mb-4">404</p>
      <h1 className="font-display text-2xl text-ink mb-4">This page wandered off</h1>
      <Link to="/" className="inline-block bg-ink text-paper rounded-full px-6 py-3 text-sm hover:bg-wine">Back to Aaraish</Link>
    </div>
  );
}
