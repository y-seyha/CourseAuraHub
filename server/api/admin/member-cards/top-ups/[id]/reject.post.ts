export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ note?: unknown }>(event)

  return await backendRequest<unknown>(event, `/admin/member-cards/top-ups/${id}/reject`, {
    method: 'POST',
    body: { note: body?.note },
    csrf: true,
    fallbackMessage: 'Unable to reject this request',
  })
})
