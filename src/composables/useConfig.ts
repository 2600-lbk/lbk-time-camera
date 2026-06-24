import rawConfig from '../assets/config.json'
import type { AppConfig, ImageSource } from '../types'

const config = rawConfig as AppConfig

export function useConfig(): { config: AppConfig; sources: ImageSource[] } {
  const sources = [...config.sources].sort((a, b) => a.year - b.year)
  return { config, sources }
}
