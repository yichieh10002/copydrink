import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { BackToTop } from '@/components/BackToTop';
import { getStores, getWarmNotices } from '@/lib/data';
import { buildQuickStores } from '@/lib/quick-stores';
import './styles/tokens.css';
import './styles/base.css';
import './styles/home.css';
import './styles/store.css';
import './styles/menu.css';
import './styles/order.css';
import './styles/utilities.css';
import './styles/modal.css';
import './styles/theme.css';
import './styles/responsive.css';

export const metadata: Metadata = {
  title: { default: 'copydrink｜飲料小抄', template: '%s｜copydrink' },
  description: '查找店家菜單，選好杯型、甜度與冰量，複製文字到群組。',
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [stores, notices] = await Promise.all([getStores(), getWarmNotices()]);
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader stores={buildQuickStores(stores)} notices={notices} />
        <main>{children}</main>
        <BackToTop />
        <footer className="site-footer">
          <div className="container">
            <strong>copydrink</strong>
            <p>
              菜單價格、品項與供應情形以各門市公告為準。本站提供查詢與文字複製，不會代為送出訂單。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
