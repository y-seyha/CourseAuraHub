export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')

  return await backendRequest<unknown>(event, `/instructor/lessons/${lessonId}/assignment`, {
    fallbackMessage: 'Unable to load this assignment',
  })
})
