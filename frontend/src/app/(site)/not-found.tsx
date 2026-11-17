import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container error-state">
      <h1>找不到這家店</h1>
      <p>店家可能尚未發布，或連結已經更新。</p>
      <Link href="/">返回所有店家</Link>
    </div>
  );
}
