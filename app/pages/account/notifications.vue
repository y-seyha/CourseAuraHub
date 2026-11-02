<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">{{ t('Notifications') }}</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">{{ t('Choose where your notifications reach you.') }}</p>
    </div>

    <div class="max-w-2xl">
      <TelegramCard />

      <section class="mt-5 rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
        <label class="flex items-center justify-between gap-4">
          <span>
            <span class="block text-sm font-bold text-slate-100 light:text-slate-900">{{ t('Reminders') }}</span>
            <span class="mt-0.5 block text-xs text-white/45 light:text-slate-500">{{ t('Get a nudge when you haven\'t continued a course for a while.') }}</span>
          </span>
          <input v-model="remindersOn" type="checkbox" class="size-4.5 shrink-0 accent-violet-600" :disabled="savingReminders" @change="saveReminders">
        </label>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import TelegramCard from '~/components/account/TelegramCard.vue'
import { useAppToast } from '~/composables/useAppToast'
import { getErrorMessage } from '~/utils/apiError'

const { t } = useT()

useHead({ title: () => t('Notifications') })

const toast = useAppToast()
const remindersOn = ref(true)
const savingReminders = ref(false)

onMounted(async () => {
  const saved = await $fetch<{ enabled: boolean }>('/api/me/reminders').catch(() => null)
  if (saved) remindersOn.value = saved.enabled
})

async function saveReminders() {
  savingReminders.value = true
  try {
    await $fetch('/api/me/reminders', { method: 'PUT', body: { enabled: remindersOn.value } })
  } catch (err) {
    remindersOn.value = !remindersOn.value
    toast.error(t('Setting not saved'), getErrorMessage(err, t('Please try again.')))
  } finally {
    savingReminders.value = false
  }
}
</script>
