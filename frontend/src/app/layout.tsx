/**
 * src/app/layout.tsx
 *
 * Root layout – wraps every page with the global CSS and sets
 * the page <title> and <meta> description.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightML – Upload your dataset",
  description:
    "InsightML: upload a CSV or XLSX dataset and explore its structure instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-navy font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

