<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'
import { MapPinIcon } from '@heroicons/vue/24/outline'
import { PlusIcon } from '@heroicons/vue/24/solid'
import { useScrollShrink } from '@/composables/useScrollShrink'

const store = useWeatherStore()

const el = useTemplateRef('scroller')

const { height } = useScrollShrink(el, 200, 70, 600)

const headerStyle = computed(() => ({
  height: height.value ? height.value.toFixed(2) + 'px' : '100%',
}))

let timeout = -1
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
  <div
    class="w-full container flex items-center will-change-scroll justify-center py-4"
    :style="headerStyle"
  >
    <h1 class="text-3xl font-extrabold text-slate-700">هوا چطوره ؟</h1>
  </div>
  <div
    ref="scroller"
    class="w-full flex flex-col scroll-py-2 items-center justify-start bg-slate-50/50 gap-3 flex-1 h-full overflow-auto p-3 pl-3s scrollbar-mobile rounded-3xl border-y-8 border-slate-100"
  >
    <BaseCityCard
      v-for="value in store.favorites"
      :key="value.id"
      :city="value"
      module="now-status"
    />
    <div
      class="flex flex-col items-center justify-center gap-1 h-4/5 text-slate-500/80"
      v-if="store.favorites.length < 1 && !store.loadingSearch"
    >
      <MapPinIcon class="size-20" />
      <span class="text-3xl font-bold">مکانی نیست!</span>
      <span class="text-xl font-light">مکانی انتخاب کنید...</span>
    </div>

    <div class="flex flex-col items-center justify-center gap-1 w-full" v-if="store.loadingSearch">
      <span class="bg-slate-300/60 animate-pulse rounded-3xl h-[174px] w-full"></span>
    </div>

    <RouterLink
      :to="{ name: 'srchloc' }"
      :class="`fixed flex items-center !transition-[left] duration-1000 justify-center size-14 bg-gradient-to-t from-slate-400/50 shadow-lg shadow-slate-4/7000 backdrop-blur-md to-slate-300/50 rounded-full bottom-12 ${!(store.favorites.length < 1 && !store.loadingSearch) ? 'left-6' : 'before:absolute before:rounded-full before:animate-ping animate-bounce z-50 before:bg-gray-100/50 before:z-40 before:size-full'} text-slate-600`"
    >
      <PlusIcon class="size-7" />
    </RouterLink>
  </div>
</template>
