<script setup lang="ts">
import { MapPinIcon } from '@heroicons/vue/24/solid'
import { SunIcon } from '@heroicons/vue/24/outline'
import { onMounted, useTemplateRef } from 'vue'

const el = useTemplateRef('scroller')

let timeout = -1

onMounted(() => {
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
    ref="scroller"
    class="w-full flex flex-col items-center justify-start gap-2 flex-1 h-full overflow-auto p-2 scrollbar-mobile rounded-3xl"
  >
    <div
      v-for="value in ['تهرون', 'مِشَد', 'کاشمر', 'شیراز', 'Tabriz', 'Karaj']"
      :key="value"
      class="city-card"
    >
      <div class="flex items-center justify-between w-full">
        <span class="flex items-start justify-center text-sky-800 gap-2">
          <span
            class="size-8 text-sky-700 flex items-center justify-center bg-slate-300 rounded-full"
          >
            <MapPinIcon class="size-5 inline-block m-auto" />
          </span>
          <p class="pt-0.5 text-lg">{{ value }}</p>
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="flex items-end justify-start ms-9 pt-2 gap-1">
          <p class="text-sky-700 font-thin mb-1">C°</p>
          <p class="font-black text-6xl text-slate-500/90">36</p>
        </span>
        <SunIcon class="size-10 flex-none text-sky-700" />
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.city-card {
  @apply flex flex-col items-stretch justify-stretch w-full bg-gradient-to-l from-slate-300/60 via-slate-300/10 to-slate-300/30 rounded-3xl shadow-inner border-b-2 border-slate-100/70 shadow-slate-400/30 gap-2 pt-4 px-6 pb-8 text-gray-600;
}
</style>
