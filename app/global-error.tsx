'use client' // Error boundaries must be Client Components
import Error from '@/components/Error';
import './globals.css'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    // global-error must include html and body tags
    <html>
      <body className='w-full h-full'>
        <Error title={error.name} message={error.message} src='/' />

      </body>
    </html>
  )
}