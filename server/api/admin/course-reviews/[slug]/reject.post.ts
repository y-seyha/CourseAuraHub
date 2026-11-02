export default defineEventHandler(async (event) => {
  const slug = encodeURIComponent(getRouterParam(event, 'slug') ?? '')
  const body = await readBody<{ note?: unknown }>(event)

  return await backendRequest<unknown>(event, `/admin/course-reviews/${slug}/reject`, {
    method: 'POST',
    body: { note: body?.note },
    csrf: true,
    fallbackMessage: 'Unable to send this course back',
  })
})
