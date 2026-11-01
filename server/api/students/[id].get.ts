import type { Student } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Student id is required' })
  }

  return await backendRequest<Student>(event, `/students/${encodeURIComponent(id)}`, {
    fallbackMessage: 'Unable to load this student',
  })
})
