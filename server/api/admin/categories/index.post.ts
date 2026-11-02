export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: unknown }>(event)

  return await backendRequest<unknown>(event, '/admin/categories', {
    method: 'POST',
    body: { name: body?.name },
    csrf: true,
    fallbackMessage: 'Unable to create this category',
  })
})
