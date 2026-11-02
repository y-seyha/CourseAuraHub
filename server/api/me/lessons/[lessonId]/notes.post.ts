export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')
  const body = await readBody<{ body?: unknown, positionSeconds?: unknown }>(event)

  return await backendRequest<unknown>(event, `/me/lessons/${lessonId}/notes`, {
    method: 'POST',
    body: { body: body?.body, positionSeconds: body?.positionSeconds },
    csrf: true,
    fallbackMessage: 'Unable to save your note',
  })
})
