<script async setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useWeatherStore, type City, type SimpleHourlyPoint } from '@/stores/weather'
import HumidityIcon from '../../../../public/icons/humidity-svgrepo-com.svg'

const props = withDefaults(
  defineProps<{
    city: City
    /** how many hours to show forward from current (default 24) */
    rangeHours?: number
    /** how many hours to include from the past (default 0) */
    pastHours?: number
  }>(),
  { rangeHours: 24, pastHours: 0 },
)

const hours = ref<SimpleHourlyPoint[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const currentVisibleIdx = ref<number | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const store = useWeatherStore()

function mapWeatherCodeToFarsi(code: number) {
  const weatherMap: Record<
    number,
    { title: string; description: string; icon_day?: number; icon_night?: number }
  > = {
    0: { title: 'صاف', description: 'صاف و بدون ابر', icon_day: 1, icon_night: 33 },
    1: { title: 'نیمه صاف', description: 'ابرهای پراکنده', icon_day: 2, icon_night: 34 },
    2: { title: 'نیمه‌ابری', description: 'آسمان نیمه‌ابری', icon_day: 3, icon_night: 35 },
    3: { title: 'ابری', description: 'آسمان کاملاً ابری', icon_day: 7, icon_night: 38 },
    45: { title: 'مه', description: 'مه روی زمین', icon_day: 11, icon_night: 11 },
    48: { title: 'مه', description: 'مه همراه با رسوب', icon_day: 11, icon_night: 11 },
    51: { title: 'باران', description: 'نم‌نم سبک', icon_day: 12, icon_night: 39 },
    53: { title: 'باران', description: 'نم‌نم متوسط', icon_day: 12, icon_night: 39 },
    55: { title: 'باران', description: 'نم‌نم شدید', icon_day: 18, icon_night: 40 },
    56: { title: 'باران یخی', description: 'یخی سبک', icon_day: 26, icon_night: 26 },
    57: { title: 'باران یخی', description: 'یخی شدید', icon_day: 26, icon_night: 26 },
    61: { title: 'باران', description: 'خفیف', icon_day: 12, icon_night: 39 },
    63: { title: 'باران', description: 'متوسط', icon_day: 18, icon_night: 40 },
    65: { title: 'باران', description: 'شدید', icon_day: 18, icon_night: 18 },
    66: { title: 'باران یخی', description: 'خفیف', icon_day: 26, icon_night: 26 },
    67: { title: 'باران یخی', description: 'شدید', icon_day: 26, icon_night: 26 },
    71: { title: 'برف', description: 'خفیف', icon_day: 22, icon_night: 22 },
    73: { title: 'برف', description: 'متوسط', icon_day: 22, icon_night: 22 },
    75: { title: 'برف', description: 'شدید', icon_day: 22, icon_night: 22 },
    77: { title: 'برف', description: 'دانه‌های برف', icon_day: 19, icon_night: 19 },
    80: { title: 'رگبار باران', description: 'خفیف', icon_day: 12, icon_night: 39 },
    81: { title: 'رگبار باران', description: 'متوسط', icon_day: 12, icon_night: 40 },
    82: { title: 'رگبار باران', description: 'شدید', icon_day: 18, icon_night: 18 },
    85: { title: 'رگبار برف', description: 'خفیف', icon_day: 21, icon_night: 43 },
    86: { title: 'رگبار برف', description: 'شدید', icon_day: 21, icon_night: 43 },
    95: {
      title: 'رعد و برق',
      description: 'بارش همراه با رعد و برق',
      icon_day: 15,
      icon_night: 15,
    },
    96: { title: 'رعد و برق', description: 'با تگرگ خفیف', icon_day: 15, icon_night: 15 },
    99: { title: 'رعد و برق', description: 'با تگرگ شدید', icon_day: 15, icon_night: 15 },
  }

  return (
    weatherMap[code] ?? {
      title: 'نامشخص',
      description: 'کد آب و هوا نامشخص',
      icon_day: 7,
      icon_night: 38,
    }
  )
}

function getWeatherIconUrl(code: number, date: Date) {
  const { icon_day, icon_night } = mapWeatherCodeToFarsi(code)
  const hour = date.getHours()
  const isNight = hour < 6 || hour >= 18
  const icon = isNight ? (icon_night ?? icon_day) : (icon_day ?? icon_night)
  return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`
}

function formatHour(date: Date, timeZone?: string) {
  try {
    const dtf = new Intl.DateTimeFormat('fa-IR', {
      hour: 'numeric',
      hour12: false,
      timeZone: timeZone ?? 'UTC',
    })
    return dtf.format(date)
  } catch {
    return date.getHours().toString()
  }
}

async function loadHours() {
  loading.value = true
  error.value = null
  try {
    const simple = await store.getSimpleForecastForCity(props.city)
    if (!simple || !simple.hourly || simple.hourly.length === 0) {
      error.value = 'دادهٔ ساعتی در دسترس نیست'
      hours.value = []
      return
    }

    // try to get the current hour index using store helper
    const current = await store.getCurrentWeatherWithTimezone(props.city)
    let idx = typeof current?.index === 'number' ? current!.index : 0
    if (idx < 0) idx = 0

    // compute visible range using props.rangeHours and props.pastHours
    const start = Math.max(0, idx - (props.pastHours ?? 0))
    const end = Math.min(simple.hourly.length, idx + (props.rangeHours ?? 24))
    let slice = simple.hourly.slice(start, end)

    // remember which index inside the slice is the "current" hour
    const currentIdxInSlice = idx - start

    // rotate so the current hour is first (as requested)
    if (currentIdxInSlice > 0 && currentIdxInSlice < slice.length) {
      slice = slice.slice(currentIdxInSlice).concat(slice.slice(0, currentIdxInSlice))
    }

    hours.value = slice

    // after rotation the current hour is at index 0
    currentVisibleIdx.value = 0
  } catch {
    error.value = 'خطا در دریافت دادهٔ آب و هوا'
    hours.value = []
  } finally {
    loading.value = false
  }
}

await loadHours()

// when mounted, scroll the container so the current card is visible/centered
onMounted(async () => {
  await nextTick()
  // small delay to ensure children measured
  await new Promise((r) => setTimeout(r, 30))
  if (!containerRef.value) return
  const idx = currentVisibleIdx.value
  if (idx == null) return
  // after rotation current card is at index 0 — scroll to left
  const container = containerRef.value
  container.scrollTo({ left: 0, behavior: 'smooth' })
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
      <p class="text-sm text-red-500">{{ error }}</p>
    </template>

    <template v-else>
      <div ref="containerRef" class="overflow-x-auto -mx-1 py-2">
        <div class="flex gap-3 px-1">
          <div
            v-for="(h, idx) in hours"
            :key="h.time + '-' + idx"
            class="hour-card w-28 flex-shrink-0 bg-white rounded-xl p-3 text-center shadow"
            :class="{ 'current-card': idx === currentVisibleIdx }"
            :data-visible-idx="idx"
          >
            <p class="text-xs text-gray-500 mb-1">
              {{ formatHour(h.timeParsed ?? new Date(h.time), props.city.timezone) }}
            </p>
            <img
              class="mx-auto w-12 h-12 mb-1"
              :src="
                getWeatherIconUrl(
                  (h.values.weathercode ?? 0) as number,
                  h.timeParsed ?? new Date(h.time),
                )
              "
              :alt="mapWeatherCodeToFarsi((h.values.weathercode ?? 0) as number).title"
            />
            <p class="text-2xl font-semibold text-slate-800">
              {{ (h.values.temperature_2m ?? 0).toFixed(0) }}°
            </p>
            <p class="text-xs text-gray-500 flex items-center justify-center gap-1">
              <HumidityIcon
                class="inline-block w-4 h-4 fill-current text-slate-700 mr-1"
                role="img"
                aria-label="رطوبت"
              />
              {{ h.values.relativehumidity_2m ?? '-' }}%
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="css">
.hourly-module {
  /* keep module compact */
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.hour-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem;
}
.hour-card.current-card {
  border: 2px solid rgba(14, 165, 233, 0.9); /* sky-500 */
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.12);
}
/* hide default scrollbar on webkit but keep scroll functionality */
.hourly-module::-webkit-scrollbar {
  height: 8px;
}
.hourly-module::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 9999px;
}
</style>
