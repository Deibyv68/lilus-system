import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Este layout lo comparten la tienda y el panel, asi que aca no va ni
 * titulo ni descripcion: cada uno pone el suyo.
 *
 * Cuando el titulo vivia aca, la plantilla "%s · LILUS" se le aplicaba
 * tambien al titulo propio de la tienda y salia "LILUS — Jabones
 * artesanales · LILUS", con la marca repetida.
 */
export const metadata: Metadata = {
  applicationName: "LILUS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LILUS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {children}
        {/*
          El Toaster se queda: los avisos de «guardado» y «no se pudo»
          los usan las dos mitades.

          Lo que se fue de aquí es todo lo de la app instalable —el
          cartel de instalar y el trabajador de servicio—, que ahora vive
          en `sistema/layout.tsx`. Estaban en este layout, que comparten
          el panel y la tienda, así que a cualquiera que entrara a
          comprar le salía la oferta de instalarse el panel de
          administración. Ver la nota de allá.
        */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
