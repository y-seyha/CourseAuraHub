export default defineEventHandler(async (event) => {
  const id = encodeURIComponent(getRouterParam(event, 'id') ?? '')
  const body = await readBody<{ score?: unknown, feedback?: unknown }>(event)

  return await backendRequest<unknown>(event, `/instructor/submissions/${id}/grade`, {
    method: 'POST',
    body: { score: body?.score, feedback: body?.feedback },
    csrf: true,
    fallbackMessage: 'Unable to save this grade',
  })
})
