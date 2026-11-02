export default defineEventHandler(async (event) => {
  const questionId = encodeURIComponent(getRouterParam(event, 'questionId') ?? '')

  return await backendRequest<unknown>(event, `/me/questions/${questionId}`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to delete this question',
  })
})
