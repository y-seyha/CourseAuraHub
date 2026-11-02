export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')

  return await backendRequest<unknown>(event, `/me/lessons/${lessonId}/notes`, {
    fallbackMessage: 'Unable to load your notes',
  })
})
