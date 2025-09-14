import type { Metadata } from "next";
import { Libre_Bodoni, Jost } from "next/font/google";
import "./globals.css";

const libreBodoni = Libre_Bodoni({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-libre-bodoni',
});

const jost = Jost({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-jost',
});

export const metadata: Metadata = {
  title: "NOVA9 - AI Model Gallery",
  description: "Premium AI model gallery with sophisticated design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${libreBodoni.variable} ${jost.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}