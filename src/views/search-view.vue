<script setup lang="ts">
import { useWeatherStore } from '@/stores/weather'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { MapPinIcon } from '@heroicons/vue/24/solid'
import { nextTick, ref } from 'vue'

const loading = ref<boolean>(false)

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
</script>

<template>
  <div class="w-full flex items-center justify-center gap-1 mb-4 border-b-2 border-b-slate-300">
    <MagnifyingGlassIcon class="size-6 flex-none" />
    <input
      type="search"
      class="w-full h-full bg-transparent py-3 px-2 outline-none"
      placeholder="جستجو میان مکان های سراسر جهان..."
      v-model="searchCity"
      @update:model-value="Search"
    />
  </div>
  <TransitionGroup
    name="list"
    ref="scroller"
    tag="div"
    class="w-full flex flex-col items-center justify-start gap-3 flex-1 h-full overflow-auto p-2 pl-3s scrollbar-mobile rounded-3xl"
  >
    <div
      v-for="(value, index) in store.searchResults"
      :key="value.id"
      class="flex items-center justify-between w-full"
      :style="{ transitionDelay: `${index * 25}ms` }"
    >
      <span class="flex items-start justify-center text-sky-800 gap-2">
        <span
          class="size-8 text-sky-700 flex items-center justify-center bg-slate-300 rounded-full"
        >
          <MapPinIcon class="size-5 inline-block m-auto" />
        </span>
        <p class="pt-0.5 text-lg">
          <span class="font-light text-base">{{ value.country }}, {{ value.admin1 }}</span
          >,
          <span class="font-semibold">{{ value.name }}</span>
        </p>
      </span>
    </div>
  </TransitionGroup>

  <div class="flex flex-col items-center justify-center gap-1 w-full" v-if="store.loadingSearch">
    <span class="bg-slate-300/60 animate-pulse rounded-xl h-8 w-full"></span>
    <span class="bg-slate-300/60 animate-pulse rounded-xl h-8 w-full"></span>
    <span class="bg-slate-300/60 animate-pulse rounded-xl h-8 w-full"></span>
  </div>
</template>

<style>
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
</style>
