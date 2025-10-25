<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'

const el = useTemplateRef('scroller')
const loading = ref<boolean>(false)

let timeout = -1

const store = useWeatherStore()

const searchCity = ref<string>('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function Search() {
  loading.value = true
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(async () => {
    await store.searchCities(searchCity.value)
    await nextTick()
    loading.value = false
  }, 400) // ← زمان انتظار (به میلی‌ثانیه)
}

onMounted(async () => {
  if (el.value) {
    el.value.addEventListener('scroll', () => {
      el.value!.classList.add('scrollbar-visible')
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        el.value!.classList.remove('scrollbar-visible')
      }, 800)
    })
  }
})
</script>

<template>
  <input
    v-model="searchCity"
    placeholder="🔎 جستجو میان مکان های سراسر جهان"
    @update:model-value="Search"
    dir="auto"
    class="w-full text-lg px-3 py-2 pt-3 mb-3 rounded-lg outline-none bg-slate-400/30 border-b border-slate-100 shadow-inner text-slate-600"
  />
  <div
    ref="scroller"
    class="w-full flex flex-col items-center justify-start gap-2 flex-1 h-full overflow-auto p-2 pl-3s scrollbar-mobile rounded-3xl"
  >
    <BaseCityCard v-for="value in store.searchResults" :key="value.id" :city="value" />
    <div
      class="flex flex-col items-center justify-center gap-1"
      v-if="store.searchResults.length < 1 && !loading"
    >
      <span class="text-7xl py-3 font-black text-slate-600 hue-rotate-180">😢</span>
      <span class="text-3xl font-black text-slate-600">مکانی نیست!</span>
      <span class="text-xl font-medium text-slate-500">مکانی انتخاب کنید...</span>
    </div>

    <div class="flex flex-col items-center justify-center gap-1 h-3/5" v-if="loading">
      <span class="text-8xl font-black text-slate-600 animate-bounce">🔎</span>
    </div>
  </div>
</template>
