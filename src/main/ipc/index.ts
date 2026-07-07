export { setupFileHandlers } from './fileHandlers'
export { setupExportHandlers } from './exportHandlers'

import { setupFileHandlers } from './fileHandlers'
import { setupExportHandlers } from './exportHandlers'

export function setupIpcHandlers() {
  setupFileHandlers()
  setupExportHandlers()
}
