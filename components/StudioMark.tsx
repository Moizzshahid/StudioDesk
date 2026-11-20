export default function StudioMark({ className = "logo" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg
        viewBox="60 30 125 75"
        width="27"
        height="16.2"
        fill="none"
        role="presentation"
      >
        <path d="M67 67 105 37 105 96 67 96Z" fill="currentColor" />
        <path d="M105 37H141V67Z" fill="currentColor" />
        <path d="M141 67 178 96H141Z" fill="currentColor" />
      </svg>
    </span>
  );
}
