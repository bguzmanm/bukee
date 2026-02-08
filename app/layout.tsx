import type { Metadata } from "next";
import { Lato as LatoFont } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const lato = LatoFont({ // Usar el alias
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap', // Añadir display: 'swap' para optimización
  variable: '--font-lato',
});

/*const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});*/

export const metadata: Metadata = {
  title: "Bukee",
  description: "Gestiona tu biblioteca electrónica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${lato.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}