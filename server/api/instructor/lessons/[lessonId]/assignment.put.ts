export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')
  const body = await readBody<{ instructions?: unknown, passScore?: unknown, required?: unknown }>(event)

  return await backendRequest<unknown>(event, `/instructor/lessons/${lessonId}/assignment`, {
    method: 'PUT',
    body: { instructions: body?.instructions, passScore: body?.passScore, required: body?.required },
    csrf: true,
    fallbackMessage: 'Unable to save this assignment',
  })
})
