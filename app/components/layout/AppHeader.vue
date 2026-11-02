<template>
  <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-zinc-950/85 px-3.5 backdrop-blur-xl transition-colors duration-300 sm:px-6 light:border-slate-200 light:bg-white/90">
    <div class="flex min-w-0 items-center gap-4">
      <button
        class="group flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/8 bg-white/4 text-white/60 transition-all duration-200 ease-out hover:-translate-y-px hover:border-violet-500/40 hover:bg-white/8 hover:text-white hover:shadow-[0_4px_14px_rgba(124,58,237,0.14)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-600 light:hover:border-violet-300 light:hover:bg-slate-200 light:hover:text-slate-900"
        aria-label="Toggle sidebar"
        title="Toggle Sidebar (Ctrl+B)"
        @click="emit('toggle-sidebar')"
      >
        <Menu :size="20" :stroke-width="1.5" class="transition-transform duration-200 ease-out group-hover:scale-110" />
      </button>

      <!-- Breadcrumb with CourseAuraHub Academy branding and high contrast -->
      <nav aria-label="Breadcrumb" class="hidden min-w-0 items-center overflow-hidden whitespace-nowrap sm:flex">
        <UBreadcrumb
          :items="breadcrumbItems"
          :ui="{
            list: 'm-0 flex list-none items-center gap-2 p-0',
            item: 'inline-flex items-center gap-2'
          }"
        >
          <template #separator>
            <ChevronRight :size="13" class="shrink-0 text-white/35 light:text-slate-400" />
          </template>
          <!-- @vue-expect-error Nuxt UI's types don't declare this slot -->
          <template #default="{ item, index }">
            <NuxtLink
              v-if="item.to && index < breadcrumbItems.length - 1"
              :to="item.to"
              class="text-[13px] font-medium text-white/65 no-underline transition-colors hover:text-violet-300 light:text-slate-600 light:hover:text-violet-700"
            >
              <span v-if="index === 0" class="inline-flex items-center gap-1.5">
                <span class="font-bold tracking-tight text-slate-100 light:text-slate-900">CourseAuraHub</span>
                <span class="rounded-full border border-violet-500/25 bg-violet-500/12 px-1.5 py-px text-[10px] font-bold tracking-wider text-violet-300 uppercase light:border-violet-300 light:bg-violet-50 light:text-violet-700">Academy</span>
              </span>
              <span v-else>{{ item.label }}</span>
            </NuxtLink>
            <span v-else class="text-[13px] font-semibold text-slate-50 light:text-slate-900">
              {{ item.label }}
            </span>
          </template>
        </UBreadcrumb>
      </nav>
    </div>

    <div class="flex items-center gap-2.5">
      <!-- Functional Search Bar with Instant Results Dropdown -->
      <div ref="searchContainerRef" class="relative hidden min-[840px]:block">
        <div class="relative flex items-center">
          <Search :size="15" class="pointer-events-none absolute left-2.5 text-white/35 light:text-slate-400" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search platform... (Ctrl+K)"
            class="h-9 w-55 rounded-lg border border-white/8 bg-white/4 py-1.75 pr-7 pl-8 text-[13px] text-white/85 outline-none transition-all duration-200 placeholder:text-white/30 focus:w-65 focus:border-violet-500/60 focus:bg-white/8 focus:ring-2 focus:ring-violet-500/20 light:border-slate-200 light:bg-slate-50 light:text-slate-900 light:placeholder:text-slate-400 light:focus:border-violet-600 light:focus:bg-white"
            @focus="isSearchFocused = true"
            @keydown.esc="closeSearch"
          >
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 flex cursor-pointer items-center justify-center rounded p-0.5 text-white/40 transition-colors hover:text-white light:text-slate-400 light:hover:text-slate-900"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <X :size="13" />
          </button>
        </div>

        <!-- Search Results Dropdown -->
        <Transition v-bind="dropdownAnim">
          <div
            v-if="isSearchFocused && searchQuery.trim().length > 0"
            class="absolute top-full left-0 z-[60] mt-2 w-[min(380px,calc(100vw-2rem))] origin-top-left overflow-hidden rounded-2xl border border-violet-500/30 bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-violet-500/10 light:border-violet-500/25 light:bg-white light:shadow-xl light:ring-violet-500/10"
          >
            <div class="menu-stagger flex max-h-100 flex-col gap-2.5 overflow-y-auto p-2">
              <!-- Courses Group -->
              <div v-if="filteredCourses.length > 0" class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold tracking-wider text-white/45 uppercase light:text-slate-500">
                  <BookOpen :size="13" class="text-violet-400" />
                  <span>Courses ({{ filteredCourses.length }})</span>
                </div>
                <button
                  v-for="course in filteredCourses"
                  :key="course.id"
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-slate-100 transition-all hover:border-violet-500/30 hover:bg-violet-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-900 light:hover:bg-violet-50"
                  @click="goToCourse(course.slug)"
                >
                  <img :src="course.thumbnail" :alt="course.title" class="h-6 w-9 shrink-0 rounded object-cover" >
                  <div class="min-w-0 flex-1">
                    <span class="block truncate text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ course.title }}</span>
                    <span class="mt-px block truncate text-[11px] text-white/45 light:text-slate-500">{{ course.category }} • by {{ course.instructor }}</span>
                  </div>
                  <span class="text-xs font-bold text-emerald-400 light:text-emerald-700">${{ course.price.toFixed(2) }}</span>
                </button>
              </div>

              <!-- Students Group -->
              <div v-if="filteredStudents.length > 0" class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold tracking-wider text-white/45 uppercase light:text-slate-500">
                  <Users :size="13" class="text-blue-400" />
                  <span>Students ({{ filteredStudents.length }})</span>
                </div>
                <button
                  v-for="student in filteredStudents"
                  :key="student.id"
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-slate-100 transition-all hover:border-violet-500/30 hover:bg-violet-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-900 light:hover:bg-violet-50"
                  @click="goToStudents"
                >
                  <img :src="student.avatar" :alt="student.name" class="size-7 shrink-0 rounded-full border border-violet-500/30 object-cover" >
                  <div class="min-w-0 flex-1">
                    <span class="block truncate text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ student.name }}</span>
                    <span class="mt-px block truncate text-[11px] text-white/45 light:text-slate-500">{{ student.email }} • {{ student.country }}</span>
                  </div>
                  <span class="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] uppercase text-emerald-500 light:bg-emerald-50 light:text-emerald-700">{{ student.status }}</span>
                </button>
              </div>

              <!-- Quick Navigation Pages Group -->
              <div v-if="filteredPages.length > 0" class="flex flex-col gap-1">
                <div class="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold tracking-wider text-white/45 uppercase light:text-slate-500">
                  <Compass :size="13" class="text-emerald-400" />
                  <span>Navigation Pages</span>
                </div>
                <button
                  v-for="page in filteredPages"
                  :key="page.to"
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-slate-100 transition-all hover:border-violet-500/30 hover:bg-violet-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-900 light:hover:bg-violet-50"
                  @click="goToPage(page)"
                >
                  <component :is="page.icon" :size="15" class="text-violet-400" />
                  <div class="min-w-0 flex-1">
                    <span class="block truncate text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ page.name }}</span>
                    <span class="mt-px block truncate text-[11px] text-white/45 light:text-slate-500">{{ page.desc }}</span>
                  </div>
                </button>
              </div>

              <!-- No Results State -->
              <div
                v-if="filteredCourses.length === 0 && filteredStudents.length === 0 && filteredPages.length === 0"
                class="flex flex-col items-center gap-1.5 p-6 text-center text-[13px] text-white/50 light:text-slate-600"
              >
                <SearchX :size="20" class="text-white/40 light:text-slate-400" />
                <p>No results found for "{{ searchQuery }}"</p>
                <span class="text-xs text-white/40 light:text-slate-500">Try searching for "Nuxt", "Vue", "Alex", or "Analytics"</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Language and Theme (Dark / Light Mode) Toggles -->
      <LanguageToggle />
      <ThemeToggle />

      <!-- Cart -->
      <NuxtLink
        v-if="auth.isAuthenticated && !auth.isAdmin"
        to="/cart"
        class="relative flex size-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-white/60 no-underline transition-colors hover:bg-white/10 hover:text-white light:border-slate-200 light:bg-slate-100 light:text-slate-600 light:hover:text-slate-900"
        :aria-label="t('Your cart')"
        :title="t('Your cart')"
      >
        <ShoppingCart :size="17" />
        <span v-if="cart.count.value > 0" class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{{ cart.count.value }}</span>
      </NuxtLink>

      <!-- Notifications with Dropdown -->
      <div v-if="auth.isAuthenticated" ref="notifContainerRef" class="relative">
        <button
          type="button"
          class="group relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/8 bg-white/4 text-white/60 transition-all duration-200 ease-out hover:-translate-y-px hover:border-violet-500/40 hover:bg-white/8 hover:text-white hover:shadow-[0_4px_14px_rgba(124,58,237,0.14)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-600 light:hover:border-violet-300 light:hover:bg-slate-200 light:hover:text-slate-900"
          :class="{ 'border-violet-500/40 bg-white/8 text-white light:bg-slate-200 light:text-slate-900': isNotifOpen }"
          aria-label="Notifications"
          :aria-expanded="isNotifOpen"
          aria-haspopup="dialog"
          title="Notifications"
          @click="toggleNotif"
        >
          <Bell
            :size="18"
            :stroke-width="1.5"
            class="transition-transform duration-300 ease-out group-hover:scale-110"
            :class="{ '-rotate-12 scale-110 text-violet-300 light:text-violet-700': isNotifOpen }"
          />
          <span v-if="unreadNotifsCount > 0" class="pointer-events-none absolute top-1.5 right-1.5 flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-violet-500/70" />
            <span class="relative inline-flex size-2 rounded-full border-[1.5px] border-zinc-950 bg-violet-500 light:border-white" />
          </span>
        </button>

        <!-- Notification center: teleported on mobile so it can be centered in the viewport -->
        <Teleport to="body" :disabled="!isMobileNotif">
          <!-- Mobile dimmed backdrop -->
          <Transition v-bind="notifBackdropAnim">
            <div
              v-if="isMobileNotif && isNotifOpen"
              class="fixed inset-0 z-[90] bg-zinc-950/75 backdrop-blur-md light:bg-slate-950/45"
              aria-hidden="true"
              @click="closeNotif"
            />
          </Transition>

          <!-- Panel -->
          <Transition v-bind="notifPanelAnim">
            <div
              v-if="isNotifOpen"
              ref="notifPanelRef"
              :class="notifPanelClass"
              role="dialog"
              :aria-modal="isMobileNotif ? 'true' : undefined"
              aria-label="Notifications"
            >
              <NotificationPanel
                :notifications="notifications"
                :unread-count="unreadNotifsCount"
                :mobile="isMobileNotif"
                removable
                :has-more="notificationCenter.hasMore.value"
                :show-analytics-link="auth.isAdmin"
                @close="closeNotif"
                @mark-all-read="markAllAsRead"
                @mark-read="markItemRead"
                @remove="removeNotification"
                @load-more="loadOlderNotifications"
              />
            </div>
          </Transition>
        </Teleport>
      </div>

      <!-- Help with Modal Trigger -->
      <button
        type="button"
        class="group relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/8 bg-white/4 text-white/60 transition-all duration-200 ease-out hover:-translate-y-px hover:border-violet-500/40 hover:bg-white/8 hover:text-white hover:shadow-[0_4px_14px_rgba(124,58,237,0.14)] active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:border-slate-200 light:bg-slate-100 light:text-slate-600 light:hover:border-violet-300 light:hover:bg-slate-200 light:hover:text-slate-900"
        :class="{ 'border-violet-500/40 bg-white/8 text-white light:bg-slate-200 light:text-slate-900': isHelpOpen }"
        aria-label="Help & About Platform"
        :aria-expanded="isHelpOpen"
        aria-haspopup="dialog"
        title="Help & Platform Guide (Ctrl+H or ?)"
        @click="openHelp"
      >
        <HelpCircle :size="18" :stroke-width="1.5" class="transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110" />
      </button>

      <NuxtLink
        v-if="!auth.isAuthenticated"
        :to="{ path: '/auth/login', query: { redirect: route.fullPath } }"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white no-underline transition-all hover:from-violet-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
      >
        Sign in
      </NuxtLink>

      <!-- Avatar with User Dropdown -->
      <div v-else ref="avatarContainerRef" class="relative">
        <button
          type="button"
          class="relative block size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-violet-500/50 p-0 transition-all duration-200 ease-out hover:scale-105 hover:border-violet-500 hover:shadow-[0_0_14px_rgba(124,58,237,0.5)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 light:border-violet-300 light:focus-visible:ring-offset-white"
          :class="{ 'scale-105 border-violet-500 shadow-[0_0_14px_rgba(124,58,237,0.5)] light:border-violet-600': isAvatarOpen }"
          :title="`${auth.userName} (${auth.roleLabel})`"
          aria-label="Open account menu"
          aria-haspopup="true"
          :aria-expanded="isAvatarOpen"
          @click="toggleAvatar"
        >
          <img :src="auth.userAvatar" :alt="`${auth.userName} profile`" class="size-full object-cover" >
        </button>

        <!-- Avatar Dropdown Menu -->
        <Transition v-bind="dropdownAnim">
          <div
            v-if="isAvatarOpen"
            class="menu-stagger absolute top-full right-0 z-[60] mt-2.5 w-[270px] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-violet-500/30 bg-zinc-950/95 p-2 backdrop-blur-xl shadow-2xl shadow-black/80 light:border-violet-500/25 light:bg-white"
          >
            <!-- User Summary Header -->
            <div class="flex items-center gap-3 px-2.5 pt-2.5 pb-3">
              <div class="relative">
                <img
                  :src="auth.userAvatar"
                  :alt="auth.userName"
                  class="size-11 rounded-full border-2 border-violet-500/40"
                >
                <span class="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500 light:border-white" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-sm font-bold text-slate-100 light:text-slate-900">{{ auth.userName }}</span>
                <span class="block truncate text-[11px] text-white/45 light:text-slate-500">{{ auth.userEmail }}</span>
                <span class="mt-0.75 inline-block rounded-full border border-violet-500/30 bg-violet-500/18 px-1.5 py-px text-[9px] font-bold tracking-wider text-violet-300 uppercase light:border-violet-200 light:bg-violet-50 light:text-violet-700">{{ auth.roleLabel }}</span>
              </div>
            </div>

            <div class="my-1 h-px bg-white/6 light:bg-slate-200" />

            <!-- Navigation Links -->
            <div class="menu-stagger flex flex-col gap-0.5">
              <NuxtLink
                v-if="auth.isAdmin"
                to="/admin"
                class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                @click="isAvatarOpen = false"
              >
                <ShieldAlert :size="15" class="text-violet-400" />
                <span>Admin Console</span>
                <span class="ml-auto rounded-full border border-emerald-400/25 bg-emerald-400/12 px-1.5 py-px text-[10px] font-bold text-emerald-400 light:border-emerald-300 light:bg-emerald-50 light:text-emerald-700">Live</span>
              </NuxtLink>

              <NuxtLink
                to="/courses"
                class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                @click="isAvatarOpen = false"
              >
                <BookOpen :size="15" class="text-blue-400" />
                <span>Course Catalog</span>
              </NuxtLink>

              <template v-if="!auth.isAdmin">
                <NuxtLink
                  to="/my-learning"
                  class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                  @click="isAvatarOpen = false"
                >
                  <GraduationCap :size="15" class="text-violet-400" />
                  <span>My Learning</span>
                </NuxtLink>

                <NuxtLink
                  to="/wishlist"
                  class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                  @click="isAvatarOpen = false"
                >
                  <Heart :size="15" class="text-rose-400" />
                  <span>Wishlist</span>
                </NuxtLink>

                <NuxtLink
                  to="/account"
                  class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                  @click="isAvatarOpen = false"
                >
                  <UserCog :size="15" class="text-purple-400" />
                  <span>Profile & Security</span>
                </NuxtLink>
              </template>

              <NuxtLink
                v-if="auth.isAdmin"
                to="/students"
                class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                @click="isAvatarOpen = false"
              >
                <Users :size="15" class="text-emerald-400" />
                <span>Students Roster</span>
              </NuxtLink>

              <NuxtLink
                v-if="auth.isAdmin"
                to="/analytics"
                class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                @click="isAvatarOpen = false"
              >
                <BarChart3 :size="15" class="text-amber-400" />
                <span>Sales Analytics</span>
              </NuxtLink>

              <NuxtLink
                v-if="auth.isAdmin"
                to="/settings"
                class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                @click="isAvatarOpen = false"
              >
                <Settings :size="15" class="text-purple-400" />
                <span>Platform Settings</span>
              </NuxtLink>

              <NuxtLink
                to="/account/security"
                class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-slate-100 light:hover:text-slate-900"
                @click="isAvatarOpen = false"
              >
                <ShieldCheck :size="15" class="text-emerald-400" />
                <span>Account Security</span>
              </NuxtLink>

              <button
                type="button"
                class="group/item flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-white/75 no-underline transition-all duration-200 ease-out hover:translate-x-0.5 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 light:text-slate-700 light:hover:bg-violet-50 light:hover:text-slate-900"
                @click="handleOpenHelp"
              >
                <HelpCircle :size="15" class="text-teal-400" />
                <span>Platform Help & Guide</span>
              </button>
            </div>

            <div class="my-1 h-px bg-white/6 light:bg-slate-200" />

            <!-- Quick Theme Switch Row inside Dropdown -->
            <div class="flex items-center justify-between px-2.5 py-2">
              <div class="min-w-0">
                <span class="block text-xs font-medium text-white/55 light:text-slate-600">Appearance</span>
                <span class="mt-0.5 block text-[10px] text-white/30 light:text-slate-400">Dark / Light</span>
              </div>
              <ThemeToggle />
            </div>

            <div class="my-1 h-px bg-white/6 light:bg-slate-200" />

            <!-- Logout Button -->
            <button
              type="button"
              class="mt-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.25 text-[13px] font-semibold text-rose-400 transition-all hover:bg-rose-500/12 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 light:text-rose-600 light:hover:bg-rose-50 light:hover:text-rose-700"
              @click="handleLogout"
            >
              <LogOut :size="15" class="text-rose-400 light:text-rose-600" />
              <span>Log Out</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Help Modal Dialog -->
    <AppHelpModal
      :is-open="isHelpOpen"
      @close="isHelpOpen = false"
    />
  </header>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BellRing,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Compass,
  CreditCard,
  GraduationCap,
  Heart,
  HelpCircle,
  LogOut,
  Menu,
  PlayCircle,
  Receipt,
  Search,
  SearchX,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Tag,
  TicketPercent,
  TrendingUp,
  Trophy,
  UserCog,
  Users,
  X
} from 'lucide-vue-next'
import { useMediaQuery } from '@vueuse/core'
import AppHelpModal from '~/components/shared/AppHelpModal.vue'
import NotificationPanel from '~/components/layout/NotificationPanel.vue'
import LanguageToggle from '~/components/layout/LanguageToggle.vue'
import ThemeToggle from '~/components/layout/ThemeToggle.vue'
import { useAppToast } from '~/composables/useAppToast'
import { useAuth } from '~/composables/useAuth'
import { useNotifications } from '~/composables/useNotifications'
import { formatTimeAgo } from '~/utils/dateTime'
import { useBodyScrollLock } from '~/composables/useBodyScrollLock'
import { useCart } from '~/composables/useCart'
import type { AppNotification, Course, Student } from '~/types'
import type { Component } from 'vue'

