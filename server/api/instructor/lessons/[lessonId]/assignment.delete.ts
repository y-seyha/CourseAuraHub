export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')

  return await backendRequest<unknown>(event, `/instructor/lessons/${lessonId}/assignment`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to remove this assignment',
  })
})
