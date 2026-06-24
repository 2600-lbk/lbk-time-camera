import { ref } from 'vue'
import JSZip from 'jszip'
import type { FetchedFrame } from '../types'

export function useZipExport() {
  const isExporting = ref(false)

  async function exportZip(
    frames: FetchedFrame[],
    renderFrameToBlob: (frame: FetchedFrame) => Promise<Blob>,
  ): Promise<void> {
    isExporting.value = true
    const zip = new JSZip()

    for (const frame of frames) {
      const blob = await renderFrameToBlob(frame)
      zip.file(`frame_${frame.year}.png`, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lbk-timelapse-frames.zip'
    a.click()
    URL.revokeObjectURL(url)

    isExporting.value = false
  }

  return { isExporting, exportZip }
}
