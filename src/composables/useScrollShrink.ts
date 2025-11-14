// composables/useScrollShrink.ts
import { ref, onMounted, onUnmounted, watch, type ShallowRef } from 'vue'

export function useScrollShrink<T extends HTMLElement>(
  targetRef: ShallowRef<T | null>,
  maxHeight: number,
  minHeight: number,
  maxScroll = 500
) {
  const height = ref(maxHeight)

  const onScroll = () => {
    if (!targetRef.value) return
    debugger
    const scrollY = targetRef.value.scrollTop
    const ratio = Math.min(scrollY / maxScroll, 1)
    height.value = maxHeight - (maxHeight - minHeight) * ratio
  }

  onMounted(() => {
    watch(
      targetRef,
      (el, _, onCleanup) => {
        if (!el) return
        el.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        onCleanup(() => el.removeEventListener('scroll', onScroll))
      },
      { immediate: true }
    )
  })

  onUnmounted(() => {
    if (targetRef.value) {
      targetRef.value.removeEventListener('scroll', onScroll)
    }
  })

  return { height }
}
