export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')
  const body = await readBody<{ body?: unknown }>(event)

  return await backendRequest<unknown>(event, `/me/lessons/${lessonId}/questions`, {
    method: 'POST',
    body: { body: body?.body },
    csrf: true,
    fallbackMessage: 'Unable to post your question',
  })
})
