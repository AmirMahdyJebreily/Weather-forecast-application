<script async setup lang="ts">
import { useWeatherStore } from '@/stores/weather'
import { nextTick, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import HumidityIcon from '../../../../public/icons/humidity-svgrepo-com.svg'
import WindIcon from '../../../../public/icons/wind-svgrepo-com.svg'
import type { City } from '@/stores/models/simple-city-models'

// Import Shared Utils
import { mapWeatherCodeToFarsi, getWeatherIconUrl } from './utils/weather-display-utils'

const props = defineProps<{
  city: City
}>()

const tempereture = ref<number>(0)
const humidity = ref<number>(0)
const windspeed = ref<number>(0)
const weatherCode = ref<number>(0)

const store = useWeatherStore()
const ui = useUiStore()

function getYMDH(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone ?? 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date)

  let year = 0
  let month = 0
  let day = 0
  let hour = 0
  for (const p of parts) {
    if (p.type === 'year') year = Number(p.value)
    else if (p.type === 'month') month = Number(p.value) - 1
    else if (p.type === 'day') day = Number(p.value)
    else if (p.type === 'hour') hour = Number(p.value)
  }
  return { year, month, day, hour }
}

async function loadForSelectedDay() {
  if (!props.city) return
  const simple = await store.getSimpleForecastForCity(props.city)
  if (!simple || !simple.hourly) return

  // determine today's YMD in city's timezone
  const nowParts = getYMDH(new Date(), props.city.timezone)

  // collect all hourly points that match the selected day
  const candidates = simple.hourly.filter((p) => {
    const d = p.timeParsed ?? new Date(p.time)
    const pParts = getYMDH(d, props.city.timezone)
    const dateA = Date.UTC(nowParts.year, nowParts.month, nowParts.day)
    const dateB = Date.UTC(pParts.year, pParts.month, pParts.day)
    const dayOffset = Math.round((dateB - dateA) / (24 * 60 * 60 * 1000))
    return dayOffset === ui.selectedDayIndex
  })

  if (candidates.length === 0) return

  // If the user selected today, prefer the hour that matches "now" in the city's timezone
  // otherwise fall back to the hour closest to midday for other days
  let chosen = candidates[0]!

  if (ui.selectedDayIndex === 0) {
    // try to find an exact hour match to the city's local current hour
    let exact: (typeof candidates)[0] | null = null
    for (const c of candidates) {
      const d = c.timeParsed ?? new Date(c.time)
      const pParts = getYMDH(d, props.city.timezone)
      if (
        pParts.year === nowParts.year &&
        pParts.month === nowParts.month &&
        pParts.day === nowParts.day &&
        pParts.hour === nowParts.hour
      ) {
        exact = c
        break
      }
    }

    if (exact) {
      chosen = exact
    } else {
      // no exact match: pick candidate with minimal hour distance (in city-local hours)
      let best = candidates[0]!
      let bestDiffHours = Number.POSITIVE_INFINITY
      for (const c of candidates) {
        const d = c.timeParsed ?? new Date(c.time)
        const pParts = getYMDH(d, props.city.timezone)
        const candidateUtcHourStamp = Date.UTC(pParts.year, pParts.month, pParts.day, pParts.hour)
        const nowUtcHourStamp = Date.UTC(nowParts.year, nowParts.month, nowParts.day, nowParts.hour)
        const diffHours = Math.abs(candidateUtcHourStamp - nowUtcHourStamp) / (1000 * 60 * 60)
        if (diffHours < bestDiffHours) {
          bestDiffHours = diffHours
          best = c
        }
      }
      chosen = best
    }
  } else {
    // selected not today: choose hour closest to midday (12:00) as before
    const first = candidates[0]!
    let best = first
    let bestDiff = Math.abs(((first.timeParsed ?? new Date(first.time)).getHours() ?? 0) - 12)
    for (const c of candidates) {
      const h = (c.timeParsed ?? new Date(c.time)).getHours() ?? 0
      const d = Math.abs(h - 12)
      if (d < bestDiff) {
        best = c
        bestDiff = d
      }
    }
    chosen = best
  }

  tempereture.value = (chosen.values.temperature_2m as number) ?? tempereture.value
  humidity.value = (chosen.values.relativehumidity_2m as number) ?? humidity.value
  windspeed.value = (chosen.values.windspeed_10m as number) ?? windspeed.value
  weatherCode.value = (chosen.values.weathercode as number) ?? weatherCode.value
}

await nextTick()
await loadForSelectedDay()

watch(
  () => ui.selectedDayIndex,
  () => {
    loadForSelectedDay()
  },
)

/**
 * یک Wrapper کوچک برای استفاده از util عمومی در تمپلیت
 * دلیل: تابع عمومی `isoTime` رشته‌ای می‌گیرد، اما اینجا شما `Date` دارید.
 * پس یک تابع کوچک محلی برای تبدیل فرمت لازم است.
 */
function getIconUrl(code: number, date: Date): string {
  // تبدیل آبجکت Date به رشته ISO ساده برای سازگاری با تابع Utility
  // توجه: اینجا ساعت محلی سیستم کاربر پاس داده می‌شود که برای آیکون شب/روز کافی است
  // یا اگر بخواهید دقیق باشید، باید ISO اصلی time-point را پاس بدهید.
  // اما چون اینجا `new Date()` (زمان حال) را می‌فرستید:
  const isoString = date.toISOString().split('.')[0]! // فرمت ساده "YYYY-MM-DDTHH:mm:ss"
  return getWeatherIconUrl(code, isoString)
}
</script>

<template>
  <Transition name="now-fade" mode="out-in">
    <div
      :key="`${props.city?.name ?? 'city'}-${useUiStore().selectedDayIndex}`"
      class="flex items-center flex-row-reverse justify-between gap-2"
    >
      <span class="flex items-center justify-center flex-col flex-none relative -top-2 left-2">
        <img
          class="object-center object-contain rounded-xl brightness-100 relative bottom-1"
          :src="getIconUrl(weatherCode, new Date())"
          :alt="mapWeatherCodeToFarsi(weatherCode).title"
        />
        <p class="text-sm text-sky-700">{{ mapWeatherCodeToFarsi(weatherCode).title }}</p>
      </span>

      <div class="flex flex-col items-start justify-start h-full py-1">
        <span class="flex items-end justify-start px-2 py-1.5 gap-1">
          <p class="text-sky-700 font-semibold mb-1">C°</p>
          <p class="font-black text-5xl text-slate-800">
            {{ tempereture.toFixed(1) }}
          </p>
        </span>

        <div class="flex items-center justify-center gap-3 text-gray-500">
          <span class="now-status-badges">
            <p class="text-sm font-medium">%</p>
            <p class="font-semibold text-center">{{ humidity }}</p>
            <HumidityIcon class="w-5 h-5 fill-current text-slate-700 flex-none mx-1.5" />
          </span>
          <span class="now-status-badges">
            <p class="text-sm font-medium mx-0.5">KM/H</p>
            <p class="font-semibold text-lg text-center">{{ windspeed }}</p>
            <WindIcon class="size-5 relative bottom-0.5 left-0.5 fill-current flex-none mx-1.5" />
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="css" scoped>
.now-status-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.now-fade-enter-active,
.now-fade-leave-active {
  transition:
    opacity 240ms cubic-bezier(0.2, 0.9, 0.2, 1),
    transform 240ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.now-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.now-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.now-fade-leave-from {
  opacity: 1;
}
.now-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
