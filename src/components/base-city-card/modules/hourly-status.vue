<script async setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useWeatherStore } from '@/stores/weather'
import HumidityIcon from '../../../../public/icons/humidity-svgrepo-com.svg'
import { ClockIcon } from '@heroicons/vue/24/outline'
import type { City, SimpleHourlyPoint } from '@/stores/models/simple-city-models'
import { getWeatherIconUrl, mapWeatherCodeToFarsi } from './utils/weather-display-utils'

const props = withDefaults(
  defineProps<{
    city: City
    rangeHours?: number
    pastHours?: number
  }>(),
  { rangeHours: 24, pastHours: 0 },
)

const hours = ref<SimpleHourlyPoint[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentVisibleIdx = ref<number | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const currentCityTimeIso = ref('')

const store = useWeatherStore()
const ui = useUiStore()

function getHourFromIso(isoTime: string): number {
  if (!isoTime) return 0
  const parts = isoTime.split('T')
  if (parts.length < 2) return 0
  return parseInt(parts[1]!.substring(0, 2), 10)
}

function formatHourDisplay(isoTime: string) {
  const h = getHourFromIso(isoTime)
  return `${h}:00`
}

function getTargetDateString(timezone: string, dayIndex: number): string {
  const now = new Date()
  now.setDate(now.getDate() + dayIndex)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const p: Record<string, string> = {}
  parts.forEach(({ type, value }) => {
    p[type] = value
  })
  return `${p.year}-${p.month}-${p.day}`
}

function getCurrentCityTimeIso(timezone: string): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const p: Record<string, string> = {}
  parts.forEach(({ type, value }) => {
    p[type] = value
  })
  const h = p.hour === '24' ? '00' : p.hour
  return `${p.year}-${p.month}-${p.day}T${h}:00`
}

async function loadHours() {
  loading.value = true
  error.value = null

  try {
    const simple = await store.getSimpleForecastForCity(props.city)

    if (!simple?.hourly?.length) {
      handleError('دادهٔ ساعتی در دسترس نیست')
      return
    }

    const timezone = props.city.timezone ?? 'UTC'
    const targetDateStr = getTargetDateString(timezone, ui.selectedDayIndex)

    const dayHours = simple.hourly.filter((p) => p.time.startsWith(targetDateStr))

    if (dayHours.length === 0) {
      handleError(ui.selectedDayIndex > 0 ? 'داده برای این روز موجود نیست' : 'داده یافت نشد')
      return
    }

    hours.value = dayHours

    if (ui.selectedDayIndex === 0) {
      currentCityTimeIso.value = getCurrentCityTimeIso(timezone)
      const currentHourIso = currentCityTimeIso.value.substring(0, 13)
      const nowIdx = dayHours.findIndex((p) => p.time.startsWith(currentHourIso))
      currentVisibleIdx.value = nowIdx >= 0 ? nowIdx : null
    } else {
      currentCityTimeIso.value = ''
      currentVisibleIdx.value = null
    }

    await scrollToCurrentTime()
  } catch (e) {
    console.error(e)
    handleError('خطا در پردازش داده‌ها')
  } finally {
    loading.value = false
  }
}

