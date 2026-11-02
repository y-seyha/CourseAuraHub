export default defineEventHandler(async (event) => {
  const slug = encodeURIComponent(getRouterParam(event, 'slug') ?? '')

  return await backendRequest<unknown>(event, `/instructor/courses/${slug}/submit`, {
    method: 'POST',
    csrf: true,
    fallbackMessage: 'Unable to send this course for review',
  })
})
