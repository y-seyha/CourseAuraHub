<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Questions</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">Learner questions that are still open. Open one to reply on the lesson.</p>
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load questions') }}</p>
    <p v-else-if="!items.length" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">No open questions.</p>

    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="`/learn/${item.courseSlug}?lesson=${item.lessonId}`"
      class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white block no-underline transition-colors hover:border-violet-500/40"
    >
      <div class="flex flex-wrap items-center gap-2 text-xs text-white/45 light:text-slate-500">
        <span class="font-semibold">{{ item.authorName }}</span>
        <span>{{ formatTimeAgo(item.createdAt) }}</span>
        <span class="ml-auto">{{ item.answerCount }} {{ item.answerCount === 1 ? 'reply' : 'replies' }}</span>
      </div>
      <p class="mt-1.5 line-clamp-3 whitespace-pre-line text-[13px] text-slate-100 light:text-slate-900">{{ item.body }}</p>
      <p class="mt-1.5 text-xs text-white/45 light:text-slate-500">{{ item.courseTitle }} · {{ item.lessonTitle }}</p>
    </NuxtLink>

    <div v-if="totalPages > 1" class="flex items-center justify-end gap-3 text-xs text-white/45 light:text-slate-500">
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page === 0" @click="page -= 1">Previous</button>
      <span>Page {{ page + 1 }} of {{ totalPages }}</span>
      <button type="button" class="cursor-pointer font-semibold disabled:cursor-not-allowed disabled:opacity-40" :disabled="page + 1 >= totalPages" @click="page += 1">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLessonTools } from '~/composables/useLessonTools'
import { getErrorMessage } from '~/utils/apiError'
import { formatTimeAgo } from '~/utils/dateTime'

definePageMeta({ requiresStaff: true })
useHead({ title: 'Questions' })

const { fetchOpenQuestions } = useLessonTools()
const page = ref(0)

const { data, pending, error } = await useAsyncData(
  'open-questions',
  () => fetchOpenQuestions(page.value),
  { server: false, watch: [page] }
)
const items = computed(() => data.value?.items ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 0)
</script>
