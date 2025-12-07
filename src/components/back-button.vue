<script setup lang="ts">
import { ArrowRightIcon } from '@heroicons/vue/24/outline'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canGoBack = ref(false)

async function updateCanGoBack() {
  await nextTick()
  const pos = window.history.state?.position ?? 0
  canGoBack.value = pos > 0
}

let removeAfterEach: (() => void) | null = null

onMounted(() => {
  updateCanGoBack()
  removeAfterEach = router.afterEach(updateCanGoBack)
})

onBeforeUnmount(() => {
  if (removeAfterEach) removeAfterEach()
})

function handleClick() {
  if (canGoBack.value) router.go(-1)
}
</script>

<template>
  <button
    class="size-8 rounded-full transition-[background-color] duration-500 flex items-center justify-center"
    :class="canGoBack ? 'hover:bg-slate-300 cursor-pointer' : 'cursor-not-allowed opacity-50'"
    @click="handleClick"
  >
    <ArrowRightIcon class="size-5" :class="canGoBack ? 'text-slate-800' : 'text-slate-400'" />
  </button>
</template>

<style scoped>
button {
  outline: none;
  border: none;
}
</style>
