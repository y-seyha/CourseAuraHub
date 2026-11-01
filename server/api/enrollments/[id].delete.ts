export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Enrollment id is required' })
  }

  return await backendRequest<null>(event, `/enrollments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to remove this enrollment',
  })
})
