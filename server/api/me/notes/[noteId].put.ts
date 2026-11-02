export default defineEventHandler(async (event) => {
  const noteId = encodeURIComponent(getRouterParam(event, 'noteId') ?? '')
  const body = await readBody<{ body?: unknown, positionSeconds?: unknown }>(event)

  return await backendRequest<unknown>(event, `/me/notes/${noteId}`, {
    method: 'PUT',
    body: { body: body?.body, positionSeconds: body?.positionSeconds },
    csrf: true,
    fallbackMessage: 'Unable to save your note',
  })
})