defineProps<{ sidebarCollapsed: boolean }>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const { info, error: toastError } = useAppToast()
const colorMode = useColorMode()

// Dropdown and modal states
const isNotifOpen = ref(false)
const isAvatarOpen = ref(false)
const isHelpOpen = ref(false)

// The notification center becomes a centered dialog on small screens
const isMobileNotif = useMediaQuery('(max-width: 767px)')
const notifPanelRef = ref<HTMLElement | null>(null)

// Search state
const searchQuery = ref('')
const isSearchFocused = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchContainerRef = ref<HTMLElement | null>(null)
const notifContainerRef = ref<HTMLElement | null>(null)
const avatarContainerRef = ref<HTMLElement | null>(null)

// Breadcrumb items with CourseAuraHub branding
const breadcrumbItems = computed(() => {
  const path = route.path

  if (path === '/') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Dashboard' }
    ]
  }

  if (path === '/courses') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Courses' }
    ]
  }

  if (path.startsWith('/courses/')) {
    const slug = (route.params.slug as string) || path.replace('/courses/', '')
    const formatted = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Courses', to: '/courses' },
      { label: formatted }
    ]
  }

  if (path === '/students') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Students' }
    ]
  }

  if (path.startsWith('/learn/')) {
    const slug = (route.params.slug as string) || path.replace('/learn/', '')
    return [
      { label: 'CourseAuraHub', to: auth.homeRoute },
      { label: 'My Learning', to: '/my-learning' },
      { label: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
    ]
  }

  if (path === '/my-learning' || path === '/wishlist' || path === '/orders' || path === '/account') {
    const labels: Record<string, string> = {
      '/my-learning': 'My Learning',
      '/wishlist': 'Wishlist',
      '/orders': 'My Orders',
      '/account': 'Profile & Security'
    }
    return [
      { label: 'CourseAuraHub', to: auth.homeRoute },
      { label: labels[path] }
    ]
  }

  if (path === '/admin') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Admin Console' }
    ]
  }

  const adminPages: Record<string, string> = {
    '/admin/orders': 'Orders',
    '/admin/discounts': 'Discounts',
    '/admin/coupons': 'Coupons'
  }
  if (adminPages[path]) {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Admin Console', to: '/admin' },
      { label: adminPages[path] }
    ]
  }

  if (path === '/analytics') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Analytics' }
    ]
  }

  if (path === '/settings') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Settings' }
    ]
  }

  if (path === '/account/notifications') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Account' },
      { label: 'Notifications' }
    ]
  }

  if (path === '/account/security') {
    return [
      { label: 'CourseAuraHub', to: '/' },
      { label: 'Account' },
      { label: 'Security' }
    ]
  }

  const segment = path.replace(/^\//, '').replace(/-/g, ' ')
  return [
    { label: 'CourseAuraHub', to: '/' },
    { label: segment.charAt(0).toUpperCase() + segment.slice(1) }
  ]
})

