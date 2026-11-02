import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppToast } from '~/composables/useAppToast'
import { ApiError, toApiError } from '~/utils/apiError'
import {
  clearPendingOAuth,
  clearPendingVerification,
  consumePendingRedirect,
  getPendingRedirect,
  getSafeRedirect,
  rememberOAuthProvider,
  rememberPendingRedirect,
  rememberPendingVerification,
  type OAuthProvider,
} from '~/utils/authRedirect'

export interface AuthUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  provider: string
  avatar?: string
  emailVerified?: boolean
  mfaEnabled?: boolean
}

export type User = AuthUser

export interface VerificationChallenge {
  email: string
  verificationRequired: boolean
  codeLength: number
  codeExpiresInSeconds: number
  resendCooldownSeconds: number
}

export interface MfaChallenge {
  mfaRequired: true
  methods: string[]
  expiresInSeconds: number
}

export type MfaProof = { code: string } | { recoveryCode: string }

function isMfaChallenge(value: unknown): value is MfaChallenge {
  return Boolean(value && typeof value === 'object' && (value as MfaChallenge).mfaRequired === true)
}

const ADMIN_ROLE = 'ROLE_ADMIN'

function getDefaultAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed || 'CourseAura')}&backgroundColor=b6e3f4`
}

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const { success, warning } = useAppToast()

  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const initializing = ref<Promise<void> | null>(null)
  const initializationError = ref<string | null>(null)
  const lastError = ref<ApiError | null>(null)
  const hadSession = ref(false)
  const sessionExpired = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isAdmin = computed(() => user.value?.role === ADMIN_ROLE)
  const isInstructor = computed(() => user.value?.role === 'ROLE_INSTRUCTOR')
  const isStaff = computed(() => isAdmin.value || isInstructor.value)

  const userName = computed(() => {
    if (!user.value) return ''
    const fullName = [user.value.firstName, user.value.lastName]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(' ')

    return fullName || user.value.email || 'Account'
  })

  const userEmail = computed(() => user.value?.email || '')

  const userInitials = computed(() => {
    const first = user.value?.firstName?.trim().charAt(0) || ''
    const last = user.value?.lastName?.trim().charAt(0) || ''
    const initials = `${first}${last}`.toUpperCase()

    return initials || user.value?.email?.charAt(0).toUpperCase() || 'U'
  })

  const userAvatar = computed(() => {
    if (user.value?.avatar) return user.value.avatar
    return getDefaultAvatar(user.value?.email || userName.value)
  })

  const roleLabel = computed(() => {
    switch (user.value?.role) {
      case 'ROLE_ADMIN':
        return 'Platform Administrator'
      case 'ROLE_INSTRUCTOR':
        return 'Instructor'
      case 'ROLE_USER':
        return 'Student'
      default:
        return user.value?.role || 'Member'
    }
  })

  const homeRoute = computed(() => {
    if (isAdmin.value) return '/'
    return isInstructor.value ? '/instructor' : '/my-learning'
  })

  function currentRedirect() {
    return getSafeRedirect(router.currentRoute.value.query.redirect)
  }

  function redirectQuery() {
    const redirect = currentRedirect()
    return redirect ? { redirect } : {}
  }

  async function completeSignIn(response: AuthUser, title: string, description: string) {
    if (!response?.userId) {
      throw new ApiError('The server returned an invalid session.', 502)
    }

    setUser(response)
    initialized.value = true
    clearPendingVerification()

    success(title, description)

    // OAuth2 sign-ins remember their destination in session storage.
    const redirect = currentRedirect() || consumePendingRedirect()
    clearPendingOAuth()
    await router.push(redirect || homeRoute.value)

    return response
  }

  function rememberVerification(challenge: VerificationChallenge, fallbackEmail: string) {
    rememberPendingVerification({
      email: challenge?.email || fallbackEmail.trim().toLowerCase(),
      codeLength: Number(challenge?.codeLength) || 6,
      codeExpiresInSeconds: Number(challenge?.codeExpiresInSeconds) || 600,
      resendAvailableAt: Date.now() + (Number(challenge?.resendCooldownSeconds) || 60) * 1000,
    })
  }

  function setUser(userData: AuthUser) {
    user.value = userData
    lastError.value = null
    sessionExpired.value = false
    hadSession.value = true
  }

  function updateUser(patch: Partial<AuthUser>) {
    if (!user.value) return
    user.value = { ...user.value, ...patch }
  }

  // Display fields only. The role must come from the session (/auth/me): profile payloads such as
  // platform settings carry a human-readable role label, and copying it here would drop admin access.
  function setProfile(profile: { name?: string; email?: string; avatar?: string }) {
    const patch: Partial<AuthUser> = {}

    if (profile.name?.trim()) {
      const [firstName, ...rest] = profile.name.trim().split(/\s+/)
      patch.firstName = firstName || ''
      patch.lastName = rest.join(' ')
    }

    if (profile.email) patch.email = profile.email
    if (profile.avatar) patch.avatar = profile.avatar

    updateUser(patch)
  }

  function clearAuth() {
    user.value = null
  }

  function handleError(error: unknown, fallbackMessage: string) {
    const apiError = toApiError(error, fallbackMessage)
    lastError.value = apiError
    return apiError
  }

  async function initializeAuth(force = false) {
    if (initialized.value && !force) return
    if (initializing.value) return initializing.value

    initializing.value = (async () => {
      initializationError.value = null

      try {
        await fetchUser()
      } catch (error) {
        const apiError = handleError(error, 'Unable to restore your session')

        if (apiError.status !== 401) {
          initializationError.value = apiError.message
        }
      } finally {
        initialized.value = true
        initializing.value = null
      }
    })()

    return initializing.value
  }

  async function fetchUser(): Promise<boolean> {
    try {
      const response = await $fetch<AuthUser>('/api/auth/me', {
        credentials: 'include',
      })

      if (!response?.userId) {
        throw new ApiError('The server returned an invalid session.', 502)
      }

      setUser(response)
      return true
    } catch (error) {
      const apiError = handleError(error, 'Unable to restore your session')

      if (apiError.status === 401) {
        if (hadSession.value) sessionExpired.value = true
        clearAuth()
      }

      throw apiError
    }
  }

  async function login(email: string, password: string, rememberMe = false) {
    loading.value = true
    lastError.value = null
    sessionExpired.value = false

    try {
      const response = await $fetch<AuthUser | MfaChallenge>('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: { email, password, rememberMe },
      })

      if (isMfaChallenge(response)) {
        await router.push({ path: '/auth/two-factor', query: redirectQuery() })
        return response
      }

      return await completeSignIn(response, 'Welcome Back!', `Hello ${response.firstName || response.email}`)
    } catch (error) {
      throw handleError(error, 'Login failed')
    } finally {
      loading.value = false
    }
  }

  async function verifyMfa(proof: MfaProof) {
    loading.value = true
    lastError.value = null

    try {
      // This path matches the HttpOnly challenge cookie scope (see server/api/v1/auth/mfa).
      const response = await $fetch<AuthUser>('/api/v1/auth/mfa/verify', {
        method: 'POST',
        credentials: 'include',
        body: proof,
      })

      return await completeSignIn(response, 'Welcome Back!', `Hello ${response.firstName || response.email}`)
    } catch (error) {
      throw handleError(error, 'Two-factor verification failed')
    } finally {
      loading.value = false
    }
  }

  async function register(firstName: string, lastName: string, email: string, password: string) {
    loading.value = true
    lastError.value = null
    sessionExpired.value = false

    try {
      const response = await $fetch<VerificationChallenge>('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        body: { firstName, lastName, email, password },
      })

      rememberVerification(response, email)
      await router.push({ path: '/auth/verify-email', query: redirectQuery() })

      return response
    } catch (error) {
      throw handleError(error, 'Registration failed')
    } finally {
      loading.value = false
    }
  }

  async function verifyEmail(email: string, code: string) {
    loading.value = true
    lastError.value = null

    try {
      const response = await $fetch<AuthUser>('/api/auth/verify-email', {
        method: 'POST',
        credentials: 'include',
        body: { email, code },
      })

      return await completeSignIn(
        response,
        'Account Created!',
        `Welcome to CourseAuraHub, ${response.firstName || response.email}`,
      )
    } catch (error) {
      throw handleError(error, 'Email verification failed')
    } finally {
      loading.value = false
    }
  }

  async function resendVerification(email: string) {
    try {
      const response = await $fetch<VerificationChallenge>('/api/auth/verify-email/resend', {
        method: 'POST',
        credentials: 'include',
        body: { email },
      })

      rememberVerification(response, email)
      return response
    } catch (error) {
      throw handleError(error, 'Unable to send a new verification code')
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    try {
      const response = await $fetch<AuthUser>('/api/auth/password/change', {
        method: 'POST',
        credentials: 'include',
        body: { currentPassword, newPassword },
      })

      if (response?.userId) {
        updateUser(response)
      }

      return response
    } catch (error) {
      throw handleError(error, 'Unable to change your password')
    }
  }

  async function refreshSession() {
    try {
      const response = await $fetch<AuthUser>('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response?.userId) {
        throw new ApiError('The server returned an invalid session.', 502)
      }

      setUser(response)
      initialized.value = true
      return response
    } catch (error) {
      const apiError = handleError(error, 'Session expired')

      if (apiError.status === 401) {
        sessionExpired.value = true
        clearAuth()
      }

      throw apiError
    }
  }

  async function logout() {
    loading.value = true
    lastError.value = null
    sessionExpired.value = false

    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      handleError(error, 'Logout failed')
      warning('Signed Out Locally', 'The server could not be reached, but your local session was cleared.')
    } finally {
      await finishSignOut()
    }
  }

  async function logoutAll() {
    loading.value = true
    lastError.value = null

    try {
      await $fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      loading.value = false
      throw handleError(error, 'Unable to sign out of all devices')
    }

    success('Signed Out Everywhere', 'Every device has been signed out of your account.')
    await finishSignOut()
  }

  async function finishSignOut() {
    clearAuth()
    clearPendingOAuth()
    hadSession.value = false
    sessionExpired.value = false
    initialized.value = true
    loading.value = false
    await router.push('/auth/login')
  }

  function initiateOAuth2(provider: OAuthProvider) {
    if (!import.meta.client) return

    const redirect = getSafeRedirect(router.currentRoute.value.query.redirect)
      || getPendingRedirect()

    rememberPendingRedirect(redirect)
    rememberOAuthProvider(provider)

    window.location.href = `/api/auth/oauth2/${provider}`
  }

  return {
    user,
    loading,
    initialized,
    initializing,
    initializationError,
    lastError,
    isAuthenticated,
    isAdmin,
    isInstructor,
    isStaff,
    userName,
    userEmail,
    userInitials,
    userAvatar,
    roleLabel,
    homeRoute,
    sessionExpired,
    setUser,
    updateUser,
    setProfile,
    clearAuth,
    initializeAuth,
    fetchUser,
    login,
    verifyMfa,
    register,
    verifyEmail,
    resendVerification,
    changePassword,
    refreshSession,
    logout,
    logoutAll,
    initiateOAuth2,
  }
})

export function useAuth() {
  return useAuthStore()
}
