export default defineEventHandler(async (event) => {
  return await backendRequest<unknown>(event, '/instructor/courses', {
    fallbackMessage: 'Unable to load your courses',
  })
})
