<template>
  <span class="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.75 text-[11px] font-semibold tracking-wide capitalize" :class="badgeClass">
    <span class="size-1.5 rounded-full bg-current" :class="{ 'shadow-[0_0_8px_currentColor]': status !== 'archived' }" />
    <span>{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: 'published' | 'draft' | 'archived' | string
}>()

const label = computed(() => {
  if (props.status === 'published') return 'Published'
  if (props.status === 'draft') return 'Draft'
  if (props.status === 'archived') return 'Archived'
  if (props.status === 'pending_review') return 'In Review'
  return props.status
})

const badgeClass = computed(() => {
  if (props.status === 'published') return 'border-emerald-400/30 bg-emerald-400/12 text-emerald-400 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700'
  if (props.status === 'draft') return 'border-amber-400/30 bg-amber-400/12 text-amber-400 light:border-amber-300 light:bg-amber-50 light:text-amber-700'
  if (props.status === 'pending_review') return 'border-blue-400/30 bg-blue-400/12 text-blue-400 light:border-blue-300 light:bg-blue-50 light:text-blue-700'
  if (props.status === 'archived') return 'border-slate-400/30 bg-slate-400/12 text-slate-400 light:border-slate-300 light:bg-slate-100 light:text-slate-600'
  return 'border-white/10 bg-white/5 text-white/60 light:border-slate-200 light:bg-slate-100 light:text-slate-500'
})
</script>
