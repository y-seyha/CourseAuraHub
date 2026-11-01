import type { Enrollment, EnrollmentCreate } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<EnrollmentCreate>(event)

  return await backendRequest<Enrollment>(event, '/enrollments', {
    method: 'POST',
    body: {
      studentId: body?.studentId,
      courseId: body?.courseId,
      amount: body?.amount,
      enrolledAt: body?.enrolledAt || undefined,
    },
    csrf: true,
    fallbackMessage: 'Unable to enroll this student',
  })
})
