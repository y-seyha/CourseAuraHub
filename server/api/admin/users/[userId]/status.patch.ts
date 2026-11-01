import type { AccountSecurity } from '~/types'

export default defineEventHandler(async (event) => {
  const userId = encodeURIComponent(getRouterParam(event, 'userId') ?? '')
  const body = await readBody<{ enabled?: boolean }>(event)

  return await backendRequest<AccountSecurity>(event, `/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { enabled: body?.enabled },
    csrf: true,
    fallbackMessage: 'Unable to update this account',
  })
})
