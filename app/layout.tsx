import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasqli",
  description: "The workspace where VAs and clients finally understand each other.",
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
