import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // If we're still loading the session, do nothing
    if (status === 'loading') return

    if (requireAuth) {
      // If auth is required and user is not authenticated
      if (!session) {
        router.push('/auth/login')
      }
    } else {
      // If auth is not required (login/register pages) and user is authenticated
      if (session) {
        router.push('/dashboard')
      }
    }
  }, [session, status, requireAuth, router])

  // Show nothing while loading
  if (status === 'loading') {
    return null
  }

  // If requireAuth is true and no session, or requireAuth is false and has session, return null
  if ((requireAuth && !session) || (!requireAuth && session)) {
    return null
  }

  // Otherwise render children
  return <>{children}</>
} 