import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

// Pages yang tidak memerlukan authentication
const publicPages = ['/login']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const isPublicPage = publicPages.includes(router.pathname)

      if (!token && !isPublicPage) {
        router.push('/login')
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router.pathname])

  if (isChecking && !publicPages.includes(router.pathname)) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-300">Memuat...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </AuthProvider>
  )
}
