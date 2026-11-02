export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')

  return await backendRequest<unknown>(event, `/admin/member-cards/top-ups/${id}/approve`, {
    method: 'POST',
    csrf: true,
    fallbackMessage: 'Unable to approve this request',
  })
})
