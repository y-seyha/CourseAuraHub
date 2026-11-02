<template>
  <Teleport to="body">
    <Transition v-bind="modalFade">
      <div v-if="isOpen" class="fixed inset-0 z-100 flex items-center justify-center bg-[#05050c]/82 p-4 backdrop-blur-xl sm:p-6" @click.self="$emit('close')">
        <div ref="dialogRef" class="max-h-[90dvh] w-full max-w-170 overflow-y-auto overscroll-contain rounded-[20px] border border-violet-500/25 bg-[#0f1019] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(124,58,237,0.15)] focus:outline-none sm:p-6 light:border-violet-500/30 light:bg-white light:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15),0_0_35px_rgba(124,58,237,0.12)]" role="dialog" aria-modal="true" aria-labelledby="course-modal-title" tabindex="-1">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 border-b border-white/8 pb-4.5 light:border-slate-200">
            <div class="flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-violet-500/30 bg-violet-500/15">
                <BookPlus v-if="!isEdit" :size="20" class="text-violet-400" />
                <FileEdit v-else :size="20" class="text-violet-400" />
              </div>
              <div>
                <h2 id="course-modal-title" class="text-lg font-bold text-slate-50 light:text-slate-900">{{ isEdit ? 'Edit Course' : 'Create New Course' }}</h2>
                <p class="mt-0.5 text-xs text-white/45 light:text-slate-500">
                  {{ isEdit ? 'Update course curriculum, pricing, and status.' : 'Fill in the details to publish or draft a new course.' }}
                </p>
              </div>
            </div>
            <button type="button" class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-500 light:hover:bg-slate-200 light:hover:text-slate-900" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>

          <!-- Form -->
          <form class="mt-5 flex flex-col gap-4" @submit.prevent="handleSubmit">
            <!-- Row: Title & Category -->
            <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div class="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Course Title *</label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="e.g. Master Nuxt 3 Full-Stack Architecture"
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="course-category">Category</label>
                <AppDropdown id="course-category" v-model="form.category" :options="categoryOptions" />
              </div>
            </div>

            <!-- Row: Instructor, Level, Status -->
            <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div v-if="!instructorMode" class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Instructor Name</label>
                <input
                  v-model="form.instructor"
                  type="text"
                  placeholder="e.g. Alex Chen"
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="course-level">Difficulty Level</label>
                <AppDropdown id="course-level" v-model="form.level" :options="levelOptions" />
              </div>

              <div v-if="!instructorMode" class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600" for="course-status">Publishing Status</label>
                <AppDropdown id="course-status" v-model="form.status" :options="statusOptions" />
              </div>
            </div>

            <!-- Row: Pricing & Volume -->
            <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Price ($ USD) *</label>
                <input
                  v-model.number="form.price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="99.99"
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Original Price ($ USD)</label>
                <input
                  v-model.number="form.originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="149.99"
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Total Lessons</label>
                <input
                  v-model.number="form.totalLessons"
                  type="number"
                  min="0"
                  placeholder="45"
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
              </div>

              <div class="flex min-w-0 flex-col gap-1.5">
                <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Duration (Hours)</label>
                <input
                  v-model.number="form.totalHours"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="12.5"
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
              </div>
            </div>

            <!-- Row: Thumbnail URL with preview -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Thumbnail Image</label>
              <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <input
                  v-model="form.thumbnail"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
                >
                <FileUploadButton
                  v-model:busy="uploading"
                  class="shrink-0"
                  purpose="COURSE_THUMBNAIL"
                  accept="image/jpeg,image/png,image/webp"
                  label="Upload image"
                  @uploaded="form.thumbnail = $event.url"
                />
              </div>
              <div v-if="form.thumbnail" class="mt-2 aspect-video max-w-55 overflow-hidden rounded-[10px] border border-white/10 light:border-slate-200">
                <img :src="form.thumbnail" alt="Preview" class="size-full object-cover" >
              </div>
            </div>

            <!-- Row: Description -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Course Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Comprehensive course overview covering key learning milestones and techniques..."
                class="w-full resize-y rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
              />
            </div>

            <!-- Row: Tags -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-wider text-white/60 uppercase light:text-slate-600">Tags (comma-separated)</label>
              <input
                v-model="rawTags"
                type="text"
                placeholder="Nuxt 3, Vue, TypeScript, Tailwind"
                class="w-full rounded-[10px] border border-white/10 bg-white/4 px-3.5 py-2.5 text-[13px] text-slate-100 outline-none transition-all duration-200 placeholder:text-white/30 focus:border-violet-500/50 focus:bg-white/7 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] focus:ring-2 focus:ring-violet-500/15 light:border-slate-300 light:bg-white light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
              >
            </div>

            <!-- Footer Actions -->
            <div class="mt-2 flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:justify-end light:border-slate-200">
              <button
                type="button"
                class="w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-5 py-2.5 text-[13px] font-medium text-white/70 transition-all enabled:hover:bg-white/9 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 sm:w-auto light:border-slate-200 light:bg-slate-100 light:text-slate-700 light:enabled:hover:bg-slate-200 light:enabled:hover:text-slate-900"
                :disabled="loading"
                @click="$emit('close')"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white transition-all enabled:hover:from-violet-500 enabled:hover:to-indigo-500 enabled:hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 sm:w-auto"
                :disabled="loading || uploading"
              >
                <Loader2 v-if="loading" :size="16" class="animate-spin" />
                <span>{{ loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { BookPlus, FileEdit, X, Loader2 } from 'lucide-vue-next'
import { useModalA11y } from '~/composables/useModalA11y'
import AppDropdown from '~/components/shared/AppDropdown.vue'
import FileUploadButton from '~/components/shared/FileUploadButton.vue'
import { useInstructor } from '~/composables/useInstructor'
import type { Course, CourseFormData } from '~/types'

const levelOptions = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' }
]
const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'pending_review', label: 'In Review' },
  { value: 'archived', label: 'Archived' }
]

