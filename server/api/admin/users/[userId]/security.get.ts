import type { AccountSecurity } from '~/types'

export default defineEventHandler(async (event) => {
  const userId = encodeURIComponent(getRouterParam(event, 'userId') ?? '')

  return await backendRequest<AccountSecurity>(event, `/admin/users/${userId}/security`, {
    fallbackMessage: 'Unable to load this account',
  })
})
