import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tasqli.com"),
  title: {
    default: "Tasqli",
    template: "Tasqli · %s",
  },
  description:
    "The workspace where VAs and clients finally understand each other. Generate polished proposals in seconds, manage projects, and keep clients in the loop.",
  openGraph: {
    title: "Tasqli — The VA Workspace",
    description:
      "Generate polished proposals in seconds, manage projects, and keep clients in the loop.",
    url: "https://tasqli.com",
    siteName: "Tasqli",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Tasqli" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tasqli — The VA Workspace",
    description:
      "Generate polished proposals in seconds, manage projects, and keep clients in the loop.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className={GeistSans.className}>{children}</div>
      </body>
    </html>
  );
}
