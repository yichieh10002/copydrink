import Link from "next/link";
import type { StoreSummary } from "@/lib/types";
export function StoreCard({ store }: { store: StoreSummary }) {
  return (
    <Link
      className="store-card"
      href={`/stores/${encodeURIComponent(store.slug)}`}
    >
      <span className="store-logo">
        {store.logoUrl ? (
          <img src={store.logoUrl} alt="" />
        ) : (
          store.name.slice(0, 1)
        )}
      </span>
      <span className="store-card-copy">
        <strong>{store.name}</strong>
        <small>
          {store.regionCount} 個區域 · {store.drinkCount} 款飲品
        </small>
      </span>
      <span className="store-card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
