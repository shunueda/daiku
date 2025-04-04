#!/usr/bin/env tsx
import { existsSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import {
  type PackageJson,
  readPackageJSON,
  readTSConfig,
  writePackageJSON
} from 'pkg-types'
import { build } from 'tsup'
import { pick } from './pick'

const srcDir = 'src'
const outDir = 'dist'
const indexFile = 'index.ts'
const packageFile = 'package.json'
const readmeFile = 'README.md'

const tsconfig = await readTSConfig()
const packageJson = await readPackageJSON()
const readmeMd = join(cwd(), readmeFile)
const entries = await Array.fromAsync(glob(join(srcDir, '**', indexFile)))

await build({
  entry: entries,
  target: tsconfig.compilerOptions?.target || '',
  minify: true,
  format: 'esm',
  splitting: true,
  sourcemap: true,
  clean: true,
  dts: true,
  shims: true,
  treeshake: true,
  keepNames: true,
  cjsInterop: true,
  removeNodeProtocol: false,
  outDir
})

const modified: PackageJson = {
  ...pick(packageJson, [
    'name',
    'version',
    'description',
    'license',
    'type',
    'bin',
    'repository',
    'dependencies',
    'keywords'
  ]),
  sideEffects: false,
  exports: {
    [`./${packageFile}`]: `./${packageFile}`,
    ...Object.fromEntries(
      entries.map(entry => {
        const path = entry.replace(srcDir, '.')
        return [
          path.replace(`/${indexFile}`, ''),
          {
            types: path.replace('.ts', '.d.ts'),
            import: path.replace('.ts', '.js')
          }
        ]
      })
    )
  }
}

await writePackageJSON(join(cwd(), outDir, packageFile), modified)

if (existsSync(readmeMd)) {
  await cp(readmeMd, join(cwd(), outDir, readmeFile))
}
