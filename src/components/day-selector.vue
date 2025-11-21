<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { ref, onMounted, watch, nextTick } from 'vue'

const ui = useUiStore()
const containerRef = ref<HTMLElement | null>(null)

// touch-based swipe detection that does not block native scrolling
let touchStartX = 0
let touchStartTime = 0

function onTouchStart(e: TouchEvent) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartTime = Date.now()
}

function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = t.clientX - touchStartX
  const dt = Date.now() - touchStartTime
  const THRESH = 40
  // require a minimum distance; allow slower swipes (dt threshold generous)
  if (Math.abs(dx) > THRESH && dt < 1000) {
    // detect directionality (RTL vs LTR) so swipe direction feels natural
    const dir = containerRef.value
      ? getComputedStyle(containerRef.value).direction
      : document.documentElement.dir || 'ltr'
    const isRtl = dir === 'rtl'
    // in LTR: swipe left (dx < 0) -> next; swipe right -> prev
    // in RTL this mapping should be inverted to match natural scrolling
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
  if (e.key === 'ArrowLeft') {
    ui.prevDay()
    e.preventDefault()
  } else if (e.key === 'ArrowRight') {
    ui.nextDay()
    e.preventDefault()
  }
}

function select(i: number) {
  ui.setSelectedDay(i)
}

onMounted(async () => {
  await nextTick()
  // ensure today (index 0) is at the start on mobile
  const c = containerRef.value
  if (!c) return
  // scroll so the selected button is at the logical start (won't cause window scroll)
  const btn = c.querySelector<HTMLButtonElement>(`button[data-day-index="${ui.selectedDayIndex}"]`)
  if (btn) {
    const containerRect = c.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    const dir = getComputedStyle(c).direction || document.documentElement.dir || 'ltr'
    const isRtl = dir === 'rtl'
    let target = 0
    if (!isRtl) {
      target = c.scrollLeft + (btnRect.left - containerRect.left)
    } else {
      // align logical start for RTL (visual right)
      const containerRight = containerRect.left + containerRect.width
      target = c.scrollLeft + (btnRect.right - containerRight)
    }
    c.scrollTo({ left: Math.max(0, Math.round(target)), behavior: 'auto' })
  }
})

watch(
  () => ui.selectedDayIndex,
  async (v) => {
    await nextTick()
    const c = containerRef.value
    if (!c) return
    const btn = c.querySelector<HTMLButtonElement>(`button[data-day-index="${v}"]`)
    if (btn) {
      const containerRect = c.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      const dir = getComputedStyle(c).direction || document.documentElement.dir || 'ltr'
      const isRtl = dir === 'rtl'
      let target = 0
      if (!isRtl) {
        target = c.scrollLeft + (btnRect.left - containerRect.left)
      } else {
        const containerRight = containerRect.left + containerRect.width
        target = c.scrollLeft + (btnRect.right - containerRight)
      }
      c.scrollTo({ left: Math.max(0, Math.round(target)), behavior: 'smooth' })
    }
  },
)
</script>

<template>
  <div class="day-selector w-full flex-none overflow-x-auto">
    <div
      ref="containerRef"
      class="day-buttons !w-full flex-none"
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
          ui.selectedDayIndex === d.index
            ? ' text-sky-700 transform scale-105 shadow-md'
            : 'hover:bg-slate-50',
        ]"
        @click="select(d.index)"
      >
        <div class="text-sm">{{ d.label }}</div>
        <div class="text-xs text-slate-500">{{ d.short }}</div>
      </button>
    </div>

    <!-- dropdown removed: now double-tap/dropdown behavior disabled -->
  </div>
</template>

<style scoped lang="css">
.day-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.day-buttons {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  padding-inline: 0.5rem; /* give breathing room on edges */
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  scroll-snap-type: x proximity;
}
.day-btn {
  min-width: 64px;
  background: transparent;
  border: 1px solid transparent;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  text-align: center;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
  scroll-snap-align: start;
}
</style>
