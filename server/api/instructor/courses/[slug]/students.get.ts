export default defineEventHandler(async (event) => {
  const slug = encodeURIComponent(getRouterParam(event, 'slug') ?? '')

  return await backendRequest<unknown>(event, `/instructor/courses/${slug}/students`, {
    fallbackMessage: 'Unable to load this course\'s learners',
  })
})
