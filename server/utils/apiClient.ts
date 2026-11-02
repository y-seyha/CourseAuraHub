import type { H3Event } from 'h3'

interface BackendApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string> | null
  timestamp?: string
}

export interface BackendAuthData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  provider: string
  sessionId?: string
  refreshExpiresIn?: number
}

export interface BackendMfaChallenge {
  mfaRequired: true
  mfaToken: string
  methods: string[]
  expiresInSeconds: number
}

export interface BackendVerificationRequired {
  email: string
  verificationRequired: boolean
  codeLength: number
  codeExpiresInSeconds: number
  resendCooldownSeconds: number
}

export interface BackendUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  provider: string
  emailVerified: boolean
  mfaEnabled: boolean
  imageUrl?: string | null
}

export interface AuthUserPayload {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  provider: string
}

export interface BackendSession {
  sessionId: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  rememberMe: boolean
  current: boolean
}

export interface BackendMfaStatus {
  enabled: boolean
  enrollmentPending: boolean
  remainingRecoveryCodes: number
  available: boolean
}

export interface BackendTotpSetup {
  secret: string
  otpauthUri: string
  digits: number
  periodSeconds: number
}

export interface BackendRecoveryCodes {
  recoveryCodes: string[]
}

export interface PlatformSettingsResponse {
  platformName: string
  platformTagline: string
  currency: string
  defaultLanguage: string
  notifications: {
    newEnrollment: boolean
    courseCompletion: boolean
    weeklyReport: boolean
  }
  profile: {
    name: string
    email: string
    role: string
    avatar: string
    bio: string
    website: string
    twitter: string
  }
}

interface CsrfTokenData {
  headerName: string
  parameterName: string
  token: string
}

interface BackendRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, unknown>
  auth?: boolean
  // Public endpoint: send the session when there is one, otherwise call it anonymously
  optionalAuth?: boolean
  retryOn401?: boolean
  csrf?: boolean
  fallbackMessage?: string
}

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'
const CSRF_COOKIE = 'XSRF-TOKEN'
const REMEMBER_COOKIE = 'remember_me'
// Same name and path as the backend's OAuth2 challenge cookie, so both login flows share one
// HttpOnly cookie that the browser only sends to `/api/v1/auth/mfa/*` (see server/api/v1).
const MFA_CHALLENGE_COOKIE = 'mfa_challenge'
const MFA_CHALLENGE_PATH = '/api/v1/auth/mfa'

const ACCESS_TOKEN_MAX_AGE = 15 * 60
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60
const CSRF_TOKEN_MAX_AGE = 30 * 24 * 60 * 60

const refreshRequests = new Map<string, Promise<BackendAuthData>>()

function getApiBase() {
  const config = useRuntimeConfig()
  return String(config.apiBase || 'http://localhost:8080/api/v1').replace(/\/+$/, '')
}

export function getBackendOrigin() {
  const config = useRuntimeConfig()

  if (config.public.backendUrl) {
    return String(config.public.backendUrl).replace(/\/+$/, '')
  }

  try {
    return new URL(getApiBase()).origin
  } catch {
    return 'http://localhost:8080'
  }
}

function getCookieOptions(event: H3Event, httpOnly = true) {
  const config = useRuntimeConfig(event)

  return {
    httpOnly,
    secure: Boolean(config.cookieSecure),
    sameSite: (config.cookieSameSite || 'lax') as 'lax' | 'strict' | 'none',
    domain: config.cookieDomain ? String(config.cookieDomain) : undefined,
    path: '/',
  }
}

function getCookieDeleteOptions() {
  const config = useRuntimeConfig()

  return {
    domain: config.cookieDomain ? String(config.cookieDomain) : undefined,
    path: '/',
  }
}

function getErrorStatus(error: unknown) {
  const candidate = error as {
    statusCode?: number
    status?: number
    response?: { status?: number }
  }

  return Number(
    candidate?.response?.status
      || candidate?.statusCode
      || candidate?.status
      || 500,
  )
}

function getErrorBody(error: unknown) {
  const candidate = error as {
    data?: unknown
    response?: { _data?: unknown; data?: unknown }
  }

  return candidate?.response?._data
    || candidate?.response?.data
    || candidate?.data
    || null
}

export function createSessionExpiredError() {
  return createError({
    statusCode: 401,
    statusMessage: 'Session expired',
    data: {
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please sign in again.',
    },
  })
}

