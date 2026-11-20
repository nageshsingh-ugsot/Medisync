import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MediSync | Pharmacy workspace",
    template: "%s | MediSync",
  },
  description:
    "A multi-pharmacy workspace for managing pharmacy operations and inventory.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