const props = defineProps<{
  isOpen: boolean
  course?: Course | null
  loading?: boolean
  // Instructors teach under their own name, and only a review can publish
  instructorMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: CourseFormData): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const isOpen = computed(() => props.isOpen)

useModalA11y({
  isOpen,
  dialogRef,
  onClose: () => emit('close')
})

const isEdit = computed(() => !!props.course)

const { fetchCategories } = useInstructor()
const categories = ref<string[]>([])
// The saved value stays selectable even if its category was since removed
const categoryOptions = computed(() => [...new Set([...categories.value, form.category])].map(name => ({ value: name, label: name })))

onMounted(async () => {
  categories.value = (await fetchCategories().catch(() => [])).map(category => category.name)
})

const modalFade = {
  enterActiveClass: 'transition-opacity duration-250 ease-out',
  leaveActiveClass: 'transition-opacity duration-250 ease-out',
  enterFromClass: 'opacity-0',
  leaveToClass: 'opacity-0'
}

const form = reactive<CourseFormData>({
  title: '',
  description: '',
  instructor: '',
  category: 'Web Development',
  level: 'Intermediate',
  status: 'draft',
  price: 99.99,
  originalPrice: 149.99,
  totalLessons: 40,
  totalHours: 12.0,
  thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop',
  tags: ['Nuxt 3', 'Vue 3']
})

const rawTags = ref('')
const uploading = ref(false)

watch(
  () => props.course,
  (c) => {
    if (c) {
      form.title = c.title
      form.description = c.description
      form.instructor = c.instructor
      form.category = c.category
      form.level = c.level
      form.status = c.status
      form.price = c.price
      form.originalPrice = c.originalPrice
      form.totalLessons = c.totalLessons
      form.totalHours = c.totalHours
      form.thumbnail = c.thumbnail
      form.tags = [...(c.tags || [])]
      rawTags.value = (c.tags || []).join(', ')
    } else {
      form.title = ''
      form.description = ''
      form.instructor = ''
      form.category = 'Web Development'
      form.level = 'Intermediate'
      form.status = 'draft'
      form.price = 99.99
      form.originalPrice = 149.99
      form.totalLessons = 40
      form.totalHours = 12.0
      form.thumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop'
      form.tags = ['Nuxt 3', 'Vue 3']
      rawTags.value = 'Nuxt 3, Vue 3'
    }
  },
  { immediate: true }
)

function handleSubmit() {
  form.tags = rawTags.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
  emit('submit', { ...form })
}
</script>
