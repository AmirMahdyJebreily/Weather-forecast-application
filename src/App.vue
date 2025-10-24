<script setup lang="ts">
import BackButton from './components/back-button.vue'
</script>

<template>
  <main dir="rtl" class="app-container">
    <section class="app-bar">
      <BackButton />
      <h1 class="text-slate-500 font-medium">هوا چطوره ؟</h1>
    </section>
    <RouterView />
    <footer class="text-slate-700 text-sm py-2">&copy; صنایع خلاق نسیم مهر 1404</footer>
  </main>
</template>

<style lang="css" scoped>
.app-bar {
  @apply w-full pb-4 pt-2 flex items-center justify-between;
}
.app-container {
  @apply w-full h-screen px-4 py-2 overflow-x-hidden flex flex-col items-center justify-start bg-slate-200;
}
</style>
