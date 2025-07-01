import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Swyft Loan Calculator - Calculate Your Loan Repayments",
  description: "Calculate loan repayments with our easy-to-use calculator. Get instant estimates for weekly, fortnightly, or monthly payments with detailed breakdowns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} antialiased font-raleway`}
      >
        {children}
      </body>
    </html>
  );
}
