<script lang="ts" setup>
import { MapPinIcon } from '@heroicons/vue/24/solid'
import { classifySettlement, type City } from '@/stores/weather'
import { defineAsyncComponent, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    city: City
    module?: string
    infoHidable?: boolean
  }>(),
  {
    infoHidable: true,
  },
)

const modules: Array<object> = []

const showCityInfo = ref<boolean>(!props.infoHidable)

function toggleShowCityInfo() {
  if (!props.infoHidable) {
    return
  }
  showCityInfo.value = !showCityInfo.value
}

if (props.module && props.module.length) {
  modules.push(defineAsyncComponent(() => import(`./modules/${props.module!}.vue`)))
}
</script>

<template>
  <div class="city-card">
    <div class="flex items-center justify-between w-full">
      <span class="flex items-start justify-center gap-2 w-full" @click="toggleShowCityInfo">
        <span
          class="size-8 text-sky-700 flex-none flex items-center justify-center bg-slate-400/35 rounded-full"
        >
          <MapPinIcon class="size-5 inline-block m-auto" />
        </span>
        <p class="pt-0.5 text-xl line-clamp-1 flex items-center justify-start w-full gap-1">
          <span class="flex-none"> {{ props.city.name }}، </span>
          <span
            :class="`text-gray-500 font-light text-lg flex-none text-ellipsis text-nowrap overflow-hidden transition-[width] ease-out duration-700 ${showCityInfo ? 'w-full' : 'w-7'}`"
          >
            {{
              showCityInfo
                ? `${classifySettlement(props.city.population!)} در ${props.city.admin1}, ${props.city.country}`
                : '...'
            }}
          </span>
        </p>
      </span>
      <span class="flex items-end justify-center gap-2 flex-none">
        <slot name="actions" />
      </span>
    </div>

    <!--Modules-->

    <template v-for="(module, idx) in modules" :key="idx">
      <Suspense suspensible>
        <component :is="module" :key="idx" :city="props.city" />
        <template #fallback>
          <span class="w-full bg-slate-300/80 animate-pulse h-[100px] rounded-3xl" />
        </template>
      </Suspense>
    </template>
  </div>
</template>

<style lang="css" scoped>
.city-card {
  @apply flex flex-col items-stretch justify-stretch text-sky-800 w-full bg-gradient-to-tl from-slate-50/50 to-slate-200/50 rounded-3xl border border-slate-200 shadow gap-2 py-4 px-6;
}
</style>
