export default defineEventHandler(async (event) => {
  return await backendRequest<unknown>(event, '/me/reminders', {
    fallbackMessage: 'Unable to load your reminder setting',
  })
})