interface HeaderNotification {
  id: number
  title: string
  message?: string
  time: string
  icon: Component
  iconClass: string
  bgClass: string
  read: boolean
}

const notificationStyles: Record<AppNotification['type'], Pick<HeaderNotification, 'icon' | 'iconClass' | 'bgClass'>> = {
  enrolled: { icon: GraduationCap, iconClass: 'text-emerald-400', bgClass: 'bg-emerald-400/15 light:bg-emerald-50' },
  payment_failed: { icon: AlertTriangle, iconClass: 'text-rose-400', bgClass: 'bg-rose-400/15 light:bg-rose-50' },
  order_refunded: { icon: Receipt, iconClass: 'text-blue-400', bgClass: 'bg-blue-400/15 light:bg-blue-50' },
  certificate_issued: { icon: Award, iconClass: 'text-amber-400', bgClass: 'bg-amber-400/15 light:bg-amber-50' },
  new_lesson: { icon: PlayCircle, iconClass: 'text-violet-400', bgClass: 'bg-violet-400/15 light:bg-violet-50' },
  new_enrollment: { icon: Users, iconClass: 'text-emerald-400', bgClass: 'bg-emerald-400/15 light:bg-emerald-50' },
  course_completed: { icon: Award, iconClass: 'text-emerald-400', bgClass: 'bg-emerald-400/15 light:bg-emerald-50' },
  member_card: { icon: CreditCard, iconClass: 'text-violet-400', bgClass: 'bg-violet-400/15 light:bg-violet-50' },
  lesson_question: { icon: HelpCircle, iconClass: 'text-blue-400', bgClass: 'bg-blue-400/15 light:bg-blue-50' },
  assignment: { icon: ClipboardCheck, iconClass: 'text-emerald-400', bgClass: 'bg-emerald-400/15 light:bg-emerald-50' },
  course_review: { icon: ShieldCheck, iconClass: 'text-amber-400', bgClass: 'bg-amber-400/15 light:bg-amber-50' },
  course_reminder: { icon: BellRing, iconClass: 'text-violet-400', bgClass: 'bg-violet-400/15 light:bg-violet-50' },
  weekly_report: { icon: BarChart3, iconClass: 'text-blue-400', bgClass: 'bg-blue-400/15 light:bg-blue-50' }
}

