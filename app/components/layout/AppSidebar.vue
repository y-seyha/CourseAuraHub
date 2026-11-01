<template>
  <div>
    <!-- Mobile Backdrop -->
    <Transition v-bind="fadeBackdrop">
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
        @click="$emit('close-mobile')"
      />
    </Transition>

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-65 flex-col overflow-hidden border-r border-white/6 bg-zinc-950/95 backdrop-blur-xl transition-[width,transform] duration-300 ease-out max-md:shadow-2xl max-md:shadow-black/70 light:border-slate-200 light:bg-white/98"
      :class="[
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        collapsed ? 'md:w-18' : 'md:w-65'
      ]"
    >
      <!-- Logo -->
      <div class="flex min-h-18 items-center gap-3 border-b border-white/6 px-4.5 py-5 light:border-slate-200">
        <div class="flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 9V19L14 26L2 19V9L14 2Z" fill="url(#logoGrad)" />
            <path d="M14 8L20 11.5V18.5L14 22L8 18.5V11.5L14 8Z" fill="rgba(255,255,255,0.15)" />
            <defs>
              <linearGradient id="logoGrad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                <stop stop-color="#7c3aed" />
                <stop offset="1" stop-color="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <Transition v-bind="fadeText">
          <div v-if="!collapsed" class="leading-none">
            <span class="block text-sm font-bold tracking-tight text-slate-200 light:text-slate-900">{{ t('CourseAuraHub') }}</span>
            <span class="mt-0.5 block text-[10px] font-medium tracking-widest text-violet-400 uppercase light:text-violet-700">{{ t('Academy') }}</span>
          </div>
        </Transition>
      </div>

      <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-4">
        <div v-for="section in navSections" :key="section.label" class="mb-2">
          <Transition v-bind="fadeText">
            <p v-if="!collapsed" class="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase light:text-slate-400">
              {{ t(section.label) }}
            </p>
          </Transition>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :aria-label="item.label"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :title="collapsed ? t(item.label) : undefined"
            class="group relative flex items-center gap-2.5 overflow-hidden rounded-[10px] border px-3 py-2.5 text-sm font-medium whitespace-nowrap no-underline transition-all duration-200 ease-out hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            :class="isActive(item.to)
              ? 'border-violet-500/40 bg-linear-to-br from-violet-600/25 to-blue-600/15 text-violet-300 hover:border-violet-500/55 hover:from-violet-600/35 hover:to-blue-600/25 hover:text-violet-200 light:border-violet-500/30 light:bg-violet-500/10 light:text-violet-700 light:hover:bg-violet-500/15 light:hover:text-violet-700'
              : 'border-transparent text-white/55 hover:border-white/8 hover:bg-white/8 hover:text-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)] light:text-slate-600 light:hover:border-slate-200 light:hover:bg-slate-100 light:hover:text-slate-900'"
            @click="$emit('close-mobile')"
          >
            <span
              aria-hidden="true"
              class="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)] transition-opacity duration-200"
              :class="isActive(item.to) ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'"
            />
            <component
              :is="item.icon"
              :size="20"
              class="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110"
              :class="!isActive(item.to) ? 'group-hover:text-violet-300 light:group-hover:text-violet-700' : ''"
              :stroke-width="1.5"
            />
            <Transition v-bind="fadeText">
              <span v-if="!collapsed" class="text-sm font-medium">{{ t(item.label) }}</span>
            </Transition>
            <Transition v-bind="fadeText">
              <span
                v-if="!collapsed && item.badge"
                class="ml-auto rounded-full border border-violet-500/30 bg-violet-500/20 px-1.75 py-px text-[10px] font-semibold text-violet-300 light:border-violet-300 light:bg-violet-100 light:text-violet-700"
              >
                {{ item.badge }}
              </span>
            </Transition>
          </NuxtLink>
        </div>
      </nav>

      <!-- Bottom profile -->
      <button
        type="button"
        class="group flex min-h-18 w-full cursor-pointer items-center gap-2.5 border-t border-white/6 px-4.5 py-4 text-left transition-all duration-200 ease-out hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/60 light:border-slate-200 light:hover:bg-slate-50"
        :title="t('Open profile settings')"
        @click="handleProfileClick"
      >
        <img
          :src="auth.userAvatar"
          :alt="`${auth.userName} profile`"
          class="size-9 shrink-0 rounded-full border-2 border-violet-500/40 bg-[#1a1a2e] transition-all duration-200 group-hover:scale-105 group-hover:border-violet-500/70 group-hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] light:border-violet-300 light:bg-violet-50"
        >
        <Transition v-bind="fadeText">
          <div v-if="!collapsed" class="min-w-0">
            <p class="truncate text-[13px] font-semibold text-slate-200 light:text-slate-900">{{ auth.userName }}</p>
            <p class="mt-px truncate text-[11px] text-white/40 light:text-slate-500">{{ auth.roleLabel }}</p>
          </div>
        </Transition>
      </button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  BarChart3,
  Bell,
  GraduationCap,
  UserPlus,
  Heart,
  CreditCard,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Tag,
  TicketPercent,
  Trophy,
  UserCog
} from 'lucide-vue-next'