export function toPublicError(
  error: unknown,
  fallbackStatus = 500,
  fallbackMessage = 'Request failed',
  includeSessionCode = true,
) {
  const status = getErrorStatus(error)
  const body = getErrorBody(error) as {
    message?: string
    errors?: Record<string, string>
    code?: string
  } | null

  const rawMessage = body?.message
    || (error as { statusMessage?: string })?.statusMessage
    || (error as { message?: string })?.message
    || fallbackMessage

  const message = rawMessage === 'fetch failed' || rawMessage === 'Failed to fetch'
    ? 'Unable to reach the authentication service. Please try again.'
    : rawMessage

  return createError({
    statusCode: status >= 400 && status < 600 ? status : fallbackStatus,
    statusMessage: message,
    data: {
      code: body?.code || (includeSessionCode && status === 401 ? 'SESSION_EXPIRED' : undefined),
      message,
      errors: body?.errors || undefined,
    },
  })
}

/**
 * Client identity for the backend: the session list shows the browser instead of the Node.js
 * fetch client, and per-IP rate limits apply per visitor. The backend only honours
 * X-Forwarded-For from addresses listed in its TRUSTED_PROXIES setting.
 */
function getClientHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {}
  const userAgent = getRequestHeader(event, 'user-agent')
  // Socket address only; a client-supplied X-Forwarded-For must not be relayed as trusted.
  const clientIp = getRequestIP(event)

  if (userAgent) headers['User-Agent'] = userAgent
  if (clientIp) headers['X-Forwarded-For'] = clientIp

  return headers
}

export function setSessionCookies(event: H3Event, data: BackendAuthData, rememberMe?: boolean) {
  const accessMaxAge = Number(data.expiresIn) > 0
    ? Math.max(60, Math.floor(Number(data.expiresIn) / 1000))
    : ACCESS_TOKEN_MAX_AGE
  // The backend decides the session lifetime (remember-me, MFA and OAuth2 sign-ins included).
  const refreshMaxAge = Number(data.refreshExpiresIn) > 0
    ? Math.max(60, Math.floor(Number(data.refreshExpiresIn) / 1000))
    : rememberMe ? REMEMBER_ME_MAX_AGE : REFRESH_TOKEN_MAX_AGE
  const isRemembered = rememberMe ?? refreshMaxAge > REFRESH_TOKEN_MAX_AGE

  setCookie(event, ACCESS_COOKIE, data.accessToken, {
    ...getCookieOptions(event),
    maxAge: accessMaxAge,
  })

  setCookie(event, REFRESH_COOKIE, data.refreshToken, {
    ...getCookieOptions(event),
    maxAge: refreshMaxAge,
  })

  setCookie(event, REMEMBER_COOKIE, isRemembered ? '1' : '0', {
    ...getCookieOptions(event),
    maxAge: refreshMaxAge,
  })
}

export function clearSessionCookies(event: H3Event) {
  const options = getCookieDeleteOptions()

  deleteCookie(event, ACCESS_COOKIE, options)
  deleteCookie(event, REFRESH_COOKIE, options)
  deleteCookie(event, CSRF_COOKIE, options)
  deleteCookie(event, REMEMBER_COOKIE, options)
  clearMfaChallengeCookie(event)
}

export function isMfaChallenge(data: unknown): data is BackendMfaChallenge {
  return Boolean(data && typeof data === 'object' && (data as BackendMfaChallenge).mfaRequired === true)
}

export function setMfaChallengeCookie(event: H3Event, challenge: BackendMfaChallenge) {
  setCookie(event, MFA_CHALLENGE_COOKIE, challenge.mfaToken, {
    ...getCookieOptions(event),
    path: MFA_CHALLENGE_PATH,
    maxAge: Math.max(30, Number(challenge.expiresInSeconds) || 300),
  })
}

export function getMfaChallengeCookie(event: H3Event) {
  return getCookie(event, MFA_CHALLENGE_COOKIE)
}

export function clearMfaChallengeCookie(event: H3Event) {
  deleteCookie(event, MFA_CHALLENGE_COOKIE, {
    ...getCookieDeleteOptions(),
    path: MFA_CHALLENGE_PATH,
  })
}

/**
 * The backend answers 403 for both disabled and unverified accounts. Tag the unverified case so
 * the sign-in page can offer email verification instead of a dead end.
 */
