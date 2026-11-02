export default defineEventHandler(async (event) => {
  return await backendRequest<unknown>(event, '/instructor/summary', {
    fallbackMessage: 'Unable to load your summary',
  })
})
