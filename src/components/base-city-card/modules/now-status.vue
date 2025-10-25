<script async setup lang="ts">
import { SunIcon } from '@heroicons/vue/24/outline'
import { useWeatherStore, type City } from '@/stores/weather'
import { nextTick, ref } from 'vue'

const props = defineProps<{
  city: City
}>()

const tempereture = ref<number>(0)
const humidity = ref<number>(0)
const windspeed = ref<number>(0)

const store = useWeatherStore()

await nextTick()

function findTodayTime(times: string[]) {
  return (
    times.findIndex((a) => {
      const hourlyDate = new Date(a)
      const now = new Date()

      return (
        hourlyDate.getFullYear() === now.getFullYear() &&
        hourlyDate.getMonth() === now.getMonth() &&
        hourlyDate.getDate() === now.getDate() &&
        hourlyDate.getHours() === now.getHours()
      )
    }) ?? -1
  )
}

function findTodayTimes(times: string[]) {
  return (
    times.filter((a) => {
      const hourlyDate = new Date(a)
      const now = new Date()

      now.setHours(23)
      now.setMinutes(59)
      now.setSeconds(59)

      return (
        hourlyDate.getFullYear() === now.getFullYear() &&
        hourlyDate.getMonth() === now.getMonth() &&
        hourlyDate.getDate() === now.getDate() &&
        hourlyDate.getHours() <= now.getHours() &&
        hourlyDate.getMinutes() <= now.getMinutes()
      )
    }) ?? -1
  )
}

if (props.city) {
  const weather = await store.getWeatherForCity(props.city)
  const thisTimeIdx = findTodayTime(weather.hourly?.time ?? [])
  tempereture.value = weather.hourly?.temperature_2m![thisTimeIdx] ?? 0
  humidity.value = weather.hourly?.relativehumidity_2m![thisTimeIdx] ?? 0
  windspeed.value = weather.hourly?.windspeed_10m![thisTimeIdx] ?? 0
}

await nextTick()
</script>

<template>
  <div class="flex items-center justify-between">
    <span class="flex items-end justify-start ms-9 pt-2 gap-1">
      <p class="text-sky-700 font-semibold mb-1">C°</p>
      <p class="font-black text-6xl text-slate-500/90">{{ tempereture }}</p>
    </span>
    <SunIcon class="size-10 flex-none text-sky-700" />
  </div>

  <div class="flex items-center justify-start gap-4">
    <span class="flex items-end justify-start ms-9 gap-1">
      <p class="text-sky-700 text-xs font-semibold mb-1">KM/H</p>
      <p class="font-black text-xl text-slate-500/90">{{ windspeed }}</p>
    </span>

    <span class="flex items-end justify-start gap-1">
      <p class="text-sky-700 text-xs font-semibold mb-1">%</p>
      <p class="font-black text-xl text-slate-500/90">{{ humidity }}</p>
    </span>
  </div>
</template>