const notificationCenter = useNotifications()
const cart = useCart()
const { t } = useT()

const notifications = computed<HeaderNotification[]>(() => notificationCenter.items.value.map(item => ({
  ...notificationStyles[item.type],
  id: item.id,
  title: t(item.title),
  message: item.message,
  time: formatTimeAgo(item.createdAt),
  read: item.read
})))

const unreadNotifsCount = computed(() => notificationCenter.unreadCount.value)

// Responsive panel shell: anchored dropdown on desktop, centered dialog on mobile
const notifPanelClass = computed(() => isMobileNotif.value
  ? 'fixed top-1/2 left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-[22rem] -translate-x-1/2 -translate-y-1/2 origin-center overflow-hidden rounded-2xl border border-violet-500/35 bg-zinc-950 shadow-[0_28px_70px_-16px_rgba(0,0,0,0.95),0_0_45px_rgba(124,58,237,0.22)] ring-1 ring-violet-500/15 light:border-violet-500/25 light:bg-white light:shadow-[0_28px_70px_-16px_rgba(15,23,42,0.35),0_0_40px_rgba(124,58,237,0.12)] light:ring-violet-500/10'
  : 'absolute top-[calc(100%+0.625rem)] right-0 z-[60] w-85 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-violet-500/30 bg-zinc-950 shadow-2xl shadow-black/80 ring-1 ring-violet-500/10 light:border-violet-500/25 light:bg-white light:shadow-xl light:ring-violet-500/10')

