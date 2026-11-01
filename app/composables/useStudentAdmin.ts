import type { AccountSecurity, Enrollment, EnrollmentCreate, Student } from '~/types'

/** Admin tools for one learner: their record, their sign-in account and their enrollments. */
export function useStudentAdmin() {
  async function fetchStudent(id: number) {
    return await $fetch<Student>(`/api/students/${id}`)
  }

  async function fetchAccount(userId: string) {
    return await $fetch<AccountSecurity>(`/api/admin/users/${userId}/security`)
  }

  async function setAccountEnabled(userId: string, enabled: boolean) {
    return await $fetch<AccountSecurity>(`/api/admin/users/${userId}/status`, { method: 'PATCH', body: { enabled } })
  }

  async function unlockAccount(userId: string) {
    return await $fetch<AccountSecurity>(`/api/admin/users/${userId}/unlock`, { method: 'POST' })
  }

  async function revokeSessions(userId: string) {
    return await $fetch(`/api/admin/users/${userId}/sessions`, { method: 'DELETE' })
  }

  async function fetchEnrollments(limit = 100) {
    return await $fetch<Enrollment[]>('/api/enrollments', { query: { limit } })
  }

  async function createEnrollment(enrollment: EnrollmentCreate) {
    return await $fetch<Enrollment>('/api/enrollments', { method: 'POST', body: enrollment })
  }

  async function deleteEnrollment(id: number) {
    return await $fetch(`/api/enrollments/${id}`, { method: 'DELETE' })
  }

  return {
    fetchStudent,
    fetchAccount,
    setAccountEnabled,
    unlockAccount,
    revokeSessions,
    fetchEnrollments,
    createEnrollment,
    deleteEnrollment
  }
}
