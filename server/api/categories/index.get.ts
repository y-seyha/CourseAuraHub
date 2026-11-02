export default defineEventHandler(async (event) => {
  return await backendRequest<unknown>(event, '/categories', {
    fallbackMessage: 'Unable to load categories',
  })
})
