export default defineEventHandler(async (event) => {
  return await backendRequest<unknown>(event, '/me/member-card/top-ups', {
    fallbackMessage: 'Unable to load your top-up requests',
  })
})