export function tagAccountStateError(error: unknown) {
  const candidate = error as { statusCode?: number; data?: { code?: string; message?: unknown } }
  const message = candidate?.data?.message

  if (
    candidate?.statusCode === 403
    && candidate.data
    && typeof message === 'string'
    && message.startsWith('Email verification required')
  ) {
    candidate.data.code = 'EMAIL_NOT_VERIFIED'
  }

  return error
}

async function performRefresh(event: H3Event, refreshToken: string): Promise<BackendAuthData> {
  const xsrfToken = getCookie(event, CSRF_COOKIE)
  const cookies = [`${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}`]

  if (xsrfToken) {
    cookies.push(`${CSRF_COOKIE}=${encodeURIComponent(xsrfToken)}`)
  }

  try {
    const response = await $fetch<BackendApiResponse<BackendAuthData>>(`${getApiBase()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...getClientHeaders(event),
        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        Cookie: cookies.join('; '),
      },
    })

    if (!response?.success || !response.data?.accessToken || !response.data?.refreshToken) {
      throw createSessionExpiredError()
    }

    return response.data
  } catch (error) {
    const status = getErrorStatus(error)

    if (status === 400 || status === 401 || status === 403) {
      throw createSessionExpiredError()
    }

    throw toPublicError(
      error,
      503,
      'Unable to refresh your session. Please try again.',
    )
  }
}

export async function refreshSession(event: H3Event) {
  const refreshToken = getCookie(event, REFRESH_COOKIE)

  if (!refreshToken) {
    throw createSessionExpiredError()
  }

  let request = refreshRequests.get(refreshToken)

  if (!request) {
    request = performRefresh(event, refreshToken).finally(() => {
      refreshRequests.delete(refreshToken)
    })
    refreshRequests.set(refreshToken, request)
  }

  try {
    const data = await request
    setSessionCookies(event, data, data.refreshExpiresIn ? undefined : getCookie(event, REMEMBER_COOKIE) === '1')
    return data
  } catch (error) {
    const status = getErrorStatus(error)

    if (status === 400 || status === 401 || status === 403) {
      clearSessionCookies(event)
    }

    throw error
  }
}

export async function ensureCsrfToken(event: H3Event, force = false): Promise<CsrfTokenData> {
  const existingToken = getCookie(event, CSRF_COOKIE)
  if (existingToken && !force) {
    return {
      headerName: 'X-XSRF-TOKEN',
      parameterName: '_csrf',
      token: existingToken,
    }
  }

  const accessToken = getCookie(event, ACCESS_COOKIE)
  const response = await $fetch<BackendApiResponse<CsrfTokenData>>(`${getApiBase()}/auth/csrf`, {
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (!response?.success || !response.data?.token) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Unable to initialize CSRF protection',
      data: { message: 'Unable to initialize CSRF protection. Please try again.' },
    })
  }

  setCookie(event, CSRF_COOKIE, response.data.token, {
    ...getCookieOptions(event, false),
    maxAge: CSRF_TOKEN_MAX_AGE,
  })

  return response.data
}

async function executeBackendRequest<T>(
  event: H3Event,
  path: string,
  accessToken: string | undefined,
  options: BackendRequestOptions,
  forceCsrf = false,
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...getClientHeaders(event),
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  if (options.csrf) {
    const csrf = await ensureCsrfToken(event, forceCsrf)
    headers[csrf.headerName] = csrf.token
    headers.Cookie = `${CSRF_COOKIE}=${encodeURIComponent(csrf.token)}`
  }

  return await $fetch<BackendApiResponse<T>>(`${getApiBase()}${path}`, {
    method: options.method || 'GET',
    body: options.body as Record<string, unknown> | undefined,
    query: options.query,
    headers,
  })
}

function unwrapResponse<T>(response: BackendApiResponse<T> | undefined, fallbackMessage: string) {
  // 204 No Content has no envelope to unwrap
  if (response === undefined) return undefined as T

  if (!response || response.success === false) {
    throw createError({
      statusCode: 502,
      statusMessage: response?.message || fallbackMessage,
      data: {
        message: response?.message || fallbackMessage,
        errors: response?.errors || undefined,
      },
    })
  }

  return response.data
}

export async function backendRequest<T>(
  event: H3Event,
  path: string,
  options: BackendRequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    retryOn401 = true,
    fallbackMessage = 'Request failed',
  } = options

  const { optionalAuth = false } = options
  let accessToken = auth ? getCookie(event, ACCESS_COOKIE) : undefined

  if (auth && !accessToken && retryOn401 && (!optionalAuth || getCookie(event, REFRESH_COOKIE))) {
    try {
      const refreshed = await refreshSession(event)
      accessToken = refreshed.accessToken
    } catch (error) {
      if (!optionalAuth) throw error
    }
  }

  if (auth && !accessToken && !optionalAuth) {
    throw createSessionExpiredError()
  }

  try {
    const response = await executeBackendRequest<T>(event, path, accessToken, options)
    return unwrapResponse(response, fallbackMessage)
  } catch (error) {
    const status = getErrorStatus(error)

    if (auth && status === 401 && retryOn401 && path !== '/auth/refresh') {
      const refreshed = await refreshSession(event)
      accessToken = refreshed.accessToken

      try {
        const response = await executeBackendRequest<T>(event, path, accessToken, options)
        return unwrapResponse(response, fallbackMessage)
      } catch (retryError) {
        throw toPublicError(retryError, 401, fallbackMessage, auth)
      }
    }

    if (options.csrf && status === 403) {
      try {
        const response = await executeBackendRequest<T>(event, path, accessToken, options, true)
        return unwrapResponse(response, fallbackMessage)
      } catch (retryError) {
        throw toPublicError(retryError, 403, fallbackMessage, auth)
      }
    }

    throw toPublicError(error, status, fallbackMessage, auth)
  }
}

async function openBackendStream(event: H3Event, path: string, accessToken: string, signal: AbortSignal) {
  const lastEventId = getRequestHeader(event, 'last-event-id')

  return await fetch(`${getApiBase()}${path}`, {
    signal,
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${accessToken}`,
      ...getClientHeaders(event),
      ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
    },
  })
}

