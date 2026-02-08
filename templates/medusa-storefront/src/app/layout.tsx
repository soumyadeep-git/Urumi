import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
