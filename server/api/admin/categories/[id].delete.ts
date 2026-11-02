export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')

  return await backendRequest<unknown>(event, `/admin/categories/${id}`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to delete this category',
  })
})
