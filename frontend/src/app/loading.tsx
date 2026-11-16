// Mirrors the home hero's copy block (hidden) so the streamed page lands without a layout shift.
export default function Loading() {
  return (
    <section
      className="home-hero home-hero-loading"
      role="status"
      aria-label="正在載入首頁"
    >
      <div className="container hero-layout" aria-hidden="true">
        <div className="hero-copy">
          <span className="eyebrow">YOUR DAILY DRINK NOTE</span>
          <h1>
            <span className="hero-line">
              <span>今天這杯，</span>
            </span>
            <span className="hero-line">
              <span>照你的口味。</span>
            </span>
          </h1>
          <p>找菜單、選口味，複製貼回群組。</p>
          <div className="home-search">
            <div className="home-search-trigger" />
          </div>
          <dl className="hero-stats">
            <div>
              <dt>收錄品牌</dt>
              <dd>0</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
