<script async setup lang="ts">
import { useWeatherStore, type City } from '@/stores/weather'
import { nextTick, ref } from 'vue'
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

await nextTick()

if (props.city) {
  const current = await store.getCurrentWeatherWithTimezone(props.city)
  tempereture.value = current?.temperature ?? 0
  humidity.value = current?.humidity ?? 0
  windspeed.value = current?.windspeed ?? 0
  weatherCode.value = current?.weatherCode ?? 0
}

await nextTick()

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
  <div class="flex items-center flex-row-reverse justify-between gap-2">
    <!-- <SunIcon class="size-10 flex-none text-sky-700" /> -->
    <span class="flex items-center justify-center flex-col flex-none relative -top-2 left-2">
      <img
        class="object-center object-contain rounded-xl brightness-100 relative bottom-2"
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
</template>

<style lang="css" scoped>
.now-status-badges {
  @apply flex items-center justify-center flex-none;
}
/* replace tailwind @apply with plain CSS to avoid linter issues */
.now-status-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
</style>