const notifBackdropAnim = {
  enterActiveClass: 'transition-opacity duration-300 ease-out',
  leaveActiveClass: 'transition-opacity duration-200 ease-in',
  enterFromClass: 'opacity-0',
  leaveToClass: 'opacity-0'
}

const notifPanelAnim = computed(() => isMobileNotif.value
  ? {
      enterActiveClass: 'transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
      leaveActiveClass: 'transition duration-200 ease-[cubic-bezier(0.4,0,1,1)]',
      enterFromClass: 'scale-90 opacity-0',
      leaveToClass: 'scale-95 opacity-0'
    }
  : {
      enterActiveClass: 'transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
      leaveActiveClass: 'transition duration-150 ease-[cubic-bezier(0.4,0,1,1)]',
      enterFromClass: 'scale-[0.96] -translate-y-2 opacity-0',
      leaveToClass: 'scale-[0.98] -translate-y-1 opacity-0'
    })

function closeNotif() {
  isNotifOpen.value = false
}

function toggleNotif() {
  isNotifOpen.value = !isNotifOpen.value
  if (isNotifOpen.value) {
    isAvatarOpen.value = false
    isSearchFocused.value = false
  }
}

function markAllAsRead() {
  notificationCenter.markAllRead()
    .then(() => info('Notifications Updated', 'All notifications marked as read'))
    .catch(() => toastError('Notifications Not Updated', 'Please try again.'))
}

