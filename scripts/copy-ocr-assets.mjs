import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const output = join(root, 'public', 'ocr')
const modules = join(root, 'node_modules')

await rm(output, { recursive: true, force: true })
await mkdir(join(output, 'core'), { recursive: true })
await mkdir(join(output, 'lang'), { recursive: true })

await cp(
  join(modules, 'tesseract.js', 'dist', 'worker.min.js'),
  join(output, 'worker.min.js')
)

const coreFiles = [
  'tesseract-core.wasm.js',
  'tesseract-core-simd.wasm.js',
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
]

for (const file of coreFiles) {
  await cp(join(modules, 'tesseract.js-core', file), join(output, 'core', file))
}

await cp(
  join(modules, '@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'),
  join(output, 'lang', 'eng.traineddata.gz')
)
