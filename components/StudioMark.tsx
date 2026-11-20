export default function StudioMark({ className = "logo" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" role="presentation">
        <path d="M10 8.5h11.8L27 13.7v14.1H10V8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M21.5 8.8v5.1h5.1" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
        <path d="M14 18.1h9M14 22h6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        <path d="M23.5 25.2h5" stroke="#B8CDBD" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </span>
  );
}
