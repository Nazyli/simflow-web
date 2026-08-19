export async function resolve(specifier, context, nextResolve) {
  if (specifier === './client' && context.parentURL?.endsWith('/src/shared/api/email.ts')) {
    return {
      shortCircuit: true,
      url: new URL('./email-api-client.stub.mjs', import.meta.url).href,
    }
  }
  return nextResolve(specifier, context)
}
