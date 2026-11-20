export default function StudioMark({ className = "logo" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" role="presentation">
        <path
          d="M18 5.5 28.5 11.7v12.6L18 30.5 7.5 24.3V11.7L18 5.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m7.8 11.9 10.2 6 10.2-6M18 18v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m13.1 8.4 4.9 2.9 4.9-2.9"
          stroke="#B8CDBD"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
