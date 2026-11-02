export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return await backendRequest<unknown>(event, '/admin/member-cards/report', {
    query: { days: queryString(query.days) },
    fallbackMessage: 'Unable to load the report',
  })
})
