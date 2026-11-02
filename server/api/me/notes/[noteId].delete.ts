export default defineEventHandler(async (event) => {
  const noteId = encodeURIComponent(getRouterParam(event, 'noteId') ?? '')

  return await backendRequest<unknown>(event, `/me/notes/${noteId}`, {
    method: 'DELETE',
    csrf: true,
    fallbackMessage: 'Unable to delete your note',
  })
})
