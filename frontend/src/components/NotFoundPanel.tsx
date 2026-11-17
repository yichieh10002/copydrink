import Link from "next/link";

export function NotFoundPanel() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code" aria-hidden="true">
          404
        </span>
        <p className="not-found-eyebrow">OOPS, WRONG CUP!</p>
        <h1>這一頁還沒找到</h1>
        <p className="not-found-description">
          網址可能打錯了，或這家店還沒上架。回首頁再找找想喝的那杯吧。
        </p>
        <Link className="not-found-home" href="/">
          回首頁找飲料 <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
