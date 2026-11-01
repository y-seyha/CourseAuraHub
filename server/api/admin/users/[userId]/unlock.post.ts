import type { AccountSecurity } from '~/types'

export default defineEventHandler(async (event) => {
  const userId = encodeURIComponent(getRouterParam(event, 'userId') ?? '')

  return await backendRequest<AccountSecurity>(event, `/admin/users/${userId}/unlock`, {
    method: 'POST',
    csrf: true,
    fallbackMessage: 'Unable to unlock this account',
  })
})
