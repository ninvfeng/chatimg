import type { APIRoute } from 'astro'

export const post: APIRoute = async(context) => {
  const body = await context.request.json()

  const { token, prompt, ngative_prompt, seed } = body

  const response = await fetch(`${import.meta.env.API_URL}/plugin/genimg/genimg`, {
    headers: {
      'Content-Type': 'application/json',
      'Token': token,
    },
    method: 'POST',
    body: JSON.stringify({
      app_key: import.meta.env.APP_KEY,
      prompt,
      ngative_prompt,
      seed,
    }),
  })
  const text = await response.text()
  return new Response(text)
}
