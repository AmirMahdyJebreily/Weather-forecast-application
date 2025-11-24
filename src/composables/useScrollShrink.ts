import { ref, onMounted, onUnmounted, watch, nextTick, type ShallowRef } from 'vue'

// **تغییر ۱: تعریف تابع پیش‌فرض Ease-In (مشابه Cubic Bezier)**
// این تابع نسبت خطی (0 تا 1) را گرفته و آن را به صورت غیرخطی تبدیل می‌کند
// شیب در x=0 صفر است (شروع نرم) و به سرعت تند می‌شود.
const cubicEaseIn = (x: number): number => {
  return x * x * x // x به توان 3
}

export function useScrollShrink<T extends HTMLElement>(
  targetRef: ShallowRef<T | null>,
  maxHeight: number,
  minHeight: number,
  // پارامترهای جدید
  resistanceFactor = 0, // مقاومت بین 0 تا 1
  easeFn = cubicEaseIn, // تابع نرمال‌سازی غیرخطی
  maxScroll = (maxHeight + minHeight) / 4
) {
  const height = ref(maxHeight)

  let lock = false
  let pendingScroll: number | null = null

  let loopCounter = 0
  const LOOP_THRESHOLD = 5
  // CHANGE_RATE حذف شده زیرا از Adaptive Smoothing استفاده می‌کنیم
  let minHeightObserved = maxHeight

  // Adaptive smoothing
  let lastDelta = (maxHeight - minHeight) * 0.08 // استفاده از مقدار ثابت قبلی به عنوان شروع
  const SMOOTH_FACTOR = 0.7

  const applyHeight = (scrollY: number) => {
    // **تغییر ۲: اعمال مقاومت (Resistance Logic)**

    // ۱. محاسبه آستانه مقاومت: میزان پیمایشی که باید قبل از شروع تغییر ارتفاع غلبه شود
    const resistanceThreshold = maxScroll * resistanceFactor

    // ۲. محاسبه پیمایش موثر (Effective Scroll): مقدار پیمایش پس از کسر مقاومت
    const effectiveScroll = Math.max(0, scrollY - resistanceThreshold)

    // ۳. محاسبه ماکسیمم پیمایش قابل استفاده پس از اعمال مقاومت
    const effectiveMaxScroll = maxScroll - resistanceThreshold

    // ۴. محاسبه نسبت خطی (Ratio) از پیمایش موثر به ماکسیمم موثر
    let ratio = 0
    if (effectiveMaxScroll > 0) {
      ratio = Math.min(effectiveScroll / effectiveMaxScroll, 1)
    }

    // **تغییر ۳: اعمال تابع نرمال‌سازی (Easing Function)**
    // نسبت خطی را از طریق تابع Ease (که از بیرون گرفته شده) عبور می‌دهیم
    const smoothedRatio = easeFn(ratio)

    // ۵. محاسبه ارتفاع هدف بر اساس نسبت نرمال‌شده
    const heightDifference = maxHeight - minHeight
    const targetHeight = maxHeight - heightDifference * smoothedRatio

    if (targetHeight < minHeightObserved) minHeightObserved = targetHeight

    let delta = targetHeight - height.value

    // مشتق هندسی: تغییرات پشت سر هم کمتر و کمتر شود
    delta *= SMOOTH_FACTOR

    // استفاده از lastDelta برای کنترل پرش‌های بزرگ
    if (Math.abs(delta) > lastDelta) {
      lastDelta = Math.abs(delta)
      height.value += delta
    } else {
      height.value += delta // در غیر این صورت، تغییرات کوچک را اعمال کن
    }
  }

  const processScroll = async (scrollY: number) => {
    if (lock) {
      pendingScroll = scrollY
      return
    }

    lock = true

    requestAnimationFrame(async () => {
      loopCounter++
      applyHeight(scrollY)
      await nextTick()

      // شناسایی حلقه
      if (loopCounter >= LOOP_THRESHOLD) {
        height.value = minHeightObserved
        loopCounter = 0
        minHeightObserved = maxHeight
        await nextTick()
      }

      lock = false

      if (pendingScroll !== null) {
        const last = pendingScroll
        pendingScroll = null
        processScroll(last)
      } else {
        loopCounter = 0
        minHeightObserved = maxHeight
        // Reset lastDelta
        lastDelta = (maxHeight - minHeight) * 0.08
      }
    })
  }

  const onScroll = () => {
    const el = targetRef.value
    if (!el) return
    processScroll(el.scrollTop)
  }

  onMounted(() => {
    watch(
      targetRef,
      (el, _, onCleanup) => {
        if (!el) return
        el.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        onCleanup(() => el.removeEventListener('scroll', onScroll))
      },
      { immediate: true }
    )
  })

  onUnmounted(() => {
    if (targetRef.value) {
      targetRef.value.removeEventListener('scroll', onScroll)
    }
  })

  return { height }
}
