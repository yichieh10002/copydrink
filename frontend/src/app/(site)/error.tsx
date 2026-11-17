"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container error-state">
      <h1>菜單暫時無法讀取</h1>
      <p>請稍後重試；資料還沒有完成載入。</p>
      <button onClick={() => reset()}>重新讀取</button>
    </div>
  );
}
