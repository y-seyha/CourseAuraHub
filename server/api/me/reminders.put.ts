export default defineEventHandler(async (event) => {
  const body = await readBody<{ enabled?: unknown }>(event)

  return await backendRequest<unknown>(event, '/me/reminders', {
    method: 'PUT',
    body: { enabled: body?.enabled },
    csrf: true,
    fallbackMessage: 'Unable to save your reminder setting',
  })
})
