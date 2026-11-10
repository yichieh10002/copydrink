export default function Loading() {
  return (
    <div
      className="container loading-page"
      role="status"
      aria-label="正在載入店家"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  );
}
