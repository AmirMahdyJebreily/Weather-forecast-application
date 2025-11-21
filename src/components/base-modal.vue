<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'confirm'): void }>()

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop font-semibold" role="dialog" aria-modal="true">
      <div class="modal-panel">
        <slot />
        <div class="modal-actions">
          <button class="btn btn-cancel" @click="close">نه، منصرف شدم</button>
          <button class="btn btn-confirm" @click="confirm">بله، حذف کن</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="css">
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45); /* slate-900/45 */
  z-index: 60;
  padding: 1rem;
}
.modal-panel {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(2, 6, 23, 0.2);
  color: #0f172a; /* slate-900 */
}
.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
.btn {
  padding: 0.5rem 0.75rem;
  border-radius: 100rem;
  border: none;
  cursor: pointer;
}
.btn-cancel {
  background: #f1f5f9; /* slate-100 */
  color: #0f172a;
}
.btn-confirm {
  background: #ef4444; /* rose-500 */
  color: white;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.modal-fade-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}
</style>
