import Link from 'next/link';

export default function Home() {
  return (
    <div className="wrap">
      <h1>Client Book</h1>
      <p className="sub">
        Track massage clients, their problem areas, and appointment dates —
        with reminder emails sent automatically.
      </p>
      <p>
        <Link href="/signup" className="btn">Get started</Link>{' '}
        <Link href="/login" className="btn secondary">Log in</Link>
      </p>
    </div>
  );
}
