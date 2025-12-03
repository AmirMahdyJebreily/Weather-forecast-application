<script setup lang="ts">
import { computed, useTemplateRef, ref, watch, nextTick } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'
import BaseModal from '@/components/base-modal.vue'
import DaySelector from '@/components/day-selector.vue'
import { useUiStore } from '@/stores/ui'
import { InformationCircleIcon, MapPinIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/solid'
import { useScrollShrink } from '@/composables/useScrollShrink'
import { views } from '@/router'
import type { City } from '@/stores/models/simple-city-models'

const store = useWeatherStore()
const ui = useUiStore()

const el = useTemplateRef('scroller')

enum HomePageScrollShrinks {
  MAX_HEIGHT = 210,
  MIN_HEIGHT = 70,
  MAX_SCROLL = (MAX_HEIGHT + MIN_HEIGHT) / 3,
}

// تعریف یک تابع سفارشی (مثلاً قوی‌تر)
const customEase = (x: number) => {
  // Ease-In-Quart: شروع بسیار ملایم
  return x * x * x * x
}

// استفاده از هوک:
// ماکس ارتفاع: 200، مین ارتفاع: 60، مقاومت: 0.5 (نصف ماکس اسکرول مقاومت می‌کند)، تابع: customEase
const { height } = useScrollShrink(
  el,
  HomePageScrollShrinks.MAX_HEIGHT,
  HomePageScrollShrinks.MIN_HEIGHT,
  0.2, // resistanceFactor
  customEase, // easeFn
  HomePageScrollShrinks.MAX_SCROLL,
)
const headerStyle = computed(() => ({
  height: height.value ? height.value.toFixed(0) + 'px' : 'auto',
}))

/* modal state for delete confirmation */
const modalVisible = ref(false)
const modalCity = ref<City | null>(null)
const expandedCityId = ref<string | null>(null) // stored as `${selectedDayIndex}:${cityId}`
const NOW_ONLY: string[] = ['now-status', 'expand-status']
const NOW_AND_HOURLY: string[] = ['now-status', 'hourly-status', 'quality-status']

function requestDelete(city: City) {
  modalCity.value = city
  modalVisible.value = true
}

function confirmDelete() {
  if (modalCity.value) {
    store.toggleFavorite(modalCity.value)
  }
  modalCity.value = null
  modalVisible.value = false
}

function toggleExpand(cityId: string) {
  const key = `${ui.selectedDayIndex}:${cityId}`
  expandedCityId.value = expandedCityId.value === key ? null : key
}

// double-tap detection for touch devices and dblclick for mouse
let lastTap = 0
let lastTapId: string | null = null
let touchStartX = 0
let touchStartY = 0
let lastTouchToggle = 0

function onCardTouchStart(e: TouchEvent) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartY = t.clientY
}

function onCardTouchEnd(e: TouchEvent, id: string) {
  const t = e.changedTouches && e.changedTouches[0]
  if (!t) return
  const dx = Math.abs(t.clientX - touchStartX)
  const dy = Math.abs(t.clientY - touchStartY)
  const MOVE_TH = 10
  if (dx > MOVE_TH || dy > MOVE_TH) {
    // treat as scroll/drag, ignore
    lastTap = 0
    lastTapId = null
    return
  }
  const now = Date.now()
  if (lastTapId === id && now - lastTap < 350) {
    // double tap
    toggleExpand(id)
    lastTap = 0
    lastTapId = null
    lastTouchToggle = Date.now()
  } else {
    lastTap = now
    lastTapId = id
  }
}

function onCardDblClick(id: string) {
  // desktop double-click support. ignore if a touch double-tap just toggled.
  if (Date.now() - lastTouchToggle < 600) return
  toggleExpand(id)
}

