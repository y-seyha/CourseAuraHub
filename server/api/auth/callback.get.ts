export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiBase = config.apiBase || 'http://localhost:8080/api/v1'
  
  // Get the query parameters (including any OAuth2 state/code)
  const query = getQuery(event)
  
  try {
    // Call backend callback endpoint to complete OAuth2 and get cookies
    const response = await $fetch.raw(`${apiBase}/auth/callback`, {
      method: 'GET',
      query,
      credentials: 'include',
      redirect: 'manual'
    })
    
    // Forward cookies from backend to frontend
    const setCookieHeaders = response.headers.getSetCookie()
    if (setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        // Parse and set each cookie
        const [cookieString] = cookie.split(';')
        const [name, ...rest] = (cookieString ?? '').split('=')
        const value = rest.join('=')
        if (name && value) {
          // Set cookie with proper options
          const options: Record<string, unknown> = { path: '/' }
          if (cookie.includes('HttpOnly')) options.httpOnly = true
          if (cookie.includes('Secure')) options.secure = true
          if (cookie.includes('SameSite')) {
            const sameSiteMatch = cookie.match(/SameSite=([^;]+)/i)
            if (sameSiteMatch?.[1]) options.sameSite = sameSiteMatch[1].toLowerCase()
          }
          const maxAgeMatch = cookie.match(/Max-Age=(\d+)/i)
          if (maxAgeMatch?.[1]) options.maxAge = parseInt(maxAgeMatch[1], 10)
          setCookie(event, name.trim(), value.trim(), options)
        }
      }
    }
    
    // Get redirect from query or default to dashboard
    const redirect = query.redirect as string || '/'
    
    // Redirect to frontend callback page which will then redirect to dashboard
    // This allows showing a loading state
    return sendRedirect(event, `/auth/callback?redirect=${encodeURIComponent(redirect)}`, 302)
  } catch (error: unknown) {
    // Check if it's a redirect from backend
    if ((error as { statusCode?: number }).statusCode === 302) {
      throw error
    }
    // Redirect to login with error
    return sendRedirect(event, '/auth/login?error=oauth_failed', 302)
  }
})