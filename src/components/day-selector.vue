<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { ref, onMounted, watch, nextTick, defineProps } from 'vue'

const ui = useUiStore()

const props = defineProps({
  isCompact: {
    type: Boolean,
    default: false,
  },
})

const containerRef = ref<HTMLElement | null>(null)
const translateXValue = ref('0px')

// touch-based swipe detection (بدون تغییر)
let touchStartX = 0
let touchStartTime = 0

function onTouchStart(e: TouchEvent) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartTime = Date.now()
}

function onTouchEnd(e: TouchEvent) {
  if (props.isCompact) return

  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touchStartX
  const dt = Date.now() - touchStartTime
  const THRESH = 40
  if (Math.abs(dx) > THRESH && dt < 1000) {
    const dir = containerRef.value
      ? getComputedStyle(containerRef.value).direction
      : document.documentElement.dir || 'ltr'
    const isRtl = dir === 'rtl'
    if (dx < 0) {
      if (isRtl) ui.prevDay()
      else ui.nextDay()
    } else {
      if (isRtl) ui.nextDay()
      else ui.prevDay()
    }
  }
  touchStartX = 0
  touchStartTime = 0
}

function onKeyDown(e: KeyboardEvent) {
  if (props.isCompact) return

  if (e.key === 'ArrowLeft') {
    ui.prevDay()
    e.preventDefault()
  } else if (e.key === 'ArrowRight') {
    ui.nextDay()
    e.preventDefault()
  }
}

function select(i: number) {
  if (props.isCompact) return

  ui.setSelectedDay(i)
}

/**
 * تابع برای محاسبه و به‌روزرسانی transformX
 */
function updateTransform() {
  const c = containerRef.value
  if (!c) return

  const viewportContainer = c.parentElement
  if (!viewportContainer) return

  const btn = c.querySelector<HTMLButtonElement>(`button[data-day-index="${ui.selectedDayIndex}"]`)
  if (!btn) return

  const viewportRect = viewportContainer.getBoundingClientRect()
  const btnRect = btn.getBoundingClientRect()
  const dir = getComputedStyle(viewportContainer).direction || document.documentElement.dir || 'ltr'
  const isRtl = dir === 'rtl'

  let offsetToCenter: number

  if (props.isCompact) {
    // **حالت Compact: چسباندن به شروع (Start/Edge)**
    let offset: number

    // پدینگ 0.5rem (8px) که در CSS داده شده است.
    const padding = 8

    if (isRtl) {
      // RTL: دکمه انتخابی (سمت راست دکمه) باید به لبه راست ویوپورت (منهای پدینگ) بچسبد.
      // افست = (لبه راست ویوپورت - پدینگ) - لبه راست دکمه
      offset = viewportRect.left + viewportRect.width - padding - btnRect.right
    } else {
      // LTR: دکمه انتخابی (لبه چپ دکمه) باید به لبه چپ ویوپورت (به علاوه پدینگ) بچسبد.
      // افست = (لبه چپ ویوپورت + پدینگ) - لبه چپ دکمه
      offset = viewportRect.left + padding - btnRect.left
    }

    offsetToCenter = offset
  } else {
    // **حالت عادی (مرکز): منطق قبلی**

    // موقعیت مرکز دکمه نسبت به شروع Viewport
    const btnCenterRelativeToViewport = btnRect.left + btnRect.width / 2
    // مرکز Viewport
    const viewportCenter = viewportRect.left + viewportRect.width / 2

    // محاسبه افست مورد نیاز
    offsetToCenter = viewportCenter - btnCenterRelativeToViewport
  }

  // مقدار فعلی translateX را استخراج می‌کنیم.
  const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(c).transform)
  const currentTranslateX = currentTransform.e

  // مقدار نهایی translateX = مقدار فعلی translateX + افست مورد نیاز
  const newTranslateX = currentTranslateX + offsetToCenter

  translateXValue.value = `${newTranslateX}px`
}

onMounted(async () => {
  await nextTick()
  updateTransform()
})

watch(
  () => ui.selectedDayIndex,
  async () => {
    await nextTick()
    updateTransform()
  },
  { immediate: true },
)

// اجرای مجدد transform هنگام تغییر حالت فشرده
watch(
  () => props.isCompact,
  async () => {
    await nextTick()
    updateTransform()
  },
)
</script>

<template>
  <div class="day-selector w-full flex-none overflow-hidden">
    <div
      ref="containerRef"
      class="day-buttons-wrapper"
      :style="{ transform: `translateX(${translateXValue})` }"
      role="tablist"
      tabindex="0"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
      @keydown="onKeyDown"
    >
      <button
        v-for="d in ui.dayList"
        :key="d.index"
        role="tab"
        :aria-pressed="ui.selectedDayIndex === d.index"
        :data-day-index="d.index"
        :class="[
          'day-btn',
          // **تغییر ۱: کلاس border-0 به صورت شرطی در سطح بالا اضافه می‌شود**
          { '!border-0': props.isCompact },

          ui.selectedDayIndex === d.index
            ? ' text-sky-700 transform scale-105 border-y box-content border-gray-300'
            : [
                'hover:bg-slate-50 text-gray-400',
                {
                  'hidden-when-compact': props.isCompact && ui.selectedDayIndex !== d.index,
                },
                // **تغییر ۲: کلاس !border-0 از اینجا حذف می‌شود**
              ],
        ]"
        @click="select(d.index)"
        :disabled="props.isCompact && ui.selectedDayIndex !== d.index"
      >
        <div class="text-sm">{{ d.label }}، {{ d.short }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped lang="css">
.day-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
}

.day-buttons-wrapper {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.25rem;
  padding-top: 0.25rem;
  padding-inline: 0.5rem; /* 0.5rem = 8px */
  white-space: nowrap;
  transition: transform 0.3s ease-in-out;
}

.hidden-when-compact {
  display: none !important;
}

.day-btn {
  min-width: 64px;
  background: transparent;
  padding: 0.35rem 0.5rem;
  text-align: center;
  cursor: pointer;
  transition:
    transform 160ms ease,
    border 160ms ease 50ms,
    color 160ms ease;
  flex-shrink: 0;
  display: inline-block;
}
</style>
