export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')

  return await backendRequest<null>(event, `/admin/member-cards/${id}`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to delete this card',
  })
})
