import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { BackToTop } from "@/components/BackToTop";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/store.css";
import "./styles/menu.css";
import "./styles/order.css";
import "./styles/responsive.css";
import "./styles/utilities.css";
import "./styles/theme.css";

export const metadata: Metadata = {
  title: { default: "copydrink｜飲料小抄", template: "%s｜copydrink" },
  description: "查找店家菜單，選好杯型、甜度與冰量，複製文字到群組。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <SiteHeader />
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