function findNotification(item: HeaderNotification) {
  return notificationCenter.items.value.find(notification => notification.id === item.id)
}

function markItemRead(item: HeaderNotification) {
  const notification = findNotification(item)
  if (!notification) return
  notificationCenter.markRead(notification).catch(() => {})
  if (notification.link) {
    closeNotif()
    router.push(notification.link)
  }
}

function removeNotification(item: HeaderNotification) {
  const notification = findNotification(item)
  if (notification) {
    notificationCenter.remove(notification).catch(() => toastError('Notification Not Deleted', 'Please try again.'))
  }
}

function loadOlderNotifications() {
  notificationCenter.loadMore().catch(() => toastError('Notifications Not Loaded', 'Please try again.'))
}

// Lock background scrolling while the mobile notification dialog is open
const shouldLockNotifications = computed(() => isNotifOpen.value && isMobileNotif.value)
useBodyScrollLock(shouldLockNotifications)

// Avatar dropdown triggers
function toggleAvatar() {
  isAvatarOpen.value = !isAvatarOpen.value
  if (isAvatarOpen.value) {
    isNotifOpen.value = false
    isSearchFocused.value = false
  }
}

function closeHeaderSurfaces() {
  closeNotif()
  isAvatarOpen.value = false
  isSearchFocused.value = false
}

