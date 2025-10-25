<script async setup lang="ts">
import { useWeatherStore, type City } from '@/stores/weather'
import { nextTick, ref } from 'vue'

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
  console.log(current?.index)
}

await nextTick()

function mapMeteoToOwmBase(code: number): string {
  const map: Record<number, string> = {
    0: '01',
    1: '01',
    2: '02',
    3: '03',
    45: '50',
    48: '50',
    51: '09',
    53: '09',
    55: '09',
    56: '09',
    57: '09',
    61: '10',
    63: '10',
    65: '10',
    66: '10',
    67: '10',
    71: '13',
    73: '13',
    75: '13',
    77: '13',
    85: '13',
    86: '13',
    80: '09',
    81: '09',
    82: '09',
    95: '11',
    96: '11',
    99: '11',
  }
  return map[code] ?? '03'
}

type WeatherFarsi = {
  title: string
  description: string
}

function mapWeatherCodeToFarsi(code: number): WeatherFarsi {
  const weatherMap: Record<number, WeatherFarsi> = {
    0: { title: 'آفتابی', description: 'صاف و بدون ابر' },
    1: { title: 'آفتابی', description: 'ابرهای پراکنده' },
    2: { title: 'ابری', description: 'آسمان کاملاً ابری' },
    3: { title: 'ابری', description: 'ابری با احتمال غبار' },
    45: { title: 'مه', description: 'مه روی زمین' },
    48: { title: 'مه', description: 'مه همراه با رسوب' },
    51: { title: 'باران', description: 'نم نم سبک' },
    53: { title: 'باران', description: 'نم نم متوسط' },
    55: { title: 'باران', description: 'نم نم شدید' },
    56: { title: 'باران یخی', description: 'یخی سبک' },
    57: { title: 'باران یخی', description: 'یخی شدید' },
    61: { title: 'باران', description: 'خفیف' },
    63: { title: 'باران', description: 'متوسط' },
    65: { title: 'باران', description: 'شدید' },
    66: { title: 'باران یخی', description: 'خفیف' },
    67: { title: 'باران یخی', description: 'شدید' },
    71: { title: 'برف', description: 'خفیف' },
    73: { title: 'برف', description: 'متوسط' },
    75: { title: 'برف', description: 'شدید' },
    77: { title: 'برف', description: 'دانه‌های برف' },
    80: { title: 'رگبار باران', description: 'خفیف' },
    81: { title: 'رگبار باران', description: 'متوسط' },
    82: { title: 'رگبار باران', description: 'شدید' },
    85: { title: 'رگبار برف', description: 'خفیف' },
    86: { title: 'رگبار برف', description: 'شدید' },
    95: { title: 'رعد و برق', description: 'بارش همراه با رعد و برق' },
    96: { title: 'رعد و برق', description: 'با تگرگ خفیف' },
    99: { title: 'رعد و برق', description: 'با تگرگ شدید' },
  }

  return weatherMap[code] || { title: 'نامشخص', description: '' }
}
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <!-- <SunIcon class="size-10 flex-none text-sky-700" /> -->
    <span
      class="flex items-center justify-center flex-col flex-none bg-gradient-to-t from-slate-400/20 pb-2 gap-1 border-b border-slate-100 shadow-inner rounded-xl max-w-20 h-32"
    >
      <img
        class="object-center object-contain rounded-xl"
        :src="`https://openweathermap.org/img/wn/${mapMeteoToOwmBase(weatherCode)}d@2x.png`"
      />
      <p class="text-sm text-sky-700">{{ mapWeatherCodeToFarsi(weatherCode).title }}</p>
    </span>
    <div class="flex flex-col items-start justify-start gap-2 w-full">
      <span class="flex items-end justify-start gap-1">
        <p class="font-medium flex-none text-slate-500/80">🌫</p>
        <p class="text-sky-700/75 text-xs font-semibold mb-1">KM/H</p>
        <p class="font-black text-xl text-slate-500/80">{{ windspeed }}</p>
      </span>

      <span class="flex items-end justify-start gap-1">
        <p class="font-medium flex-none text-slate-500/80">💧</p>
        <p class="text-sky-700/75 text-xs font-semibold mb-0.5">%</p>
        <p class="font-black text-xl text-slate-500/80">{{ humidity }}</p>
      </span>
    </div>
    <span class="flex items-end justify-start ms-9 pt-2 gap-1">
      <p class="text-sky-700 font-semibold mb-1">C°</p>
      <p class="font-black text-5xl text-slate-500/90">{{ tempereture }}</p>
    </span>
  </div>
</template>
