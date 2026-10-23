import type { Metadata } from "next";
import { Manrope, Pacifico, Poppins } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getLocale, getMessages } from "@/i18n/server";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-script";
import "./globals.css";

// Manrope: body and chat text. Poppins: labels, buttons and headings. Pacifico: page titles.
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return {
    title: { default: "Waylo.ai", template: "%s | Waylo.ai" },
    description: t.meta.siteDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning className="scroll-soft">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${manrope.variable} ${poppins.variable} ${pacifico.variable} antialiased`}>
        <I18nProvider locale={locale}>
          <ThemeProvider>
            <SmoothScroll />
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
