import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { BackToTop } from "@/components/BackToTop";
import { MotionEffects } from "@/components/MotionEffects";
import { getStores, getWarmNotices } from "@/lib/data";
import { buildQuickStores } from "@/lib/quick-stores";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/home.css";
import "./styles/store.css";
import "./styles/menu.css";
import "./styles/order.css";
import "./styles/utilities.css";
import "./styles/modal.css";
import "./styles/theme.css";
import "./styles/motion.css";
import "./styles/responsive.css";
import "./styles/touch-motion.css";
import "./styles/footer.css";

export const metadata: Metadata = {
  title: { default: "copydrink｜飲料小抄", template: "%s｜copydrink" },
  description: "查找店家菜單，選好杯型、甜度與冰量，複製文字到群組。",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stores, notices] = await Promise.all([getStores(), getWarmNotices()]);
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader stores={buildQuickStores(stores)} notices={notices} />
        <main>{children}</main>
        <BackToTop />
        <MotionEffects />
        <SiteFooter
          sources={stores.flatMap((store) => {
            const brand = store.document.brand;
            try {
              const url = new URL(brand.website || brand.menuUrl || "");
              if (!["https:", "http:"].includes(url.protocol)) return [];
              return [
                {
                  name: brand.name,
                  url: url.href,
                  updated: store.publishedAt.slice(0, 10),
                },
              ];
            } catch {
              return [];
            }
          })}
        />
      </body>
    </html>
  );
}
