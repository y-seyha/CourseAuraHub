export default defineEventHandler(async (event) => {
  const userId = encodeURIComponent(getRouterParam(event, 'userId') ?? '')

  return await backendRequest<null>(event, `/admin/users/${userId}/sessions`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to sign this account out',
  })
})
