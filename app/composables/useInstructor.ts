import type { Category, Course, CourseFormData, InstructorCourse, InstructorStudent, InstructorSummary } from '~/types'

/** The instructor workspace, the admin review that publishes its courses, and the category list. */
export function useInstructor() {
  async function fetchSummary() {
    return await $fetch<InstructorSummary>('/api/instructor/summary')
  }

  async function fetchCourses() {
    return await $fetch<InstructorCourse[]>('/api/instructor/courses')
  }

  async function fetchCourse(slug: string) {
    return await $fetch<InstructorCourse>(`/api/instructor/courses/${slug}`)
  }

  async function createCourse(data: CourseFormData) {
    return await $fetch<InstructorCourse>('/api/instructor/courses', { method: 'POST', body: data })
  }

  async function updateCourse(slug: string, data: CourseFormData) {
    return await $fetch<InstructorCourse>(`/api/instructor/courses/${slug}`, { method: 'PUT', body: data })
  }

  async function deleteCourse(slug: string) {
    return await $fetch(`/api/instructor/courses/${slug}`, { method: 'DELETE' })
  }

  async function submitForReview(slug: string) {
    return await $fetch<InstructorCourse>(`/api/instructor/courses/${slug}/submit`, { method: 'POST' })
  }

  async function fetchStudents(slug: string) {
    return await $fetch<InstructorStudent[]>(`/api/instructor/courses/${slug}/students`)
  }

  async function fetchAwaitingReview() {
    return await $fetch<Course[]>('/api/admin/course-reviews')
  }

  async function approveCourse(slug: string) {
    return await $fetch<Course>(`/api/admin/course-reviews/${slug}/approve`, { method: 'POST' })
  }

  async function rejectCourse(slug: string, note: string) {
    return await $fetch<Course>(`/api/admin/course-reviews/${slug}/reject`, { method: 'POST', body: { note } })
  }

  async function fetchCategories() {
    return await $fetch<Category[]>('/api/categories')
  }

  async function createCategory(name: string) {
    return await $fetch<Category>('/api/admin/categories', { method: 'POST', body: { name } })
  }

  async function renameCategory(id: number, name: string) {
    return await $fetch<Category>(`/api/admin/categories/${id}`, { method: 'PUT', body: { name } })
  }

  async function deleteCategory(id: number) {
    return await $fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
  }

  return {
    fetchSummary,
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    submitForReview,
    fetchStudents,
    fetchAwaitingReview,
    approveCourse,
    rejectCourse,
    fetchCategories,
    createCategory,
    renameCategory,
    deleteCategory
  }
}
