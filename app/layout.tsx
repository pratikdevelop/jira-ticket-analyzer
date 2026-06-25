import "./globals.css";
import { Inter } from "next/font/google";
// import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
        </link>
      </head>
      <body className="min-h-full flex flex-col"                data-new-gr-c-s-check-loaded="14.1299.0"

        data-gr-ext-installed="">{children}</body>
    </html>
  );
}