/** Relays a Server-Sent Events response. EventSource can't refresh a session, so this does. */
export async function proxyBackendStream(event: H3Event, path: string) {
  const abort = new AbortController()
  event.node.req.on('close', () => abort.abort())

  let accessToken = getCookie(event, ACCESS_COOKIE) || (await refreshSession(event)).accessToken
  let upstream = await openBackendStream(event, path, accessToken, abort.signal)

  if (upstream.status === 401) {
    accessToken = (await refreshSession(event)).accessToken
    upstream = await openBackendStream(event, path, accessToken, abort.signal)
  }

  if (!upstream.ok || !upstream.body) {
    throw createError({ statusCode: upstream.status === 401 ? 401 : 502, statusMessage: 'Unable to open the stream' })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  })

  try {
    await sendStream(event, upstream.body)
  } catch (error) {
    // A closed browser tab aborts the upstream request, which is not a failure
    if (!abort.signal.aborted) throw error
  }
}

/** Relays a binary download, which the JSON envelope in backendRequest can't carry. */
export async function proxyBackendFile(event: H3Event, path: string, fallbackMessage: string) {
  const request = (accessToken: string) => fetch(`${getApiBase()}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, ...getClientHeaders(event) },
  })

  let upstream = await request(getCookie(event, ACCESS_COOKIE) || (await refreshSession(event)).accessToken)

  if (upstream.status === 401) {
    upstream = await request((await refreshSession(event)).accessToken)
  }

  if (upstream.status === 401) throw createSessionExpiredError()

  if (!upstream.ok) {
    const body = await upstream.json().catch(() => null) as { message?: string } | null
    const message = body?.message || fallbackMessage
    throw createError({ statusCode: upstream.status, statusMessage: message, data: { message } })
  }

  setResponseHeaders(event, {
    'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    'Content-Disposition': upstream.headers.get('content-disposition') || 'attachment',
    'Cache-Control': 'private, no-store',
  })

  return Buffer.from(await upstream.arrayBuffer())
}

export async function logoutBackend(event: H3Event) {
  const refreshToken = getCookie(event, REFRESH_COOKIE)
  if (!refreshToken) return

  try {
    await $fetch(`${getApiBase()}/auth/logout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getClientHeaders(event),
        Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}`,
      },
    })
  } catch {
    // Logout is best-effort; local cookies are always cleared by the caller.
  }
}

export function toAuthUser(data: BackendAuthData): AuthUserPayload {
  return {
    userId: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    provider: data.provider,
  }
}
