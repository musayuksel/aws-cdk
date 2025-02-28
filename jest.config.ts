// @ts-ignore
import type { Config } from '@jest/types'
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  setupFiles: ['<rootDir>/jestSetEnvVars.js'],
  preset: 'ts-jest'
}
export default config
