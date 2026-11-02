export default defineEventHandler(async (event) => {
  const questionId = encodeURIComponent(getRouterParam(event, 'questionId') ?? '')
  const body = await readBody<{ resolved?: unknown }>(event)

  return await backendRequest<unknown>(event, `/me/questions/${questionId}/resolved`, {
    method: 'PATCH',
    body: { resolved: body?.resolved },
    csrf: true,
    fallbackMessage: 'Unable to update this question',
  })
})
