import type { IncomingMessage, ServerResponse } from 'http'

// Handler đa năng cho toàn bộ API Clash of Clans qua Vercel Serverless Function
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]>; method?: string },
  res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => void },
) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Chỉ hỗ trợ phương thức GET.' }))
    return
  }

  // Lấy đường dẫn endpoint cần gọi từ query ?path=...
  let rawPath = ''
  if (req.query && req.query.path) {
    rawPath = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path
  } else if (req.url) {
    const url = new URL(req.url, 'http://localhost')
    rawPath = url.searchParams.get('path') || ''
  }

  if (!rawPath) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'Thiếu tham số path. Ví dụ: /api/coc?path=/leaguetiers hoặc /api/coc?path=/players/%23TAG',
      }),
    )
    return
  }

  const token = process.env.COC_API_TOKEN
  if (!token) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error:
          'Chưa cấu hình biến môi trường COC_API_TOKEN. Vui lòng thêm biến này trên Vercel Project Settings > Environment Variables hoặc file .env.local.',
      }),
    )
    return
  }

  // Chuẩn hóa path: Đảm bảo các dấu # trong path được encode thành %23
  let formattedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  formattedPath = formattedPath.replace(/#([A-Z0-9]+)/gi, '%23$1')

  const proxyBase = process.env.COC_PROXY_URL || 'https://cocproxy.royaleapi.dev/v1'
  const targetUrl = `${proxyBase.replace(/\/+$/, '')}${formattedPath}`

  try {
    const apiRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = (await apiRes.json()) as Record<string, any>

    if (!apiRes.ok) {
      const rawMessage = (data?.message as string) || (data?.reason as string) || ''
      const errorMessage = rawMessage
        ? `Lỗi API Supercell (${apiRes.status}): ${rawMessage}`
        : `Lỗi API Supercell (${apiRes.status})`

      res.statusCode = apiRes.status
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: errorMessage,
          status: apiRes.status,
          targetUrl,
          details: data,
        }),
      )
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? err.message : String(err)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'Không thể kết nối đến máy chủ API Clash of Clans qua proxy.',
        targetUrl,
        details: errorDetails,
      }),
    )
  }
}
