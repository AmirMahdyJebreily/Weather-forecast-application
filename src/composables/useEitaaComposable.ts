// composables/useEitaaBackButton.ts
import { watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getEitaaWebApp } from '@/eitaa-sdk'

interface UseEitaaBackButtonOptions {
  homeRoute?: string // مثلاً '/' یا '/home'
  alwaysShow?: boolean // برای صفحاتی که همیشه باید back داشته باشن
}

export function useEitaaBackButton(options: UseEitaaBackButtonOptions = {}) {
  const router = useRouter()
  const webapp = getEitaaWebApp()

  if (!webapp) return

  const { homeRoute = '/', alwaysShow = false } = options
  const backButton = webapp.BackButton

  const canGoBack = () => {
    const currentPath = router.currentRoute.value.path

    // اگر روی صفحه اول هستیم
    if (currentPath === homeRoute && !alwaysShow) {
      return false
    }

    const res = window.history.state.position > 0
    console.log(window.history.state.position, res);

    return res
  }

  const updateBackButtonVisibility = () => {
    if (canGoBack()) {
      backButton.show()
      console.log("backbutton is showing");

    } else {
      backButton.hide()
      console.log("backbutton is hiding");

    }
  }

  const handleBackClick = () => {
    if (canGoBack()) {
      router.back()
    }
  }

  onMounted(() => {
    updateBackButtonVisibility()
    backButton.onClick(handleBackClick)

    // watch route changes
    const unwatch = watch(
      () => router.currentRoute.value,
      () => {
        // کمی تاخیر برای اطمینان از اینکه navigation کامل شده
        setTimeout(updateBackButtonVisibility, 50)
      },
      { immediate: false }
    )

    onUnmounted(() => {
      backButton.offClick(handleBackClick)
      backButton.hide()
      unwatch()
    })
  })

  return { backButton }
}
