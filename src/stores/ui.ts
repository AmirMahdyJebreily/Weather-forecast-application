import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
    const selectedDayIndex = ref<number>(0)

    const dayList = computed(() => {
        const out: { index: number; date: Date; label: string; short?: string }[] = []
        const now = new Date()
        for (let i = 0; i < 7; i++) {
            const d = new Date(now)
            d.setDate(now.getDate() + i)
            const label = i === 0 ? 'امروز' : d.toLocaleDateString('fa-IR', { weekday: 'short' })
            const short = d.toLocaleDateString('fa-IR', { month: 'short', day: '2-digit' })
            out.push({ index: i, date: d, label, short })
        }
        return out
    })

    const selectedDate = computed(() => {
        return dayList.value[selectedDayIndex.value]?.date ?? new Date()
    })

    function setSelectedDay(i: number) {
        selectedDayIndex.value = Math.max(0, Math.min(6, Math.floor(i)))
    }

    function nextDay() {
        if (selectedDayIndex.value < 6) selectedDayIndex.value++
    }

    function prevDay() {
        if (selectedDayIndex.value > 0) selectedDayIndex.value--
    }

    return {
        selectedDayIndex,
        dayList,
        selectedDate,
        setSelectedDay,
        nextDay,
        prevDay,
    }
})
