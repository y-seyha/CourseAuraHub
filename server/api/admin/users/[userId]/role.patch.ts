export default defineEventHandler(async (event) => {
  const userId = encodeURIComponent(getRouterParam(event, 'userId') ?? '')
  const body = await readBody<{ role?: unknown }>(event)

  return await backendRequest<unknown>(event, `/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role: body?.role },
    csrf: true,
    fallbackMessage: 'Unable to change this role',
  })
})
