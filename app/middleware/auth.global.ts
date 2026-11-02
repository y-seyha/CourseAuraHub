import { getSafeRedirect } from '~/utils/authRedirect'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/two-factor',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/support',
  '/courses',
]

function normalizePath(path: string) {
  const normalized = path.replace(/\/+$/, '')
  return normalized || '/'
}

// Certificate verification links are shared with people who have no account,
// and visitors can browse the catalog before signing up
const PUBLIC_PATH_PREFIXES = ['/certificates/', '/courses/']

function isPublicPath(path: string) {
  const normalized = normalizePath(path)
  return PUBLIC_PATHS.includes(normalized) || PUBLIC_PATH_PREFIXES.some(prefix => normalized.startsWith(prefix))
}

function isAuthEntryPath(path: string) {
  const normalized = normalizePath(path)
  return normalized === '/auth/login' || normalized === '/auth/register'
}

function hasSessionCookie() {
  const headers = useRequestHeaders(['cookie'])
  return /(?:^|;\s*)(?:access_token|refresh_token)=/.test(headers.cookie || '')
}

export default defineNuxtRouteMiddleware(async (to) => {
  const isPublic = isPublicPath(to.path)

  if (import.meta.server) {
    // SSR guard: avoid rendering protected pages for visitors with no session at all.
    if (!isPublic && !hasSessionCookie()) {
      return navigateTo({
        path: '/auth/login',
        query: { redirect: to.fullPath },
      })
    }

    return
  }

  const auth = useAuth()

  if (!auth.initialized) {
    await auth.initializeAuth()
  }

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo({
      path: '/auth/login',
      query: {
        redirect: to.fullPath,
        ...(auth.sessionExpired ? { session: 'expired' } : {}),
      },
    })
  }

  if (auth.isAuthenticated && isAuthEntryPath(to.path)) {
    // Honour a requested destination (e.g. a protected page the user was
    // originally trying to reach) instead of always going to the home page.
    return navigateTo(getSafeRedirect(to.query.redirect, auth.homeRoute))
  }

  // Let the callback page finish its fetch/redirect flow.
  if (normalizePath(to.path) === '/auth/callback') {
    return
  }

  if (to.meta.requiresAdmin === true && !auth.isAdmin) {
    return navigateTo(auth.homeRoute)
  }

  if (to.meta.requiresStaff === true && !auth.isStaff) {
    return navigateTo(auth.homeRoute)
  }
})
