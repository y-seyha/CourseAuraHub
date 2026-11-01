<template>
  <Teleport to="body">
    <Transition v-bind="modalFade">
      <div v-if="isOpen" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl sm:p-6" @click.self="$emit('close')">
        <div ref="dialogRef" class="max-h-[90dvh] w-full max-w-130 overflow-y-auto overscroll-contain rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(124,58,237,0.15)] focus:outline-none sm:p-6 light:border-violet-500/30 light:bg-white" role="dialog" aria-modal="true" aria-labelledby="student-modal-title" tabindex="-1">
          <div class="flex items-start justify-between gap-4 border-b border-white/8 pb-4 light:border-slate-200">
            <h2 id="student-modal-title" class="text-lg font-bold text-slate-50 light:text-slate-900">Student Details</h2>
            <button type="button" aria-label="Close" class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-500 light:hover:bg-slate-200 light:hover:text-slate-900" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>

          <div v-if="loading" class="mt-5 h-48 animate-pulse rounded-xl bg-white/5 light:bg-slate-100" />
          <p v-else-if="loadError" class="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-[13px] text-rose-300 light:border-rose-200 light:bg-rose-50 light:text-rose-700">{{ loadError }}</p>

          <template v-else-if="student">
            <div class="mt-5 flex items-center gap-3.5">
              <img :src="student.avatar" :alt="student.name" class="size-14 shrink-0 rounded-full border-2 border-violet-500/40 bg-violet-500/20 object-cover">
              <div class="min-w-0">
                <p class="truncate text-base font-bold text-slate-100 light:text-slate-900">{{ student.name }}</p>
                <p class="truncate text-xs text-white/45 light:text-slate-500">{{ student.email }}</p>
              </div>
            </div>

            <dl class="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
              <div v-for="fact in facts" :key="fact.label">
                <dt class="text-[11px] text-white/40 light:text-slate-500">{{ fact.label }}</dt>
                <dd class="font-semibold text-slate-100 light:text-slate-900">{{ fact.value }}</dd>
              </div>
            </dl>

            <section class="mt-5 border-t border-white/8 pt-4 light:border-slate-200">
              <h3 class="text-sm font-bold text-slate-100 light:text-slate-900">Sign-in Account</h3>

              <p v-if="!student.userId" class="mt-2 text-[13px] text-white/45 light:text-slate-500">This learner has no sign-in account.</p>
              <p v-else-if="!account" class="mt-2 text-[13px] text-white/45 light:text-slate-500">Account details are unavailable.</p>

              <template v-else>
                <ul class="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
                  <li v-for="flag in flags" :key="flag.label" class="rounded-full border px-2.25 py-0.75 text-[11px] font-semibold" :class="flag.good ? goodFlag : badFlag">{{ flag.label }}</li>
                </ul>
                <p v-if="account.failedLoginAttempts > 0" class="mt-2 text-xs text-white/45 light:text-slate-500">
                  {{ account.failedLoginAttempts }} failed sign-in attempts
                </p>

                <div v-if="confirming" class="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/8 p-3 light:border-rose-200 light:bg-rose-50">
                  <p class="text-[13px] text-slate-100 light:text-slate-900">{{ confirmMessage }}</p>
                  <div class="mt-2.5 flex gap-2">
                    <button type="button" :class="actionClass" :disabled="working" @click="confirming = null">Cancel</button>
                    <button type="button" :class="dangerClass" :disabled="working" @click="confirmAction">
                      <Loader2 v-if="working" :size="14" class="animate-spin" />
                      Confirm
                    </button>
                  </div>
                </div>

                <div v-else class="mt-3 flex flex-wrap gap-2">
                  <button v-if="account.enabled" type="button" :class="dangerClass" :disabled="working" @click="confirming = 'disable'">Disable Account</button>
                  <button v-else type="button" :class="actionClass" :disabled="working" @click="enable">Enable Account</button>
                  <button v-if="isLocked" type="button" :class="actionClass" :disabled="working" @click="unlock">Unlock</button>
                  <button type="button" :class="actionClass" :disabled="working" @click="confirming = 'sign-out'">Sign Out Everywhere</button>
                </div>
              </template>
            </section>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Loader2, X } from 'lucide-vue-next'
