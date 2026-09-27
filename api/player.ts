import type { IncomingMessage, ServerResponse } from 'http'

// Handler cho Vercel Serverless Function (Node.js runtime)
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]>; method?: string },
  res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => void },
) {
  // Cấu hình CORS để an toàn và linh hoạt
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
    res.end(JSON.stringify({ error: 'Phương thức không được hỗ trợ. Chỉ hỗ trợ GET.' }))
    return
  }

  // Phân tích tham số tag từ query
  let tag = ''
  if (req.query && req.query.tag) {
    tag = Array.isArray(req.query.tag) ? req.query.tag[0] : req.query.tag
  } else if (req.url) {
    const url = new URL(req.url, 'http://localhost')
    tag = url.searchParams.get('tag') || ''
  }

  if (!tag) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        error: 'Thiếu tham số tag. Vui lòng truyền ?tag=#TAG_NGUOI_CHOI',
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

  const cleanTag = tag.trim().toUpperCase()
  const formattedTag = cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`
  const encodedTag = encodeURIComponent(formattedTag)

  // Mặc định định tuyến qua proxy IP tĩnh RoyaleAPI dành cho Clash of Clans (45.79.218.79)
  const proxyBase = process.env.COC_PROXY_URL || 'https://cocproxy.royaleapi.dev/v1'
  const targetUrl = `${proxyBase.replace(/\/+$/, '')}/players/${encodedTag}`

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
      let errorMessage = rawMessage
        ? `Lỗi API Supercell (${apiRes.status}): ${rawMessage}`
        : `Lỗi API Supercell (${apiRes.status})`

      if (apiRes.status === 403) {
        errorMessage = `Lỗi 403 Forbidden: ${rawMessage || 'Token không hợp lệ hoặc IP chưa khớp danh sách cho phép trên Supercell Developer Portal.'}`
      } else if (apiRes.status === 404) {
        errorMessage = `Không tìm thấy người chơi với Tag "${formattedTag}". Vui lòng kiểm tra lại chính xác Tag trong game.`
      }

      res.statusCode = apiRes.status
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: errorMessage,
          status: apiRes.status,
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
        details: errorDetails,
      }),
    )
  }
}
