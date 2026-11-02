export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ name?: unknown }>(event)

  return await backendRequest<unknown>(event, `/admin/categories/${id}`, {
    method: 'PUT',
    body: { name: body?.name },
    csrf: true,
    fallbackMessage: 'Unable to rename this category',
  })
})