import type { AccountSecurity, Student } from '~/types'
import { useAppToast } from '~/composables/useAppToast'
import { useModalA11y } from '~/composables/useModalA11y'
import { useStudentAdmin } from '~/composables/useStudentAdmin'
import { getErrorMessage } from '~/utils/apiError'

const props = defineProps<{
  studentId: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { fetchStudent, fetchAccount, setAccountEnabled, unlockAccount, revokeSessions } = useStudentAdmin()
const toast = useAppToast()

const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => props.studentId !== null)

useModalA11y({
  isOpen,
  dialogRef,
  onClose: () => emit('close')
})

const modalFade = {
  enterActiveClass: 'transition-opacity duration-250 ease-out',
  leaveActiveClass: 'transition-opacity duration-250 ease-out',
  enterFromClass: 'opacity-0',
  leaveToClass: 'opacity-0'
}

const baseButton = 'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.75 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
const actionClass = `${baseButton} border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700`
const dangerClass = `${baseButton} border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600`
const goodFlag = 'border-emerald-400/30 bg-emerald-400/12 text-emerald-400 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700'
const badFlag = 'border-amber-400/30 bg-amber-400/12 text-amber-400 light:border-amber-300 light:bg-amber-50 light:text-amber-700'

const student = ref<Student | null>(null)
const account = ref<AccountSecurity | null>(null)
const loading = ref(false)
const loadError = ref('')
const working = ref(false)
const confirming = ref<'disable' | 'sign-out' | null>(null)

const isLocked = computed(() => {
  const until = account.value?.lockedUntil
  return Boolean(until && new Date(until) > new Date())
})

const facts = computed(() => {
  const current = student.value
  if (!current) return []
  return [
    { label: 'Enrolled', value: current.enrolledCourses?.length ?? 0 },
    { label: 'Completed', value: current.completedCourses?.length ?? 0 },
    { label: 'Total Spent', value: `$${Number(current.totalSpent).toFixed(2)}` },
    { label: 'Country', value: current.country || '—' }
  ]
})

const flags = computed(() => {
  const current = account.value
  if (!current) return []
  return [
    { label: current.enabled ? 'Enabled' : 'Disabled', good: current.enabled },
    { label: current.emailVerified ? 'Email Verified' : 'Email Not Verified', good: current.emailVerified },
    { label: current.mfaEnabled ? '2FA On' : '2FA Off', good: current.mfaEnabled },
    ...(isLocked.value ? [{ label: 'Locked', good: false }] : [])
  ]
})

const confirmMessage = computed(() => confirming.value === 'disable'
  ? 'Disable this account? The learner is signed out and can\'t sign in until it is enabled again.'
  : 'Sign this learner out on every device?')

watch(() => props.studentId, async (id) => {
  student.value = null
  account.value = null
  loadError.value = ''
  confirming.value = null
  if (id === null) return

  loading.value = true
  try {
    student.value = await fetchStudent(id)
    if (student.value.userId) {
      account.value = await fetchAccount(student.value.userId).catch(() => null)
    }
  } catch (err) {
    loadError.value = getErrorMessage(err, 'Unable to load this student')
  } finally {
    loading.value = false
  }
})

async function run(action: (userId: string) => Promise<AccountSecurity | undefined>, success: string) {
  const userId = account.value?.userId
  if (!userId) return

  working.value = true
  try {
    const updated = await action(userId)
    if (updated) account.value = updated
    toast.success(success)
  } catch (err) {
    toast.error('Action Failed', getErrorMessage(err, 'Unable to update this account'))
  } finally {
    working.value = false
    confirming.value = null
  }
}

function enable() {
  return run(userId => setAccountEnabled(userId, true), 'Account Enabled')
}

function unlock() {
  return run(unlockAccount, 'Account Unlocked')
}

function confirmAction() {
  return confirming.value === 'disable'
    ? run(userId => setAccountEnabled(userId, false), 'Account Disabled')
    : run(async (userId) => { await revokeSessions(userId) }, 'Signed Out Everywhere')
}
</script>
