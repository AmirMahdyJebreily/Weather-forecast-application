// composables/useScrollShrink.ts
import { ref, onMounted, onUnmounted, watch, type ShallowRef } from 'vue'

export function useScrollShrink<T extends HTMLElement>(
  targetRef: ShallowRef<T | null>,
  maxHeight: number,
  minHeight: number,
  maxScroll = (maxHeight + minHeight) / 4
) {
  const height = ref(maxHeight)

  const onScroll = () => {
    if (!targetRef.value) return

    const scrollY = targetRef.value.scrollTop

    if (scrollY < Math.ceil(maxScroll / 10)) return
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