// when a card expands, scroll it into view vertically (centered)
watch(expandedCityId, async (id) => {
  await nextTick()
  if (!id) return
  // `id` is stored as `${selectedDayIndex}:${cityId}`. extract cityId (may contain colons)
  const sep = id.indexOf(':')
  const cityId = sep >= 0 ? id.slice(sep + 1) : id
  const el = document.querySelector(`[data-card-id="${cityId}"]`) as HTMLElement | null
  if (!el) return
  // scroll the card into center of viewport smoothly
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>

<template>
  <div
    ref="scroller"
    class="w-dvw overflow-y-auto overflow-hidden scroll-py-2 flex flex-col items-center h-full justify-start"
  >
    <header
      class="w-full flex-none fixed top-0 z-50 backdrop-blur-lg bg-gradient-to-t from-white to-slate-50 transition-[height] pt-8 ease-out container flex-col flex gap-y-4 scrollbar-mobile items-center justify-end"
      :style="{ ...headerStyle, willChange: 'scroll-position' }"
    >
      <div
        class="header-container w-full container flex-row flex gap-y-6 items-center will-change-scroll justify-start pb-3 px-4"
      >
        <h1
          class="header-title text-right text-2xl flex items-center justify-center gap-x-2 flex-none sm:text-3xl font-extrabold text-slate-700 [container-type:height] [&:container(height>150px)]:text-4xl [&:container(height>200px)]:text-5xl"
        >
          <span>هوای من</span>
          <RouterLink class="header-info-link bg-gray-100 p-0.5 rounded-full" :to="views.ABOUTUS"
            ><InformationCircleIcon class="size-6" />
          </RouterLink>
        </h1>

        <DaySelector :is-compact="height < HomePageScrollShrinks.MAX_SCROLL" />
      </div>
    </header>
    <div
      class="flex-none"
      :style="{
        height: HomePageScrollShrinks.MAX_HEIGHT + 'px',
      }"
    ></div>
    <div class="w-full md:w-1/2 flex flex-col items-center justify-start gap-3 flex-1 h-full px-4">
      <transition-group name="fav" tag="div" class="w-full flex flex-col gap-3">
        <div
          v-for="value in store.favorites"
          :key="value.id"
          class="card-wrapper"
          :data-card-id="value.id"
        >
          <div
            class="w-full"
            @touchstart.passive="onCardTouchStart"
            @touchend.passive="(e) => onCardTouchEnd(e, value.id)"
            @dblclick.prevent="() => onCardDblClick(value.id)"
            :aria-expanded="expandedCityId === ui.selectedDayIndex + ':' + value.id"
          >
            <BaseCityCard
              :city="value"
              :modules-raw="
                expandedCityId === ui.selectedDayIndex + ':' + value.id ? NOW_AND_HOURLY : NOW_ONLY
              "
            >
              <template #actions>
                <button
                  @click.stop="requestDelete(value)"
                  class="flex items-center justify-center flex-none rounded-full"
                >
                  <TrashIcon class="size-5 text-rose-600" />
                </button>
              </template>
            </BaseCityCard>
          </div>
        </div>
        <div
          class="flex-none"
          :style="{
            height: HomePageScrollShrinks.MAX_HEIGHT - HomePageScrollShrinks.MAX_HEIGHT / 10 + 'px',
          }"
        >
          <p class="text-gray-800 font-thin text-center">برای افزودن بیشتر، روی دکمه + بزنید</p>
        </div>
      </transition-group>
      <div
        class="flex flex-col items-center justify-center gap-1 h-4/5 text-slate-500/80"
        v-if="store.favorites.length < 1 && !store.loadingSearch"
      >
        <MapPinIcon class="size-20" />
        <span class="text-3xl font-bold">مکانی نیست!</span>
        <span class="text-xl font-light">مکانی انتخاب کنید...</span>
      </div>

      <div
        class="flex flex-col items-center justify-center gap-1 w-full"
        v-if="store.loadingSearch"
      >
        <span class="bg-slate-300/60 animate-pulse rounded-3xl h-[174px] w-full"></span>
      </div>

      <RouterLink
        :to="{ name: 'srchloc' }"
        :class="`fixed flex items-center !transition-[left] duration-1000 justify-center size-14 bg-gradient-to-t from-slate-400/50 shadow-lg shadow-slate-4/7000 backdrop-blur-md to-slate-300/50 rounded-full bottom-12 ${!(store.favorites.length < 1 && !store.loadingSearch) ? 'left-6' : 'before:absolute before:rounded-full before:animate-ping animate-bounce z-50 before:bg-gray-100/50 before:z-40 before:size-full'} text-slate-600`"
      >
        <PlusIcon class="size-7" />
      </RouterLink>
    </div>
    <!-- delete confirmation modal -->
    <BaseModal v-model:modelValue="modalVisible" @confirm="confirmDelete">
      <div class="flex w-full items-center justify-center gap-4 py-3">
        <ExclamationTriangleIcon class="text-rose-600 size-12" />
        <div>
          <p class="text-lg font-bold">می‌خوای {{ modalCity?.name }} حذف بشه؟</p>
          <p class="text-sm text-slate-500 font-medium mt-2">
            نگران نباش — اگه پشیمون شدی می‌تونی با دکمهٔ + دوباره اضافه کنی.
          </p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style lang="css" scoped>
/* ابتدا کانتینر را تعریف می‌کنیم */
header {
  container-type: size; /* حتما باید این را داشته باشیم تا container query فعال شود */
}

/* TransitionGroup animations for favorite cards */
.fav-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.995);
}
.fav-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fav-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
  height: 0 !important;
  margin: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.fav-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    height 200ms ease,
    margin 200ms ease,
    padding 200ms ease;
}
.fav-move {
  transition: transform 200ms ease;
}

/* استایل پیش‌فرض برای h1 و h2 */
.header-title {
  font-size: 1.5rem; /* برای ارتفاع کم */
  transition:
    font-size 0.15s ease,
    margin 0.25s ease;
}

.header-time {
  font-size: 1rem;
  transition:
    font-size 0.15s ease,
    margin 0.25s ease;
}

/* وقتی ارتفاع container حداقل 100px باشد */
@container (min-height: 100px) {
  .header-container {
    flex-direction: column;
    justify-content: center;
    padding-bottom: 24px;
  }
  .header-title {
    font-size: 2rem;
    text-align: right !important;
  }

  .header-time {
    font-size: 1.25rem;
    text-align: right !important;
  }

  .header-info-link {
    @apply absolute top-4 right-4;
  }
}

/* وقتی ارتفاع container حداقل 150px باشد */
@container (min-height: 150px) {
  header {
    border-bottom-right-radius: 35px !important;
  }
  .header-title {
    font-size: 2.5rem;
    text-align: center !important;
  }

  .header-time {
    font-size: 1.5rem;
    text-align: center !important;
  }
}

/* وقتی ارتفاع container حداقل 200px باشد */
@container (min-height: 200px) {
  .header-container {
    gap: 1.5rem;
  }
  .header-title {
    font-size: 3rem;
    text-align: center !important;
  }

  .header-time {
    font-size: 1.75rem;
    text-align: center !important;
  }
}
</style>
