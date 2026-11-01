<template>
  <div class="flex flex-col gap-5">
    <div>
      <NuxtLink :to="courseSlug ? `/courses/${courseSlug}` : '/cart'" class="inline-flex items-center gap-1 text-xs font-semibold text-white/50 no-underline hover:text-white light:text-slate-500 light:hover:text-slate-900">
        <ArrowLeft :size="14" /> {{ courseSlug ? t('Back to course') : t('Back to cart') }}
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-slate-50 sm:text-[26px] light:text-slate-900">{{ t('Checkout') }}</h1>
      <p class="mt-1 text-[13px] text-white/45 light:text-slate-500">{{ courseSlug ? t('Review your course, then pay.') : t('Review your courses, then pay once for all of them.') }}</p>
    </div>

    <div v-if="pending" class="h-40 animate-pulse rounded-2xl bg-white/5 light:bg-slate-100" />

    <p v-else-if="loadError" class="rounded-2xl border border-rose-500/25 bg-rose-500/8 px-5 py-6 text-center text-[13px] text-rose-300 light:border-rose-200 light:bg-rose-50 light:text-rose-700">
      {{ loadError }}
    </p>

    <div v-else-if="items.length" class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div class="flex flex-col gap-5 lg:col-span-2">
        <section class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <h2 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Courses') }}</h2>
          <ul class="m-0 mt-3 flex list-none flex-col p-0">
            <li
              v-for="item in items"
              :key="item.courseId"
              class="flex items-center justify-between gap-4 border-b border-white/6 py-3 last:border-b-0 light:border-slate-100"
            >
              <div class="min-w-0">
                <p class="truncate text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ item.title }}</p>
                <p class="text-[11px] text-white/45 light:text-slate-500">{{ item.instructor }}</p>
              </div>
              <span class="shrink-0 text-[13px] font-bold text-slate-100 light:text-slate-900">{{ formatMoney(item.price, currency) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="card" class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <h2 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Payment method') }}</h2>
          <div class="mt-3 flex flex-col gap-2" role="radiogroup" :aria-label="t('Payment method')">
            <label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 p-3 light:border-slate-200 light:bg-slate-50">
              <input v-model="paymentMethod" type="radio" value="MEMBER_CARD" class="size-4 accent-violet-600" :disabled="!cardCanPay">
              <span class="min-w-0 flex-1">
                <span class="block text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ t('Member card') }}</span>
                <span class="text-xs text-white/45 light:text-slate-500">{{ t('Balance {amount}', { amount: formatMoney(card.balance, card.currency) }) }}</span>
              </span>
            </label>
            <p v-if="card.status === 'SUSPENDED'" class="text-xs text-amber-400 light:text-amber-700">{{ t('This card is suspended, so it can\'t pay for courses right now.') }}</p>
            <p v-else-if="total > card.balance" class="text-xs text-amber-400 light:text-amber-700">{{ t('Your balance doesn\'t cover this order.') }}</p>
            <label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 p-3 light:border-slate-200 light:bg-slate-50">
              <input v-model="paymentMethod" type="radio" value="ONLINE" class="size-4 accent-violet-600">
              <span class="text-[13px] font-semibold text-slate-100 light:text-slate-900">{{ t('Pay online') }}</span>
            </label>
          </div>
        </section>

        <section class="rounded-[18px] border border-white/10 bg-white/5 p-5 light:border-slate-200 light:bg-white">
          <h2 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Coupon') }}</h2>
          <form v-if="!preview" class="mt-3 flex gap-2" @submit.prevent="applyCoupon">
            <input
              v-model="code"
              type="text"
              maxlength="40"
              :placeholder="t('Enter a coupon code')"
              :aria-label="t('Coupon code')"
              class="h-10 min-w-0 flex-1 rounded-[10px] border border-white/9 bg-white/4 px-3 text-[13px] text-slate-100 uppercase outline-none placeholder:text-white/35 placeholder:normal-case focus:border-violet-500/65 light:border-slate-300 light:bg-white light:text-slate-900"
            >
            <button
              type="submit"
              class="cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/75 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 light:border-slate-200 light:bg-slate-100 light:text-slate-700"
              :disabled="applying || !code.trim()"
            >
              {{ t('Apply') }}
            </button>
          </form>
          <p v-if="couponError" class="mt-2 text-xs text-rose-300 light:text-rose-600" role="alert">{{ couponError }}</p>
          <div v-if="preview" class="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-2.5 text-xs text-emerald-400 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-700">
            <span>{{ t('{code} applied to {title}', { code: preview.code, title: preview.courseTitle }) }}</span>
            <button type="button" class="cursor-pointer font-semibold underline" @click="removeCoupon">{{ t('Remove') }}</button>
          </div>
        </section>
      </div>

      <aside class="h-fit rounded-[18px] border border-white/10 bg-white/5 p-5 lg:sticky lg:top-20 light:border-slate-200 light:bg-white">
        <h2 class="text-base font-bold text-slate-100 light:text-slate-900">{{ t('Order summary') }}</h2>
        <dl class="mt-4 flex flex-col gap-2 text-[13px]">
          <div class="flex justify-between text-white/60 light:text-slate-600">
            <dt>{{ t('Subtotal') }}</dt>
            <dd>{{ formatMoney(subtotal, currency) }}</dd>
          </div>
          <div v-if="preview" class="flex justify-between text-emerald-400 light:text-emerald-700">
            <dt>{{ t('Coupon discount') }}</dt>
            <dd>-{{ formatMoney(preview.couponDiscount, currency) }}</dd>
          </div>
          <div class="mt-1 flex justify-between border-t border-white/8 pt-3 text-base font-extrabold text-slate-50 light:border-slate-200 light:text-slate-900">
            <dt>{{ t('Total') }}</dt>
            <dd>{{ formatMoney(total, currency) }}</dd>
          </div>
        </dl>
        <button
          type="button"
          class="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-linear-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:from-violet-500 hover:to-indigo-500 disabled:cursor-wait disabled:opacity-60"
          :disabled="paying || (paymentMethod === 'MEMBER_CARD' && !cardCanPay)"
          @click="pay"
        >
          <Loader2 v-if="paying" :size="16" class="animate-spin" />
          <Lock v-else :size="15" />
          {{ total > 0 ? t('Pay {amount}', { amount: formatMoney(total, currency) }) : t('Complete order') }}
        </button>
        <p class="mt-2 text-center text-[11px] text-white/40 light:text-slate-500">{{ t('You get access as soon as your payment is confirmed.') }}</p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Loader2, Lock } from 'lucide-vue-next'
import type { CartCouponPreview, Course, MemberCard, PaymentMethod } from '~/types'
import { formatMoney, useCart } from '~/composables/useCart'
import { useMemberCard } from '~/composables/useMemberCard'
import { useOrders } from '~/composables/useOrders'
import { useAppToast } from '~/composables/useAppToast'
import { getErrorMessage } from '~/utils/apiError'

const { t } = useT()
useHead({ title: () => t('Checkout') })

const route = useRoute()
const router = useRouter()
const toast = useAppToast()
const { cart, refresh, previewCoupon, checkout } = useCart()
const { checkoutCourse, previewCourseCoupon } = useOrders()
const { fetchMine } = useMemberCard()

// Buy now passes one course; without it, this page checks out the whole cart
const courseSlug = computed(() => typeof route.query.course === 'string' ? route.query.course : '')
const course = ref<Course | null>(null)

const pending = ref(true)
const loadError = ref('')
const code = ref('')
const preview = ref<Pick<CartCouponPreview, 'code' | 'courseTitle' | 'couponDiscount' | 'total'> | null>(null)
const applying = ref(false)
const couponError = ref('')
const paying = ref(false)
const card = ref<MemberCard | null>(null)
const paymentMethod = ref<PaymentMethod>('ONLINE')

const items = computed(() => course.value
  ? [{ courseId: course.value.id, title: course.value.title, instructor: course.value.instructor, price: course.value.price }]
  : cart.value?.items ?? [])
const currency = computed(() => cart.value?.currency)
const subtotal = computed(() => course.value ? course.value.price : cart.value?.total ?? 0)
const total = computed(() => preview.value?.total ?? subtotal.value)
const cardCanPay = computed(() => card.value?.status === 'ACTIVE' && total.value <= card.value.balance)

// A coupon can make the card usable, and removing one can put the total out of reach
watch(cardCanPay, (usable) => {
  paymentMethod.value = usable ? 'MEMBER_CARD' : 'ONLINE'
})

async function fetchPreview(couponCode: string) {
  if (!course.value) return await previewCoupon(couponCode)
  const single = await previewCourseCoupon(course.value.slug, couponCode)
  return {
    code: single.code,
    courseTitle: course.value.title,
    couponDiscount: single.discountAmount,
    total: single.finalAmount
  }
}

async function applyCoupon() {
  applying.value = true
  couponError.value = ''
  try {
    preview.value = await fetchPreview(code.value.trim())
  } catch (err) {
    preview.value = null
    couponError.value = getErrorMessage(err, t('This coupon can\'t be used'))
  } finally {
    applying.value = false
  }
}

function removeCoupon() {
  code.value = ''
  preview.value = null
  couponError.value = ''
}

async function pay() {
  paying.value = true
  try {
    const result = course.value
      ? await checkoutCourse(course.value.slug, preview.value?.code, paymentMethod.value)
      : await checkout(preview.value?.code, paymentMethod.value)
    if (result.checkoutUrl) {
      await navigateTo(result.checkoutUrl, { external: true })
      return
    }
    // Orders that cost nothing settle straight away
    await refresh()
    toast.success(t('You\'re enrolled!'), t('Your new courses are in My Learning.'))
    await router.push('/my-learning')
  } catch (err) {
    toast.error(t('Checkout failed'), getErrorMessage(err, t('Unable to start checkout')))
  } finally {
    paying.value = false
  }
}

onMounted(async () => {
  try {
    const current = await refresh()
    // The card is optional, so a failure here only hides that choice
    card.value = (await fetchMine().catch(() => null))?.card ?? null
    if (courseSlug.value) {
      course.value = await $fetch<Course>(`/api/courses/${encodeURIComponent(courseSlug.value)}`)
    } else if (!current.items.length) {
      await router.replace('/cart')
    }
  } catch (err) {
    loadError.value = getErrorMessage(err, t('Unable to load your cart'))
  } finally {
    pending.value = false
  }
})
</script>
