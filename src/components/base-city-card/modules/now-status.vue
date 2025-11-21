<script async setup lang="ts">
import { useWeatherStore, type City } from '@/stores/weather'
import { nextTick, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import HumidityIcon from '../../../../public/icons/humidity-svgrepo-com.svg'
import WindIcon from '../../../../public/icons/wind-svgrepo-com.svg'

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

  // pick the hour closest to midday (12:00) as a representative
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

  tempereture.value = (best.values.temperature_2m as number) ?? tempereture.value
  humidity.value = (best.values.relativehumidity_2m as number) ?? humidity.value
  windspeed.value = (best.values.windspeed_10m as number) ?? windspeed.value
  weatherCode.value = (best.values.weathercode as number) ?? weatherCode.value
}

await nextTick()
await loadForSelectedDay()

watch(
  () => ui.selectedDayIndex,
  () => {
    loadForSelectedDay()
  },
)

type WeatherFarsi = {
  title: string
  description: string
  icon_day?: number // شماره آیکون AccuWeather برای روز
  icon_night?: number // شماره آیکون AccuWeather برای شب
}

function mapWeatherCodeToFarsi(code: number): WeatherFarsi {
  const weatherMap: Record<number, WeatherFarsi> = {
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

function getWeatherIconUrl(code: number, date: Date): string {
  const { icon_day, icon_night } = mapWeatherCodeToFarsi(code)
  const hour = date.getHours()
  const isNight = hour < 6 || hour >= 18
  const icon = isNight ? (icon_night ?? icon_day) : (icon_day ?? icon_night)
  return `https://www.accuweather.com/assets/images/weather-icons/v2a/${icon}.svg`
}
</script>

<template>
  <Transition name="now-fade" mode="out-in">
    <div
      :key="`${props.city?.name ?? 'city'}-${useUiStore().selectedDayIndex}`"
      class="flex items-center flex-row-reverse justify-between gap-2"
    >
      <!-- <SunIcon class="size-10 flex-none text-sky-700" /> -->
      <span class="flex items-center justify-center flex-col flex-none relative -top-2 left-2">
        <img
          class="object-center object-contain rounded-xl brightness-100 relative bottom-1"
          :src="getWeatherIconUrl(weatherCode, new Date())"
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
</style>

<style lang="css" scoped>
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
