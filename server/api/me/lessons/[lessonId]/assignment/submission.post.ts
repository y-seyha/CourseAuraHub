export default defineEventHandler(async (event) => {
  const lessonId = encodeURIComponent(getRouterParam(event, 'lessonId') ?? '')
  const body = await readBody<{ fileUrl?: unknown, fileName?: unknown, comment?: unknown }>(event)

  return await backendRequest<unknown>(event, `/me/lessons/${lessonId}/assignment/submission`, {
    method: 'POST',
    body: { fileUrl: body?.fileUrl, fileName: body?.fileName, comment: body?.comment },
    csrf: true,
    fallbackMessage: 'Unable to submit your work',
  })
})
