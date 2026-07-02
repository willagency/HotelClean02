import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CleanOps | ホテル清掃管理',
  description: 'ホテル客室清掃スタッフの勤怠・売上管理システム',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={cn("font-sans", inter.variable)}>
      <body className="bg-linen-100 text-navy-900 antialiased">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { fontFamily: 'var(--font-noto), system-ui, sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
