import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Marketing Research Digest',
  description: 'Daily summaries of the latest academic and practitioner marketing research',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-zinc-50 text-zinc-900 min-h-screen`}>
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg tracking-tight">
              Marketing Digest
            </Link>
            <nav className="flex gap-6 text-sm text-zinc-500">
              <Link href="/"        className="hover:text-zinc-900 transition-colors">Digest</Link>
              <Link href="/browse"  className="hover:text-zinc-900 transition-colors">Browse</Link>
              <Link href="/sources" className="hover:text-zinc-900 transition-colors">Sources</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
