<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const showHint = ref(false)
let timeoutId: ReturnType<typeof setTimeout> | null = null

function handleSingleTap() {
  // اگر هینت قبلاً فعال است، تایمر را ریست کن
  if (showHint.value && timeoutId) {
    clearTimeout(timeoutId)
  }

  showHint.value = true

  // لرزش کوچک برای جلب توجه (Vibration API - فقط روی موبایل کار می‌کند)
  if (navigator.vibrate) navigator.vibrate(50)

  // پنهان کردن بعد از ۲ ثانیه
  timeoutId = setTimeout(() => {
    showHint.value = false
  }, 2000)
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center py-1 cursor-pointer select-none touch-manipulation"
    @click.stop="handleSingleTap"
  >
    <!-- پیام راهنما -->
    <Transition name="fade-slide">
      <span
        v-if="showHint"
        class="text-[10px] text-slate-500 mb-1 font-medium bg-white/80 px-2 py-0.5 rounded-full shadow-sm"
      >
        برای جزئیات دو بار بزنید
      </span>
    </Transition>

    <!-- دکمه/آیکون -->
    <div
      class="px-4 py-0.5 rounded-lg bg-gray-600/10 transition-transform active:scale-95"
      :class="{ 'animate-bounce-short': showHint }"
    >
      <ChevronDownIcon class="size-5 text-slate-600" />
    </div>
  </div>
</template>

<style scoped>
/* انیمیشن ورود/خروج نرم پیام */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

/* انیمیشن پریدن کوتاه آیکون وقتی کاربر کلیک می‌کند */
@keyframes bounce-short {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(3px);
  }
}

.animate-bounce-short {
  animation: bounce-short 0.3s ease-in-out;
}
</style>
