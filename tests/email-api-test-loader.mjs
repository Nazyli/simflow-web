import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

export async function resolve(specifier, context, nextResolve) {
  if (
    specifier === './client' &&
    (context.parentURL?.endsWith('/src/shared/api/email.ts') ||
      context.parentURL?.endsWith('/src/shared/api/master-data.ts'))
  ) {
    return {
      shortCircuit: true,
      url: new URL('./email-api-client.stub.mjs', import.meta.url).href,
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    const source = await readFile(new URL(url), 'utf8')
    return {
      format: 'module',
      shortCircuit: true,
      source: stripTypeScriptTypes(source, { mode: 'transform' }),
    }
  }
  return nextLoad(url, context)
}
