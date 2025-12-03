<script async setup lang="ts">
import { ref, computed } from 'vue'
import type { City } from '@/stores/models/simple-city-models'
import { useWeatherStore } from '@/stores/weather'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import { getAqiStatus, getUvDescription } from './utils/weather-display-utils'

const props = defineProps<{
  city: City
}>()

const store = useWeatherStore()
const expanded = ref(false)

// دریافت داده ساده شده از استور (که الان شامل airQuality هم هست)
const simpleForecast = await store.getSimpleForecastForCity(props.city)
const airData = simpleForecast?.airQuality
const rawCurrent = airData?.rawCurrent

// مقادیر نمایشی
const aqi = Math.round(airData?.aqi ?? 0)
const status = computed(() => getAqiStatus(aqi))

const pm25 = rawCurrent?.pm2_5 ?? 0
//const pm10 = rawCurrent?.pm10 ?? 0
const uv = rawCurrent?.uv_index ?? 0
const dust = rawCurrent?.dust ?? 0
const ozone = rawCurrent?.ozone ?? 0
</script>

<template>
  <div
    v-if="airData"
    class="rounded-2xl p-4 transition-all duration-300 shadow-sm border border-transparent"
    :class="[status.bgLight]"
  >
    <!-- Header: شاخص اصلی -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="size-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
          :class="status.color"
        >
          {{ aqi }}
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-gray-500 font-medium">شاخص کیفیت هوا</span>
          <span class="text-lg font-bold" :class="status.text">{{ status.label }}</span>
        </div>
      </div>

      <button
        @click="expanded = !expanded"
        class="p-2 rounded-full hover:bg-white/50 transition-colors text-gray-600"
      >
        <component :is="expanded ? ChevronUpIcon : ChevronDownIcon" class="size-5" />
      </button>
    </div>

    <!-- Expandable Details -->
    <div
      class="grid grid-cols-2 gap-3 mt-0 overflow-hidden transition-all duration-500 ease-in-out"
      :class="expanded ? 'max-h-64 mt-4 opacity-100' : 'max-h-0 opacity-0'"
    >
      <!-- آیتم‌های جزئیات -->
      <div class="bg-white/60 rounded-xl p-3 flex flex-col items-center justify-center text-center">
        <span class="text-xs text-gray-500 mb-1">ذرات PM2.5</span>
        <span class="font-semibold text-slate-800"
          >{{ pm25 }} <span class="text-[10px] font-light">µg/m³</span></span
        >
      </div>

      <div class="bg-white/60 rounded-xl p-3 flex flex-col items-center justify-center text-center">
        <span class="text-xs text-gray-500 mb-1">اشعه UV</span>
        <span class="font-semibold text-slate-800"
          >{{ uv.toFixed(1) }}
          <span class="text-xs font-normal text-gray-400">({{ getUvDescription(uv) }})</span></span
        >
      </div>

      <div class="bg-white/60 rounded-xl p-3 flex flex-col items-center justify-center text-center">
        <span class="text-xs text-gray-500 mb-1">گرد و غبار</span>
        <span class="font-semibold text-slate-800"
          >{{ dust }} <span class="text-[10px] font-light">µg/m³</span></span
        >
      </div>

      <div class="bg-white/60 rounded-xl p-3 flex flex-col items-center justify-center text-center">
        <span class="text-xs text-gray-500 mb-1">ازن (O3)</span>
        <span class="font-semibold text-slate-800"
          >{{ ozone }} <span class="text-[10px] font-light">µg/m³</span></span
        >
      </div>
    </div>
  </div>
</template>
