<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'
import { MapPinIcon } from '@heroicons/vue/24/outline'
import { PlusIcon } from '@heroicons/vue/24/solid'

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
      class="flex flex-col items-center justify-center gap-1 h-4/5 text-slate-500/80"
      v-if="store.searchResults.length < 1 && !loading"
    >
      <MapPinIcon class="size-20" />
      <span class="text-3xl font-bold">مکانی نیست!</span>
      <span class="text-xl font-light">مکانی انتخاب کنید...</span>
    </div>

    <div class="flex flex-col items-center justify-center gap-1 w-full" v-if="loading">
      <span class="bg-slate-300/60 animate-pulse rounded-3xl h-[174px] w-full"></span>
    </div>

    <RouterLink
      :to="{ name: 'srchloc' }"
      :class="`fixed flex items-center !transition-[left] duration-1000 justify-center size-14 bg-gradient-to-t from-slate-400/50 shadow-lg shadow-slate-4/7000 backdrop-blur-md to-slate-300/50 rounded-full bottom-12 ${!(store.searchResults.length < 1 && !loading) ? 'left-6' : 'before:absolute before:rounded-full before:animate-ping animate-bounce z-50 before:bg-gray-100/50 before:z-40 before:size-full'} text-slate-600`"
    >
      <PlusIcon class="size-7" />
    </RouterLink>
  </div>
</template>
