export default defineEventHandler(async (event) => {
  return await backendRequest<unknown>(event, '/admin/course-reviews', {
    fallbackMessage: 'Unable to load courses waiting for review',
  })
})