const { t } = useT()

withDefaults(
  defineProps<{
    collapsed: boolean
    mobileOpen?: boolean
  }>(),
  {
    mobileOpen: false
  }
)

defineEmits(['toggle', 'close-mobile'])

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const navSections = computed(() => {
  if (!auth.isAuthenticated) {
    return [
      {
        label: 'Learning',
        items: [
          { to: '/courses', label: 'Browse Courses', icon: BookOpen },
        ],
      },
    ]
  }

  if (!auth.isAdmin) {
    return [
      {
        label: 'Learning',
        items: [
          { to: '/my-learning', label: 'My Learning', icon: GraduationCap },
          { to: '/courses', label: 'Browse Courses', icon: BookOpen },
          { to: '/wishlist', label: 'Wishlist', icon: Heart },
          { to: '/cart', label: 'Cart', icon: ShoppingCart },
          { to: '/orders', label: 'My Orders', icon: Receipt },
          { to: '/member-card', label: 'Member Card', icon: CreditCard },
          { to: '/achievements', label: 'Achievements', icon: Trophy },
        ],
      },
      {
        label: 'Account',
        items: [
          { to: '/account', label: 'Profile', icon: UserCog },
          { to: '/account/notifications', label: 'Notifications', icon: Bell },
          { to: '/account/security', label: 'Security', icon: ShieldCheck },
        ],
      },
    ]
  }

  return [
    {
      label: 'Overview',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Learning',
      items: [
        { to: '/courses', label: 'Courses', icon: BookOpen },
        { to: '/students', label: 'Students', icon: GraduationCap },
        { to: '/admin/enrollments', label: 'Enrollments', icon: UserPlus },
      ],
    },
    {
      label: 'Sales',
      items: [
        { to: '/admin/orders', label: 'Orders', icon: Receipt },
        { to: '/admin/member-cards', label: 'Member Cards', icon: CreditCard },
        { to: '/admin/discounts', label: 'Discounts', icon: Tag },
        { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
      ],
    },
    {
      label: 'Platform',
      items: [
        { to: '/admin', label: 'Admin Console', icon: ShieldAlert },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/account/notifications', label: 'Notifications', icon: Bell },
        { to: '/account/security', label: 'Security', icon: ShieldCheck },
      ],
    },
  ]
})

const fadeText = {
  enterActiveClass: 'transition-opacity duration-200 ease-out',
  leaveActiveClass: 'transition-opacity duration-200 ease-out',
  enterFromClass: 'opacity-0',
  leaveToClass: 'opacity-0'
}

const fadeBackdrop = {
  enterActiveClass: 'transition-opacity duration-250 ease-out',
  leaveActiveClass: 'transition-opacity duration-250 ease-out',
  enterFromClass: 'opacity-0',
  leaveToClass: 'opacity-0'
}

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  if (to === '/admin') return route.path === '/admin'
  // The lesson player belongs to My Learning
  if (to === '/my-learning' && route.path.startsWith('/learn/')) return true
  // Profile shares its prefix with the other account pages
  if (to === '/account') return route.path === to
  return route.path.startsWith(to)
}

function handleProfileClick() {
  router.push(auth.isAdmin ? '/settings' : '/account')
}
</script>
