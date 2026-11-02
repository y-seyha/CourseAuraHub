export default defineEventHandler(async (event) => {
  const slug = encodeURIComponent(getRouterParam(event, 'slug') ?? '')

  return await backendRequest<unknown>(event, `/admin/course-reviews/${slug}/approve`, {
    method: 'POST',
    csrf: true,
    fallbackMessage: 'Unable to approve this course',
  })
})
