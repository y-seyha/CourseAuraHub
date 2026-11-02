export default defineEventHandler(async (event) => {
  const questionId = encodeURIComponent(getRouterParam(event, 'questionId') ?? '')
  const body = await readBody<{ body?: unknown }>(event)

  return await backendRequest<unknown>(event, `/me/questions/${questionId}/answers`, {
    method: 'POST',
    body: { body: body?.body },
    csrf: true,
    fallbackMessage: 'Unable to post your answer',
  })
})
