<script lang="ts" setup>
import { MapPinIcon } from '@heroicons/vue/24/solid'
import type { City } from '@/stores/weather'
import { defineAsyncComponent } from 'vue'

const props = defineProps<{
  city: City
  module?: string
}>()

const modules: Array<object> = []

if (props.module && props.module.length) {
  modules.push(defineAsyncComponent(() => import(`./modules/${props.module!}.vue`)))
}
</script>

<template>
  <div class="city-card">
    <div class="flex items-center justify-between w-full">
      <span class="flex items-start justify-center gap-2">
        <span
          class="size-8 text-sky-700 flex items-center justify-center bg-slate-400/35 rounded-full"
        >
          <MapPinIcon class="size-5 inline-block m-auto" />
        </span>
        <p class="pt-0.5 text-xl">
          {{ props.city.name }}
          <span class="text-xs"
            >({{ props.city.admin1 }}, {{ props.city.country }}) (<span
              class="text-xs font-mono py-1 text-slate-950/50"
              >{{ props.city.latitude.toFixed(1) }}, {{ props.city.longitude.toFixed(1) }}</span
            >)
          </span>
        </p>
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
  @apply flex flex-col items-stretch justify-stretch text-sky-800 w-full bg-gradient-to-l from-slate-300/60 via-slate-300/10 to-slate-300/30 rounded-3xl shadow-inner border-b-2 border-slate-100/70 shadow-slate-400/30 gap-2 py-4 px-6;
}
</style>