async function scrollToCurrentTime() {
  await nextTick()
  if (!containerRef.value) return

  if (currentVisibleIdx.value === null) {
    containerRef.value.scrollTo({ left: 0, behavior: 'smooth' })
    return
  }

  const activeEl = containerRef.value.querySelector('#active-hour-card')
  if (activeEl) {
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

function handleError(msg: string) {
  error.value = msg
  hours.value = []
  currentVisibleIdx.value = null
}

const isTimePast = (targetIso: string, referenceIso: string): boolean => {
  if (!referenceIso) return false
  return targetIso < referenceIso
}

watch(
  () => [props.city, ui.selectedDayIndex],
  async () => {
    await loadHours()
  },
)

await loadHours()

onMounted(async () => {
  await scrollToCurrentTime()
})
</script>

<template>
  <div class="hourly-module">
    <template v-if="loading">
      <div class="flex gap-3 overflow-x-auto py-2 px-1">
        <div
          v-for="n in 6"
          :key="n"
          class="w-28 h-36 rounded-xl bg-slate-200 animate-pulse flex-shrink-0"
        />
      </div>
    </template>

    <template v-else-if="error">
      <div
        class="flex items-center justify-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300"
      >
        <p class="text-sm text-slate-400">{{ error }}</p>
      </div>
    </template>

    <template v-else>
      <!-- اضافه شدن کلاس scroll-mask -->
      <div ref="containerRef" class="overflow-x-auto -mx-1 py-4 dir-ltr-scroll snap-x scroll-mask">
        <TransitionGroup name="hour-fade" tag="div" class="flex gap-4 py-4 px-4">
          <!-- px-4 اضافه شد تا آیتم اول زیر ماسک نره -->
          <div
            v-for="(h, idx) in hours"
            :key="idx"
            :id="idx === currentVisibleIdx ? 'active-hour-card' : undefined"
            class="hour-card w-28 flex-shrink-0 bg-white rounded-xl p-3 text-center transition-all duration-300 snap-center"
            :class="{
              'shadow-lg scale-110 bg-sky-50 z-10':
                idx === currentVisibleIdx && ui.selectedDayIndex === 0 /* استایل جدید زمان حال */,
              shadow: !(idx === currentVisibleIdx && ui.selectedDayIndex === 0),
              'opacity-50 grayscale': isTimePast(h.time, currentCityTimeIso),
            }"
          >
            <p
              class="flex items-center justify-center text-sm font-bold w-2/3 rounded-3xl py-1 mb-2 gap-1 mx-auto transition-colors"
              :class="
                idx === currentVisibleIdx && ui.selectedDayIndex === 0
                  ? 'bg-sky-200 text-sky-700'
                  : 'bg-slate-100 text-gray-500'
              "
            >
              <span class="pt-0.5">{{ formatHourDisplay(h.time) }}</span>
              <ClockIcon class="size-3.5" />
            </p>

            <img
              class="mx-auto size-10 mb-2 object-contain"
              :src="getWeatherIconUrl((h.values.weathercode ?? 0) as number, h.time)"
              :alt="mapWeatherCodeToFarsi((h.values.weathercode ?? 0) as number).title"
              loading="lazy"
            />

            <p dir="ltr" class="text-2xl font-bold text-slate-800 mb-1">
              {{ Math.round(h.values.temperature_2m ?? 0) }}°
            </p>

            <div class="text-xs text-gray-500 flex items-center justify-center gap-1 mt-auto">
              <HumidityIcon class="w-3.5 h-3.5 fill-slate-400" />
              <span>{{ h.values.relativehumidity_2m ?? '-' }}%</span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>
  </div>
</template>

<style scoped lang="css">
.hourly-module {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.dir-ltr-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

/* Mask implementation */
.scroll-mask {
  /* ماسک خطی: 5 درصد اول و آخر شفاف میشه */
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
  mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
}

.hour-card {
  display: flex;
  flex-direction: column;
  min-height: 10rem;
  /* اضافه کردن will-change برای پرفورمنس بهتر انیمیشن اسکیل */
  will-change: transform;
}
.hour-card:hover {
  transform: translateY(-2px);
}
/* وقتی کارتی اکتیو هست (اسکیل شده)، هاورش نباید تکون بخوره */
.hour-card.scale-110:hover {
  transform: scale(1.1);
}

.hourly-module ::-webkit-scrollbar {
  height: 6px;
}
.hourly-module ::-webkit-scrollbar-track {
  background: transparent;
}
.hourly-module ::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.hourly-module ::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

.hour-fade-enter-active,
.hour-fade-leave-active {
  transition: all 0.3s ease;
}
.hour-fade-enter-from,
.hour-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
