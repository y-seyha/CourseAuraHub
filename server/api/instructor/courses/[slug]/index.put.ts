export default defineEventHandler(async (event) => {
  const slug = encodeURIComponent(getRouterParam(event, 'slug') ?? '')
  const body = await readBody<{ title?: unknown, description?: unknown, price?: unknown, originalPrice?: unknown, category?: unknown, level?: unknown, thumbnail?: unknown, totalLessons?: unknown, totalHours?: unknown, tags?: unknown }>(event)

  return await backendRequest<unknown>(event, `/instructor/courses/${slug}`, {
    method: 'PUT',
    body: { title: body?.title, description: body?.description, price: body?.price, originalPrice: body?.originalPrice, category: body?.category, level: body?.level, thumbnail: body?.thumbnail, totalLessons: body?.totalLessons, totalHours: body?.totalHours, tags: body?.tags },
    csrf: true,
    fallbackMessage: 'Unable to update this course',
  })
})
