import type { Assignment, AssignmentForm, LessonAnswer, LessonNote, LessonQuestion, OpenQuestionPage, SubmissionPage, SubmissionReview } from '~/types'

/** Q&A, notes and assignments on a lesson, plus the staff queues for them. */
export function useLessonTools() {
  async function fetchQuestions(lessonId: number) {
    return await $fetch<LessonQuestion[]>(`/api/me/lessons/${lessonId}/questions`)
  }

  async function askQuestion(lessonId: number, body: string) {
    return await $fetch<LessonQuestion>(`/api/me/lessons/${lessonId}/questions`, { method: 'POST', body: { body } })
  }

  async function answerQuestion(questionId: number, body: string) {
    return await $fetch<LessonAnswer>(`/api/me/questions/${questionId}/answers`, { method: 'POST', body: { body } })
  }

  async function setResolved(questionId: number, resolved: boolean) {
    return await $fetch<LessonQuestion>(`/api/me/questions/${questionId}/resolved`, { method: 'PATCH', body: { resolved } })
  }

  async function deleteQuestion(questionId: number) {
    return await $fetch(`/api/me/questions/${questionId}`, { method: 'DELETE' })
  }

  async function deleteAnswer(answerId: number) {
    return await $fetch(`/api/me/answers/${answerId}`, { method: 'DELETE' })
  }

  async function fetchNotes(lessonId: number) {
    return await $fetch<LessonNote[]>(`/api/me/lessons/${lessonId}/notes`)
  }

  async function addNote(lessonId: number, note: { body?: string, positionSeconds?: number }) {
    return await $fetch<LessonNote>(`/api/me/lessons/${lessonId}/notes`, { method: 'POST', body: note })
  }

  async function deleteNote(noteId: number) {
    return await $fetch(`/api/me/notes/${noteId}`, { method: 'DELETE' })
  }

  async function fetchAssignment(lessonId: number) {
    return await $fetch<Assignment | null>(`/api/me/lessons/${lessonId}/assignment`)
  }

  async function submitAssignment(lessonId: number, work: { fileUrl?: string, fileName?: string, comment?: string }) {
    return await $fetch<Assignment>(`/api/me/lessons/${lessonId}/assignment/submission`, { method: 'POST', body: work })
  }

  async function fetchAssignmentForStaff(lessonId: number) {
    return await $fetch<Assignment | null>(`/api/instructor/lessons/${lessonId}/assignment`)
  }

  async function saveAssignment(lessonId: number, form: AssignmentForm) {
    return await $fetch<Assignment>(`/api/instructor/lessons/${lessonId}/assignment`, { method: 'PUT', body: form })
  }

  async function removeAssignment(lessonId: number) {
    return await $fetch(`/api/instructor/lessons/${lessonId}/assignment`, { method: 'DELETE' })
  }

  async function fetchOpenQuestions(page = 0, size = 20) {
    return await $fetch<OpenQuestionPage>('/api/instructor/questions', { query: { page: String(page), size: String(size) } })
  }

  async function fetchSubmissions(page = 0, size = 20) {
    return await $fetch<SubmissionPage>('/api/instructor/submissions', { query: { page: String(page), size: String(size) } })
  }

  async function gradeSubmission(id: number, score: number, feedback: string) {
    return await $fetch<SubmissionReview>(`/api/instructor/submissions/${id}/grade`, { method: 'POST', body: { score, feedback } })
  }

  return {
    fetchQuestions,
    askQuestion,
    answerQuestion,
    setResolved,
    deleteQuestion,
    deleteAnswer,
    fetchNotes,
    addNote,
    deleteNote,
    fetchAssignment,
    submitAssignment,
    fetchAssignmentForStaff,
    saveAssignment,
    removeAssignment,
    fetchOpenQuestions,
    fetchSubmissions,
    gradeSubmission
  }
}
