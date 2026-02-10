import { userStore } from '@/store'
import { SSE } from 'sse.js'

const baseURL = import.meta.env.VITE_API_BASE_URL + '/api'

export const createSSE = (
  path: string,
  options: {
    payload?: object 
    customHeaders?: Record<string, string>
    onMessage?: (data: any) => void 
    onError?: (error: Event) => void 
    onClose?: () => void 
  } = {}
) => {
  const latestToken = userStore.getState().userToken
  
  const headers: Record<string, string> = {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/jsoncharset=utf-8',
    ...options.customHeaders, 
  }
  if (latestToken) {
    headers.Authorization = `Bearer ${latestToken}`
  }

  const sse = new SSE(`${baseURL}${path}`, {
    method: 'POST',
    headers,
    payload: options.payload ? JSON.stringify(options.payload) : undefined,
  })

  if (options.onMessage) {
    sse.addEventListener('message', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        options.onMessage!(data)
      } catch (err) {
        console.error('SSE消息解析失败:', err, e.data)
      }
    })
  }

  if (options.onError) {
    sse.addEventListener('error', options.onError)
  }

  if (options.onClose) {
    sse.addEventListener('close', options.onClose)
  }

  return {
    sseInstance: sse,
    connect: () => sse.stream(),
    close: () => {
      sse.close()
      options.onClose?.() 
    },
  }
}