function openHelp() {
  closeHeaderSurfaces()
  isHelpOpen.value = true
}

function toggleHelp() {
  if (isHelpOpen.value) {
    isHelpOpen.value = false
    return
  }

  openHelp()
}

function handleOpenHelp() {
  isAvatarOpen.value = false
  openHelp()
}

async function handleLogout() {
  isAvatarOpen.value = false
  await auth.logout()
}

// Fetch search datasets (courses & students)
const allCourses = ref<Course[]>([])
const allStudents = ref<Student[]>([])

async function loadSearchData() {
  try {
    const coursesPromise = $fetch<Course[]>('/api/courses').catch(() => [])
    const studentsPromise = auth.isAdmin
      ? $fetch<Student[]>('/api/students').catch(() => [])
      : Promise.resolve([])

    const [courses, students] = await Promise.all([coursesPromise, studentsPromise])
    allCourses.value = courses || []
    allStudents.value = students || []
  } catch (error) {
    console.error('Unable to load search data:', error)
  }
}

function syncNotificationStream() {
  if (auth.isAuthenticated) {
    notificationCenter.connect()
  } else {
    notificationCenter.disconnect()
  }
}

function syncCart() {
  if (auth.isAuthenticated && !auth.isAdmin) {
    cart.refresh().catch(() => {})
  } else {
    cart.clear()
  }
}

onMounted(() => {
  loadSearchData()
  syncNotificationStream()
  syncCart()
})

watch(() => auth.isAuthenticated, () => {
  syncNotificationStream()
  syncCart()
})

watch(() => auth.isAdmin, loadSearchData)

const quickPages = [
  { name: 'Dashboard Overview', desc: 'Main sales KPIs, chart breakdowns, and metrics', to: '/', icon: BarChart3 },
  { name: 'Course Catalog & CRUD', desc: 'Manage curriculum, edit pricing, and publish courses', to: '/courses', icon: BookOpen },
  { name: 'Student Directory', desc: 'Active learners, enrollment dates, and lifetime spend', to: '/students', icon: Users },
  { name: 'Sales & Analytics', desc: 'Detailed financial and performance reports', to: '/analytics', icon: TrendingUp },
  { name: 'Platform Settings', desc: 'Storefront branding, preferences, and profile', to: '/settings', icon: Settings },
  { name: 'Orders', desc: 'Review purchases and refund paid orders', to: '/admin/orders', icon: Receipt },
  { name: 'Discounts', desc: 'Schedule sale prices for courses', to: '/admin/discounts', icon: Tag },
  { name: 'Coupons', desc: 'Create discount codes for checkout', to: '/admin/coupons', icon: TicketPercent },
  { name: 'Admin Console', desc: 'Full-page workspace for courses, learners, and platform ops', to: '/admin', icon: ShieldAlert },
  { name: 'Notifications', desc: 'Connect Telegram and choose where updates reach you', to: '/account/notifications', icon: Bell },
  { name: 'Account Security', desc: 'Password, two-factor authentication, and signed-in devices', to: '/account/security', icon: ShieldCheck },
]

