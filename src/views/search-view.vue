<script setup lang="ts">
import { useWeatherStore } from '@/stores/weather'
import { GlobeAsiaAustraliaIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { computed, nextTick, ref, toRaw } from 'vue'
import BaseCityCard from '@/components/base-city-card/base-city-card.vue'
import { useRouter } from 'vue-router'
import { type City, SettlementLevel } from '@/stores/models/simple-city-models'

const loading = ref<boolean>(false)

const store = useWeatherStore()

const searchCity = ref<string>('')

const searchLevel = ref<SettlementLevel | undefined>(undefined)

const cityToFavorites = ref<Array<City>>([])

const router = useRouter()

function includesFavorite(city: City) {
  return cityToFavorites.value.findIndex((c) => c.id === city.id)
}

function toggleFavorite(city: City) {
  const idx = includesFavorite(city)
  if (idx === -1) {
    cityToFavorites.value.push(city)
  } else {
    cityToFavorites.value.splice(idx, 1)
  }
}

function handelLevelClick(value: string) {
  searchLevel.value = value === 'همه' ? undefined : (value as SettlementLevel)
  Search()
}

async function confirm() {
  if (cityToFavorites.value.length > 0) {
    for (const city of cityToFavorites.value) {
      await store.toggleFavorite(toRaw<City>(city))
    }
  }

  store.searchResults = []
  router.push({ path: '/' })
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function Search() {
  loading.value = true
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(async () => {
    await store.searchCities(searchCity.value, 20, 'fa', searchLevel.value)
    await nextTick()
    loading.value = false
  }, 700)
}

let timeout = -1

const reorderedCities = computed(() => {
  const favIds = new Set(cityToFavorites.value.map((c) => c.id))
  const searchMap = new Map(store.searchResults.map((c) => [c.id, c]))

  const favsMapped = cityToFavorites.value
    .map((f) => searchMap.get(f.id) ?? f)
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)

  const rest = store.searchResults.filter((c) => !favIds.has(c.id))

  return [...favsMapped, ...rest]
})

async function startEventLeastener() {
  const el = document.querySelector('.scroller')
  if (el) {
    el!.addEventListener('scroll', () => {
      el!.classList.add('scrollbar-visible')
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        el!.classList.remove('scrollbar-visible')
      }, 800)
    })
  }
  await nextTick()
}
</script>

<template>
  <div class="flex items-center justify-start flex-col h-full w-full overflow-hidden px-2">
    <div
      class="flex w-full focus-within:text-sky-700 items-center justify-center gap-1 px-4 bg-slate-300/50 rounded-2xl"
    >
      <MagnifyingGlassIcon class="size-6 flex-none transition-[color] duration-200" />
      <input
        type="search"
        class="w-full h-full bg-transparent py-3 px-2 outline-none text-slate-500"
        placeholder="جستجو میان مکان های سراسر جهان..."
        v-model="searchCity"
        @update:model-value="Search"
      />
    </div>

    <div class="flex items-center justify-start w-full overflow-auto mb-4 mt-2 p-1 gap-2">
      <span
        v-for="(value, idx) in ['همه', ...Object.values(SettlementLevel)]"
        :key="idx"
        @click="handelLevelClick(value)"
        class="bg-slate-300/80 text-slate-700 cursor-pointer px-3 py-1 rounded-full flex-none"
        :class="{
          'bg-slate-800 !text-slate-300 transition-colors duration-150':
            (!searchLevel && idx === 0) || (searchLevel && searchLevel === value),
        }"
        >{{ value }}</span
      >
    </div>

    <TransitionGroup
      name="list"
      tag="div"
      @vue:mounted="startEventLeastener"
      class="w-full scroller flex flex-col items-center justify-start gap-3 flex-1 h-full overflow-auto scrollbar-mobile rounded-3xl"
    >
      <BaseCityCard
        :info-hidable="false"
        :city="value"
        v-for="(value, index) in reorderedCities"
        :key="'srchres' + value.id"
        @click="toggleFavorite(value)"
        :class="`flex items-center cursor-pointer justify-between w-full transition-all shadow-none duration-150 ${includesFavorite(value) > -1 ? '!border-sky-400 !border-r !bg-slate-300 !text-sky-950' : ''}`"
        :style="{ transitionDelay: `${index * 25}ms` }"
      />
      <template v-if="loading">
        <span
          v-for="index in 3"
          :key="'skeleton' + index"
          class="bg-slate-300/60 animate-pulse rounded-xl h-8 w-full"
          :style="{ transitionDelay: `${index * 25}ms` }"
        />
      </template>

      <div
        class="flex flex-col items-center justify-center gap-1 h-4/5 text-slate-500/80"
        v-if="reorderedCities.length < 1 && !loading"
      >
        <GlobeAsiaAustraliaIcon class="size-20" />
        <span class="text-3xl font-bold">جستجو مکان های جهان</span>
        <span class="text-xl font-light text-center w-96"
          >با زبان های مختلف میتوانید مکان های مختلف تمام جهان را انتخاب کنید.
        </span>
      </div>
    </TransitionGroup>
  </div>
  <Transition
    enter-from="opacity-0 translate-y-24"
    enter-active="transition-transform transition-opacity duration-300 ease-out"
    enter-to="opacity-100 translate-y-0"
    leave-from="opacity-100 translate-y-0"
    leave-active="transition-transform transition-opacity duration-250 ease-in"
    leave-to="opacity-0 translate-y-24"
  >
    <div
      v-if="cityToFavorites.length > 0"
      class="flex items-stretch justify-center w-full gap-3 pt-1"
    >
      <button
        @click="() => router.push({ path: '/' })"
        class="py-2 px-4 w-full border-slate-700 border-[3px] rounded-2xl text-slate-700 font-semibold text-lg"
      >
        لغو
      </button>
      <button
        @click="confirm"
        class="py-2 px-4 w-full bg-slate-700 rounded-2xl text-slate-50 font-semibold text-lg"
      >
        انتخاب
      </button>
    </div>
  </Transition>
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
