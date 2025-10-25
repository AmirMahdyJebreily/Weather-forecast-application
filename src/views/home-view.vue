<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'

const el = useTemplateRef('scroller')

let timeout = -1

const store = useWeatherStore()
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

  // جستجو
  await store.searchCities('مشهد')

  // گرفتن هوا برای اولین نتیجه
  if (store.searchResults.length) {
    const city = store.searchResults[0]
    if (city) {
      const weather = await store.getWeatherForCity(city)
      console.log(weather)
      console.log(store.searchResults)
    }
  }

  // فیوریت کردن
  //await store.toggleFavorite(store.searchResults[0]!)

  console.log(store.favorites)

  await nextTick()
})
</script>

<template>
  <div
    ref="scroller"
    class="w-full flex flex-col items-center justify-start gap-2 flex-1 h-full overflow-auto p-2 pl-3s scrollbar-mobile rounded-3xl"
  >
    <BaseCityCard v-for="value in store.searchResults" :key="value.id" :city="value" />
  </div>
</template>
