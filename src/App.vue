<script setup lang="ts">
import BackButton from './components/back-button.vue'
</script>

<template>
  <main dir="rtl" class="app-container">
    <section class="app-bar">
      <BackButton />
      <h1 class="text-slate-400 font-medium">...</h1>
    </section>
    <RouterView />
    <!-- <footer class="text-slate-500 text-sm flex items-end justify-center">
      &copy; صنایع خلاق نسیم مهر 1404
    </footer> -->
  </main>
</template>

<style lang="css" scoped>
.app-bar {
  @apply w-full pb-4 pt-2 flex items-center justify-between flex-none;
}
.app-container {
  @apply w-full h-dvh px-4 py-2 overflow-hidden flex flex-col items-center justify-start bg-gradient-to-t from-slate-200 via-slate-100 to-slate-200 font-vazir gap-1;
}
</style>
