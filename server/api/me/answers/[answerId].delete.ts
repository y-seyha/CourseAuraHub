export default defineEventHandler(async (event) => {
  const answerId = encodeURIComponent(getRouterParam(event, 'answerId') ?? '')

  return await backendRequest<unknown>(event, `/me/answers/${answerId}`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to delete this answer',
  })
})
