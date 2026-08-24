<template>
  <div
    ref="padRootRef"
    class="signature-pad"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <div class="signature-layout">
      <div v-if="isFullscreen" class="signature-fullscreen-header">
        <div>
          <strong>本人手写签名</strong>
          <span>请横放手机，用手指签写本人姓名</span>
        </div>
        <a-button html-type="button" size="large" @click="exitLandscapeFullscreen">
          退出全屏
        </a-button>
      </div>

      <div class="signature-canvas-shell" :class="{ 'is-signed': isSigned }">
        <canvas
          ref="canvasRef"
          class="signature-canvas"
          aria-label="本人手写签名区域"
          tabindex="0"
          @pointerdown="startStroke"
          @pointermove="continueStroke"
          @pointerup="finishStroke"
          @pointercancel="finishStroke"
        />
        <span v-if="!isSigned" class="signature-placeholder" aria-hidden="true">
          {{ isFullscreen ? '请在横屏区域内签写本人姓名' : '请在这里用手指签写本人姓名' }}
        </span>
      </div>

      <div class="signature-actions" aria-live="polite">
        <span :class="isSigned ? 'signature-status is-complete' : 'signature-status'">
          {{ isSigned ? '签名已完成' : '尚未签名' }}
        </span>
        <div class="signature-action-buttons">
          <a-button
            v-if="!isFullscreen"
            html-type="button"
            size="large"
            type="primary"
            @click="enterLandscapeFullscreen"
          >
            横屏全屏签名
          </a-button>
          <a-button
            html-type="button"
            size="large"
            :disabled="!hasInk"
            @click="clearSignature"
          >
            清除重签
          </a-button>
          <a-button
            v-if="isFullscreen"
            html-type="button"
            size="large"
            type="primary"
            @click="exitLandscapeFullscreen"
          >
            完成签名
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface LockableScreenOrientation {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

interface LegacyFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void
}

interface LegacyFullscreenDocument extends Document {
  webkitExitFullscreen?: () => Promise<void> | void
}

const emit = defineEmits<{
  change: [value: Blob | null]
  'signed-change': [value: boolean]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const padRootRef = ref<HTMLElement | null>(null)
const isSigned = ref(false)
const hasInk = ref(false)
const isFullscreen = ref(false)

let activePointerId: number | null = null
let lastPoint: { x: number; y: number } | null = null
let inkDistance = 0
let resizeObserver: ResizeObserver | null = null
let nativeFullscreenActive = false
let previousBodyOverflow = ''
let bodyOverflowOverridden = false

const getContext = (): CanvasRenderingContext2D | null => {
  const context = canvasRef.value?.getContext('2d') || null
  if (context) {
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 5
    context.strokeStyle = '#17181c'
  }
  return context
}

const fillBackground = (): void => {
  const canvas = canvasRef.value
  const context = getContext()
  if (!canvas || !context) return

  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.restore()
}

const resizeCanvas = (): void => {
  const canvas = canvasRef.value
  if (!canvas) return

  const previousCanvas = document.createElement('canvas')
  if (hasInk.value && canvas.width > 0 && canvas.height > 0) {
    previousCanvas.width = canvas.width
    previousCanvas.height = canvas.height
    previousCanvas.getContext('2d')?.drawImage(canvas, 0, 0)
  }
  const rect = canvas.getBoundingClientRect()
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(rect.width * pixelRatio))
  canvas.height = Math.max(1, Math.round(rect.height * pixelRatio))

  const context = getContext()
  if (!context) return
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  fillBackground()

  if (previousCanvas.width > 0 && previousCanvas.height > 0) {
    context.drawImage(previousCanvas, 0, 0, rect.width, rect.height)
  }
}

const unlockOrientation = (): void => {
  try {
    const orientation = screen.orientation as ScreenOrientation & LockableScreenOrientation
    orientation.unlock?.()
  } catch {
    // Orientation locking is optional; the fullscreen layout remains usable.
  }
}

const restoreBodyScrolling = (): void => {
  if (!bodyOverflowOverridden) return
  document.body.style.overflow = previousBodyOverflow
  bodyOverflowOverridden = false
}

const enterLandscapeFullscreen = async (): Promise<void> => {
  const root = padRootRef.value
  if (!root) return

  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  bodyOverflowOverridden = true
  isFullscreen.value = true
  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen()
      nativeFullscreenActive = true
    } else if ((root as LegacyFullscreenElement).webkitRequestFullscreen) {
      await (root as LegacyFullscreenElement).webkitRequestFullscreen?.()
      nativeFullscreenActive = true
    } else {
      nativeFullscreenActive = false
    }
  } catch {
    nativeFullscreenActive = false
  }

  try {
    const orientation = screen.orientation as ScreenOrientation & LockableScreenOrientation
    await orientation.lock?.('landscape')
  } catch {
    // Some iOS browsers require the user to rotate the phone manually.
  }

  await nextTick()
  resizeCanvas()
}

const exitLandscapeFullscreen = async (): Promise<void> => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if (nativeFullscreenActive) {
      await (document as LegacyFullscreenDocument).webkitExitFullscreen?.()
    }
  } catch {
    // Falling back to the fixed fullscreen layout requires no browser API.
  }

  nativeFullscreenActive = false
  isFullscreen.value = false
  restoreBodyScrolling()
  unlockOrientation()
  await nextTick()
  resizeCanvas()
}

