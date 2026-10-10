import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const elza = localFont({
  src: [
    { path: "../../public/fonts/ElzaText-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/ElzaText-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/ElzaText-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/ElzaText-Semibold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-elza",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IBL Group · Shaping better lives since 1830",
  description:
    "A Mauritian heart. A regional force. Global expertise. IBL is a leading diversified group of the Indian Ocean and East Africa, four clusters across twenty countries, close to forty thousand people.",
  keywords: ["IBL Group", "Mauritius", "conglomerate", "Indian Ocean", "East Africa", "1830"],
  icons: { icon: "/brand/ibl-logo.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "IBL Group · Shaping better lives since 1830",
    description:
      "The leading diversified group of the Indian Ocean and East Africa. Live pulse, living constellation, two centuries of momentum.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#151b4a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        {/* Resolve the theme before first paint. Heritage default is light,
            the persisted choice wins, auto follows the Port Louis sun. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t="light";var s=localStorage.getItem("ibl-experience-2");if(s){var j=JSON.parse(s);var st=j&&j.state&&j.state.theme;if(st==="abyss"||st==="light"||st==="oled"||st==="sepia"||st==="auto")t=st;}if(t==="auto"){var h=(new Date().getUTCHours()+4)%24;t=(h>=6&&h<18)?"light":"abyss";}var r=document.documentElement;r.dataset.theme=t;r.classList.toggle("dark",t==="abyss"||t==="oled");}catch(e){}})();',
          }}
        />
      </head>
      <body className={`${elza.variable} ${fraunces.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
