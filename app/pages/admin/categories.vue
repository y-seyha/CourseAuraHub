<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">Categories</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">The categories courses can be filed under.</p>
    </div>

    <form class="flex max-w-lg items-center gap-2" @submit.prevent="add">
      <input v-model="newName" type="text" maxlength="100" placeholder="New category" aria-label="New category" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400">
      <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shrink-0" :disabled="busy || !newName.trim()">Add</button>
    </form>

    <div v-if="pending" class="h-40 animate-pulse rounded-[18px] bg-white/5 light:bg-slate-100" />
    <p v-else-if="error" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">{{ getErrorMessage(error, 'Unable to load categories') }}</p>
    <p v-else-if="!categories.length" class="rounded-[18px] border border-white/10 bg-white/5 px-5 py-12 text-center text-[13px] text-white/45 light:border-slate-200 light:bg-white light:text-slate-500">No categories yet.</p>

    <div v-else class="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5 light:border-slate-200 light:bg-white">
      <table class="w-full min-w-120 border-collapse text-left text-[13px]">
        <thead>
          <tr class="border-b border-white/8 text-[11px] tracking-wider text-white/40 uppercase light:border-slate-200 light:text-slate-500">
            <th class="px-4 py-3 font-semibold">Name</th>
            <th class="px-4 py-3 font-semibold">Courses</th>
            <th class="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/6 light:divide-slate-200">
          <tr v-for="item in categories" :key="item.id">
            <td class="px-4 py-3">
              <form v-if="editingId === item.id" class="flex items-center gap-2" @submit.prevent="rename(item)">
                <input v-model="editName" type="text" required maxlength="100" aria-label="Category name" class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400">
                <button type="submit" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-violet-500/35 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 light:border-violet-200 light:bg-violet-50 light:text-violet-700" :disabled="busy || !editName.trim()">Save</button>
                <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="editingId = null">Cancel</button>
              </form>
              <span v-else class="font-semibold text-[13px] text-slate-100 light:text-slate-900">{{ item.name }}</span>
            </td>
            <td class="px-4 py-3 text-white/70 light:text-slate-600">{{ item.courseCount }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-white/10 bg-white/5 text-white/75 hover:bg-white/9 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-700" @click="startEdit(item)">Rename</button>
              <button type="button" class="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 light:border-rose-200 light:bg-rose-50 light:text-rose-600 ml-2" :disabled="item.courseCount > 0" :title="item.courseCount > 0 ? 'Move its courses first' : undefined" @click="pendingDelete = item">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDeleteModal
      :is-open="pendingDelete !== null"
      title="Delete Category"
      description="This category will no longer be available for courses."
      :item-name="pendingDelete?.name"
      :loading="busy"
      @close="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types'
import ConfirmDeleteModal from '~/components/shared/ConfirmDeleteModal.vue'
import { useAppToast } from '~/composables/useAppToast'
import { useInstructor } from '~/composables/useInstructor'
import { getErrorMessage } from '~/utils/apiError'

definePageMeta({ requiresAdmin: true })
useHead({ title: 'Categories' })

const toast = useAppToast()
const { fetchCategories, createCategory, renameCategory, deleteCategory } = useInstructor()

const { data, pending, error, refresh } = await useAsyncData('admin-categories', fetchCategories, { server: false })
const categories = computed(() => data.value ?? [])

const newName = ref('')
const editName = ref('')
const editingId = ref<number | null>(null)
const pendingDelete = ref<Category | null>(null)
const busy = ref(false)

function startEdit(item: Category) {
  editingId.value = item.id
  editName.value = item.name
}

async function act(action: () => Promise<unknown>, failure: string) {
  busy.value = true
  try {
    await action()
    await refresh()
  } catch (err) {
    toast.error(failure, getErrorMessage(err, 'Please try again.'))
  } finally {
    busy.value = false
  }
}

function add() {
  return act(async () => {
    await createCategory(newName.value.trim())
    newName.value = ''
  }, 'Category Not Added')
}

function rename(item: Category) {
  return act(async () => {
    await renameCategory(item.id, editName.value.trim())
    editingId.value = null
  }, 'Category Not Renamed')
}

function confirmDelete() {
  const item = pendingDelete.value
  if (!item) return
  return act(async () => {
    await deleteCategory(item.id)
    pendingDelete.value = null
  }, 'Category Not Deleted')
}
</script>
