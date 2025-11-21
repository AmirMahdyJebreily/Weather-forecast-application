import { ref, onMounted, onUnmounted, watch, nextTick, type ShallowRef } from 'vue'

export function useScrollShrink<T extends HTMLElement>(
  targetRef: ShallowRef<T | null>,
  maxHeight: number,
  minHeight: number,
  maxScroll = (maxHeight + minHeight) / 4
) {
  const height = ref(maxHeight)

  let lock = false
  let pendingScroll: number | null = null

  let loopCounter = 0
  const LOOP_THRESHOLD = 5
  const CHANGE_RATE = 0.08
  let minHeightObserved = maxHeight

  // Adaptive smoothing
  let lastDelta = (maxHeight - minHeight) * CHANGE_RATE
  const SMOOTH_FACTOR = 0.7

  const applyHeight = (scrollY: number) => {
    const ratio = Math.min(scrollY / maxScroll, 1)
    const targetHeight = maxHeight - (maxHeight - minHeight) * ratio

    if (targetHeight < minHeightObserved) minHeightObserved = targetHeight

    let delta = targetHeight - height.value

    // مشتق هندسی: تغییرات پشت سر هم کمتر و کمتر شود
    delta *= SMOOTH_FACTOR

    if (Math.abs(delta) > lastDelta) {
      lastDelta = Math.abs(delta)
      height.value += delta
    }
  }

  const processScroll = async (scrollY: number) => {
    if (lock) {
      pendingScroll = scrollY
      return
    }

    lock = true

    requestAnimationFrame(async () => {
      loopCounter++
      applyHeight(scrollY)
      await nextTick()

      // شناسایی حلقه
      if (loopCounter >= LOOP_THRESHOLD) {
        height.value = minHeightObserved
        loopCounter = 0
        minHeightObserved = maxHeight
        await nextTick()
      }

      lock = false

      if (pendingScroll !== null) {
        const last = pendingScroll
        pendingScroll = null
        processScroll(last)
      } else {
        loopCounter = 0
        minHeightObserved = maxHeight
        lastDelta = (maxHeight - minHeight) * CHANGE_RATE
      }
    })
  }

  const onScroll = () => {
    const el = targetRef.value
    if (!el) return
    processScroll(el.scrollTop)
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