const learnerPages = [
  { name: 'Browse Courses', desc: 'Explore the course catalog', to: '/courses', icon: BookOpen },
  { name: 'My Learning', desc: 'Enrolled courses and your progress', to: '/my-learning', icon: GraduationCap },
  { name: 'Wishlist', desc: 'Courses saved for later', to: '/wishlist', icon: Heart },
  { name: 'Your cart', desc: 'Courses ready for checkout', to: '/cart', icon: ShoppingCart },
  { name: 'My Orders', desc: 'Your purchases and their status', to: '/orders', icon: Receipt },
  { name: 'Achievements', desc: 'Badges, streaks, and course certificates', to: '/achievements', icon: Trophy },
  { name: 'Profile', desc: 'Your name, avatar, and public details', to: '/account', icon: UserCog },
  { name: 'Notifications', desc: 'Connect Telegram and choose where updates reach you', to: '/account/notifications', icon: Bell },
  { name: 'Account Security', desc: 'Password, two-factor authentication, and signed-in devices', to: '/account/security', icon: ShieldCheck },
]

const filteredCourses = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return allCourses.value
    .filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.instructor.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    )
    .slice(0, 4)
})

const filteredStudents = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return allStudents.value
    .filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q)
    )
    .slice(0, 3)
})

const filteredPages = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return (auth.isAdmin ? quickPages : learnerPages)
    .filter(p =>
      p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    )
    .slice(0, 3)
})

function closeSearch() {
  isSearchFocused.value = false
}

function clearSearch() {
  searchQuery.value = ''
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

function goToCourse(slug: string) {
  closeSearch()
  searchQuery.value = ''
  router.push(`/courses/${slug}`)
}

function goToStudents() {
  closeSearch()
  searchQuery.value = ''
  router.push('/students')
}

function goToPage(page: typeof quickPages[0]) {
  closeSearch()
  searchQuery.value = ''
  router.push(page.to)
}

// Global click-outside handling
function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const insideNotifications = notifContainerRef.value?.contains(target)
    || notifPanelRef.value?.contains(target)

  if (!insideNotifications) {
    closeNotif()
  }

  if (avatarContainerRef.value && !avatarContainerRef.value.contains(target)) {
    isAvatarOpen.value = false
  }

  if (searchContainerRef.value && !searchContainerRef.value.contains(target)) {
    isSearchFocused.value = false
  }
}

// Keyboard shortcuts
// Ctrl/⌘+K or '/' focuses search, Ctrl/⌘+H or '?' opens help,
// Ctrl/⌘+B toggles the sidebar, Ctrl/⌘+Shift+L switches theme
function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  if (!element) return false

  return element.tagName === 'INPUT'
    || element.tagName === 'TEXTAREA'
    || element.tagName === 'SELECT'
    || element.isContentEditable
}

function hasOpenModal() {
  return document.body.dataset.modalOpen === 'true'
}

function toggleTheme() {
  const nextMode = colorMode.value === 'dark' ? 'light' : 'dark'
  colorMode.preference = nextMode
  info('Appearance Updated', `${nextMode === 'dark' ? 'Dark' : 'Light'} mode enabled`)
}

function handleGlobalKeydown(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  const ctrlOrMeta = e.ctrlKey || e.metaKey

  // Always allow Escape to dismiss header surfaces and the help dialog.
  if (e.key === 'Escape') {
    if (isHelpOpen.value) {
      isHelpOpen.value = false
    }
    closeHeaderSurfaces()
    return
  }

  // Allow Ctrl/⌘+H to close an already-open help dialog.
  if (ctrlOrMeta && !e.altKey && key === 'h') {
    if (!isHelpOpen.value && hasOpenModal()) return
    e.preventDefault()
    toggleHelp()
    return
  }

  // Never trigger page shortcuts behind an open modal.
  if (hasOpenModal()) return

  if (ctrlOrMeta && !e.altKey && key === 'b') {
    e.preventDefault()
    emit('toggle-sidebar')
    return
  }

  if (ctrlOrMeta && !e.altKey && e.shiftKey && key === 'l') {
    e.preventDefault()
    toggleTheme()
    return
  }

  if (ctrlOrMeta && !e.altKey && key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
    isSearchFocused.value = true
    return
  }

  if (!ctrlOrMeta && !e.altKey && !isEditableTarget(e.target) && e.key === '?') {
    e.preventDefault()
    openHelp()
    return
  }

  if (!ctrlOrMeta && !e.altKey && !isEditableTarget(e.target) && e.key === '/') {
    e.preventDefault()
    searchInputRef.value?.focus()
    isSearchFocused.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleGlobalKeydown)
})

const dropdownAnim = {
  enterActiveClass: 'transition duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
  leaveActiveClass: 'transition duration-150 ease-in',
  enterFromClass: 'scale-95 -translate-y-1.5 opacity-0 blur-[2px]',
  leaveToClass: 'scale-[0.97] -translate-y-1 opacity-0'
}
</script>