const handleFullscreenChange = (): void => {
  if (nativeFullscreenActive && !document.fullscreenElement) {
    nativeFullscreenActive = false
    isFullscreen.value = false
    restoreBodyScrolling()
    unlockOrientation()
    void nextTick().then(resizeCanvas)
  }
}

const getPointerPoint = (event: PointerEvent): { x: number; y: number } => {
  const rect = canvasRef.value!.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

const startStroke = (event: PointerEvent): void => {
  if (activePointerId !== null || !canvasRef.value) return

  event.preventDefault()
  activePointerId = event.pointerId
  canvasRef.value.setPointerCapture(event.pointerId)
  lastPoint = getPointerPoint(event)
  const context = getContext()
  context?.beginPath()
  context?.moveTo(lastPoint.x, lastPoint.y)
}

const continueStroke = (event: PointerEvent): void => {
  if (event.pointerId !== activePointerId || !lastPoint) return

  event.preventDefault()
  const nextPoint = getPointerPoint(event)
  const context = getContext()
  context?.lineTo(nextPoint.x, nextPoint.y)
  context?.stroke()

  inkDistance += Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y)
  lastPoint = nextPoint
  hasInk.value = true
}

const emitSignature = (): void => {
  const canvas = canvasRef.value
  if (!canvas || inkDistance < 20) {
    isSigned.value = false
    emit('signed-change', false)
    return
  }

  isSigned.value = true
  emit('signed-change', true)
  canvas.toBlob(blob => emit('change', blob), 'image/png')
}

const finishStroke = (event: PointerEvent): void => {
  if (event.pointerId !== activePointerId) return

  event.preventDefault()
  if (canvasRef.value?.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
  activePointerId = null
  lastPoint = null
  emitSignature()
}

const clearSignature = (): void => {
  activePointerId = null
  lastPoint = null
  inkDistance = 0
  hasInk.value = false
  isSigned.value = false
  fillBackground()
  emit('change', null)
  emit('signed-change', false)
}

defineExpose({ clear: clearSignature })

onMounted(async () => {
  await nextTick()
  resizeCanvas()
  resizeObserver = new ResizeObserver(resizeCanvas)
  if (canvasRef.value) {
    resizeObserver.observe(canvasRef.value)
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  restoreBodyScrolling()
  unlockOrientation()
})
</script>

<style scoped>
.signature-pad {
  width: 100%;
}

.signature-layout {
  width: 100%;
}

.signature-canvas-shell {
  background: #ffffff;
  border: 2px solid #8c8f98;
  border-radius: 8px;
  min-height: 300px;
  overflow: hidden;
  position: relative;
}

.signature-canvas-shell.is-signed {
  border-color: #2a5f9e;
  box-shadow: 0 0 0 3px rgba(42, 95, 158, 0.14);
}

.signature-canvas {
  cursor: crosshair;
  display: block;
  height: 300px;
  position: relative;
  touch-action: none;
  width: 100%;
  z-index: 1;
}

.signature-canvas:focus-visible {
  outline: 3px solid #1f6feb;
  outline-offset: -4px;
}

.signature-placeholder {
  color: #696c75;
  font-size: 17px;
  left: 20px;
  line-height: 26px;
  pointer-events: none;
  position: absolute;
  right: 20px;
  text-align: center;
  top: 50%;
  transform: translateY(-50%);
}

.signature-actions {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.signature-action-buttons {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.signature-action-buttons :deep(.ant-btn) {
  min-width: 0;
  white-space: normal;
}

.signature-status {
  color: #5f636c;
  font-size: 17px;
  font-weight: 700;
}

.signature-status.is-complete {
  color: #166534;
}

.signature-fullscreen-header {
  align-items: center;
  display: flex;
  gap: 20px;
  justify-content: space-between;
}

.signature-fullscreen-header div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.signature-fullscreen-header strong {
  color: #17181c;
  font-size: 22px;
  line-height: 30px;
}

.signature-fullscreen-header span {
  color: #5f636c;
  font-size: 16px;
  line-height: 24px;
}

.signature-pad.is-fullscreen {
  background: #f6f7fb;
  height: 100dvh;
  inset: 0;
  overflow: hidden;
  position: fixed;
  width: 100vw;
  z-index: 3000;
}

.signature-pad.is-fullscreen .signature-layout {
  box-sizing: border-box;
  display: grid;
  gap: 12px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  padding: max(12px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  width: 100%;
}

.signature-pad.is-fullscreen .signature-canvas-shell {
  height: 100%;
  min-height: 0;
}

.signature-pad.is-fullscreen .signature-canvas {
  height: 100%;
  min-height: 0;
}

.signature-pad.is-fullscreen .signature-actions {
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 0;
}

.signature-pad.is-fullscreen .signature-action-buttons {
  min-width: min(420px, 65vw);
}

@media (orientation: portrait) {
  .signature-pad.is-fullscreen .signature-layout {
    height: 100vw;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
    transform-origin: center;
    width: 100dvh;
  }

  .signature-pad.is-fullscreen .signature-fullscreen-header span::after {
    content: '；如未自动横屏，请将手机横放';
  }
}
</style>
