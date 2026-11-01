<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">{{ t('Member Card') }}</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">{{ t('Keep a balance on your card and use it to pay for courses.') }}</p>
    </div>

    <div v-if="pending" class="h-48 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />

    <p v-else-if="error" class="rounded-[18px] border border-rose-500/25 bg-rose-500/8 px-5 py-6 text-center text-[13px] text-rose-300 light:border-rose-200 light:bg-rose-50 light:text-rose-700">
      {{ getErrorMessage(error, t('Unable to load your member card')) }}
    </p>

    <!-- Card and history -->
    <div v-else-if="card" class="grid items-start gap-5 lg:grid-cols-[380px_1fr]">
      <div class="flex min-h-52 flex-col justify-between gap-4 rounded-[20px] border border-violet-500/40 bg-linear-to-br from-violet-700 to-indigo-800 p-5 text-white shadow-[0_0_40px_rgba(124,58,237,0.25)]">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2 text-sm font-bold"><CreditCard :size="18" /> CourseAuraHub</div>
          <span class="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
            {{ card.status === 'ACTIVE' ? t('Active') : t('Suspended') }}
          </span>
        </div>
        <div>
          <p class="text-[11px] text-white/70">{{ t('Balance') }}</p>
          <p class="text-3xl font-extrabold">{{ formatMoney(card.balance, card.currency) }}</p>
        </div>
        <div class="flex items-end justify-between gap-3 text-xs">
          <span class="truncate font-semibold">{{ card.holderName }}</span>
          <span class="shrink-0 font-mono tracking-wide">{{ card.cardNumber }}</span>
        </div>
      </div>

      <section class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
        <h2 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Transaction History') }}</h2>
        <p v-if="card.status === 'SUSPENDED'" class="mt-2 text-xs text-amber-400 light:text-amber-700">{{ t('This card is suspended, so it can\'t pay for courses right now.') }}</p>
        <MemberCardHistory class="mt-1" :transactions="transactions" :currency="card.currency" />
      </section>
    </div>

    <!-- Waiting for review -->
    <div v-else-if="application?.status === 'PENDING'" class="rounded-[18px] border border-white/10 bg-white/5 px-6 py-12 text-center light:border-slate-200 light:bg-white">
      <Clock :size="36" class="mx-auto text-violet-300 light:text-violet-700" />
      <h2 class="mt-3 text-lg font-bold text-slate-100 light:text-slate-900">{{ t('Your application is being reviewed') }}</h2>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">{{ t('We\'ll notify you as soon as an admin has reviewed it.') }}</p>
    </div>

    <!-- Application form -->
    <form v-else class="max-w-2xl rounded-[18px] border border-white/10 bg-white/5 p-5 sm:p-6 light:border-slate-200 light:bg-white" @submit.prevent="submit">
      <div v-if="application?.status === 'REJECTED'" class="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-300 light:border-amber-200 light:bg-amber-50 light:text-amber-800" role="status">
        {{ t('Your last application was declined: {reason}', { reason: application.reviewNote ?? '' }) }}
      </div>

      <h2 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Apply for a member card') }}</h2>
      <div class="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label :class="labelClass" for="card-name">{{ t('Full name') }}</label>
          <input id="card-name" v-model="form.fullName" type="text" required maxlength="150" autocomplete="name" :class="inputClass">
          <p v-if="fieldErrors.fullName" class="text-[11px] text-rose-400">{{ fieldErrors.fullName }}</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass" for="card-phone">{{ t('Phone number') }}</label>
          <input id="card-phone" v-model="form.phone" type="tel" required maxlength="20" autocomplete="tel" placeholder="+855 12 345 678" :class="inputClass">
          <p v-if="fieldErrors.phone" class="text-[11px] text-rose-400">{{ fieldErrors.phone }}</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass" for="card-birth">{{ t('Date of birth') }}</label>
          <input id="card-birth" v-model="form.dateOfBirth" type="date" required :max="today" :class="inputClass">
          <p v-if="fieldErrors.dateOfBirth" class="text-[11px] text-rose-400">{{ fieldErrors.dateOfBirth }}</p>
        </div>
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label :class="labelClass" for="card-address">{{ t('Address') }}</label>
          <textarea id="card-address" v-model="form.address" rows="3" required maxlength="500" autocomplete="street-address" :class="inputClass" />
          <p v-if="fieldErrors.address" class="text-[11px] text-rose-400">{{ fieldErrors.address }}</p>
        </div>
      </div>
      <button type="submit" class="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.25 text-[13px] font-semibold text-white transition-all hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting">
        <Loader2 v-if="submitting" :size="15" class="animate-spin" />
        {{ t('Submit application') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Clock, CreditCard, Loader2 } from 'lucide-vue-next'
import type { MemberCardApplicationForm, MemberCardTransaction } from '~/types'
import MemberCardHistory from '~/components/membercard/MemberCardHistory.vue'
import { formatMoney } from '~/composables/useCart'
import { useAppToast } from '~/composables/useAppToast'
import { useMemberCard } from '~/composables/useMemberCard'
import { getErrorMessage, toApiError } from '~/utils/apiError'

const { t } = useT()
useHead({ title: () => t('Member Card') })

const toast = useAppToast()
const { fetchMine, fetchMyTransactions, apply } = useMemberCard()

const labelClass = 'text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600'
const inputClass = 'w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400'

const { data, pending, error, refresh } = await useAsyncData('my-member-card', fetchMine, { server: false })
const card = computed(() => data.value?.card ?? null)
const application = computed(() => data.value?.application ?? null)

const transactions = ref<MemberCardTransaction[]>([])
watch(() => card.value?.id, async (id) => {
  if (id === undefined) return
  try {
    transactions.value = (await fetchMyTransactions(0, 50)).items
  } catch (err) {
    toast.error(t('Unable to load your member card'), getErrorMessage(err, t('Please try again.')))
  }
}, { immediate: true })

const today = new Date().toISOString().slice(0, 10)
const form = reactive<MemberCardApplicationForm>({ fullName: '', phone: '', dateOfBirth: '', address: '' })
const fieldErrors = ref<Record<string, string>>({})
const submitting = ref(false)

async function submit() {
  submitting.value = true
  fieldErrors.value = {}
  try {
    await apply({ ...form, fullName: form.fullName.trim(), phone: form.phone.trim(), address: form.address.trim() })
    toast.success(t('Application sent'), t('We\'ll notify you as soon as an admin has reviewed it.'))
    await refresh()
  } catch (err) {
    const apiError = toApiError(err, t('Unable to send your application'))
    fieldErrors.value = apiError.fieldErrors
    toast.error(t('Application not sent'), apiError.message)
  } finally {
    submitting.value = false
  }
}
</script>
