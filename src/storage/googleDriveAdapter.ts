import type { Season, StorageAdapter, StorageDocument, StorageFormat } from '../types'
import { csvToSeasons, seasonsToCsv } from '../lib/csv'
import { normalizeSeason } from '../lib/ranking'

export interface GoogleDriveConfig {
  clientId: string
  apiKey: string
}

const STORAGE_KEY_CONFIG = 'coc_rank_gdrive_config'
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'

let currentAccessToken: string | null = null
let activeDriveFileId: string | null = null

export function getGoogleDriveConfig(): GoogleDriveConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (raw) {
      return JSON.parse(raw) as GoogleDriveConfig
    }
  } catch {
    // Ignore error
  }
  return { clientId: '', apiKey: '' }
}

export function saveGoogleDriveConfig(config: GoogleDriveConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
}

export function isGoogleDriveSignedIn(): boolean {
  return currentAccessToken !== null
}

export function signOutGoogleDrive(): void {
  currentAccessToken = null
  activeDriveFileId = null
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Không thể tải script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function requestGoogleAccessToken(): Promise<string> {
  if (currentAccessToken) return currentAccessToken

  const config = getGoogleDriveConfig()
  if (!config.clientId) {
    throw new Error('Chưa cấu hình Google Client ID. Vui lòng mở Cấu hình Google Drive để thiết lập.')
  }

  await loadScript('https://accounts.google.com/gsi/client')

  const google = (window as unknown as { google?: { accounts?: { oauth2?: { initTokenClient: (options: unknown) => { requestAccessToken: (opts?: unknown) => void } } } } }).google

  if (!google?.accounts?.oauth2) {
    throw new Error('Không thể khởi tạo Google Identity Services.')
  }

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts!.oauth2!.initTokenClient({
      client_id: config.clientId,
      scope: SCOPES,
      callback: (tokenResponse: { access_token?: string; error?: string }) => {
        if (tokenResponse.error) {
          reject(new Error(`Đăng nhập Google thất bại: ${tokenResponse.error}`))
          return
        }
        if (tokenResponse.access_token) {
          currentAccessToken = tokenResponse.access_token
          resolve(tokenResponse.access_token)
        } else {
          reject(new Error('Không nhận được Access Token từ Google.'))
        }
      },
    })

    tokenClient.requestAccessToken({ prompt: '' })
  })
}

function serializeDocument(document: StorageDocument, format: StorageFormat): string {
  const seasons = (document.seasons && document.seasons.length > 0)
    ? document.seasons.map(normalizeSeason)
    : [normalizeSeason(document.season)]

  if (format === 'csv') {
    return seasonsToCsv(seasons)
  }

  if (seasons.length === 1) {
    return `${JSON.stringify(seasons[0], null, 2)}\n`
  }

  return `${JSON.stringify(
    {
      league: document.season.league,
      activeSeasonName: document.season.seasonName,
      seasons,
    },
    null,
    2,
  )}\n`
}

function parseDocument(content: string, format: StorageFormat): { seasons: Season[]; activeSeasonIndex: number } {
  if (format === 'csv') {
    const seasons = csvToSeasons(content)
    return { seasons, activeSeasonIndex: 0 }
  }

  const parsed = JSON.parse(content) as Record<string, unknown>
  if (Array.isArray(parsed.seasons) && parsed.seasons.length > 0) {
    const seasons = (parsed.seasons as Season[]).map(normalizeSeason)
    const activeSeasonName = typeof parsed.activeSeasonName === 'string' ? parsed.activeSeasonName : ''
    const foundIndex = seasons.findIndex((s) => s.seasonName === activeSeasonName)
    const activeSeasonIndex = foundIndex >= 0 ? foundIndex : 0
    return { seasons, activeSeasonIndex }
  }

  const single = normalizeSeason(parsed as unknown as Season)
  return { seasons: [single], activeSeasonIndex: 0 }
}

function getFormat(fileName: string): StorageFormat {
  return fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'json'
}

export function createGoogleDriveAdapter(): StorageAdapter {
  return {
    label: 'Google Drive',
    canWriteBack: true,
    hasActiveFile() {
      return Boolean(activeDriveFileId)
    },

    async open(): Promise<StorageDocument> {
      const token = await requestGoogleAccessToken()
      const config = getGoogleDriveConfig()

      let selectedFileId: string | null = null
      let selectedFileName: string | null = null

      // Ưu tiên dùng Google Picker nếu đã có API Key
      if (config.apiKey) {
        try {
          await loadScript('https://apis.google.com/js/api.js')
          const gapi = (window as unknown as { gapi?: { load: (api: string, cb: () => void) => void } }).gapi

          if (gapi) {
            await new Promise<void>((resolve) => gapi.load('picker', resolve))
            const pickerApi = (window as unknown as {
              google?: {
                picker?: {
                  PickerBuilder: new () => {
                    addView: (view: unknown) => any
                    setOAuthToken: (token: string) => any
                    setDeveloperKey: (key: string) => any
                    setCallback: (cb: (data: { action: string; docs?: Array<{ id: string; name: string }> }) => void) => any
                    build: () => { setVisible: (visible: boolean) => void }
                  }
                  DocsView: new () => {
                    setMimeTypes: (types: string) => unknown
                  }
                  Action: { PICKED: string; CANCEL: string }
                }
              }
            }).google?.picker

            if (pickerApi) {
              const fileResult = await new Promise<{ id: string; name: string } | null>((resolve) => {
                const view = new pickerApi.DocsView()
                view.setMimeTypes('application/json,text/csv,text/plain')

                const picker = new pickerApi.PickerBuilder()
                  .addView(view)
                  .setOAuthToken(token)
                  .setDeveloperKey(config.apiKey)
                  .setCallback((data: { action: string; docs?: Array<{ id: string; name: string }> }) => {
                    if (data.action === pickerApi.Action.PICKED && data.docs && data.docs[0]) {
                      resolve({ id: data.docs[0].id, name: data.docs[0].name })
                    } else if (data.action === pickerApi.Action.CANCEL) {
                      resolve(null)
                    }
                  })
                  .build()

                picker.setVisible(true)
              })

              if (fileResult) {
                selectedFileId = fileResult.id
                selectedFileName = fileResult.name
              } else {
                throw new Error('Đã hủy chọn file từ Google Drive.')
              }
            }
          }
        } catch (pickerErr) {
          console.warn('Google Picker không khả dụng, chuyển sang danh sách file Drive:', pickerErr)
        }
      }

      // Fallback: Liệt kê các file .json hoặc .csv trên Google Drive
      if (!selectedFileId) {
        const query = encodeURIComponent("trashed = false and (name contains '.json' or name contains '.csv')")
        const listRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)&pageSize=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        if (!listRes.ok) {
          throw new Error(`Lỗi tải danh sách file từ Drive (${listRes.status}): ${await listRes.text()}`)
        }

        const listData = (await listRes.json()) as { files?: Array<{ id: string; name: string }> }
        const files = listData.files || []

        if (files.length === 0) {
          throw new Error('Không tìm thấy file .json hoặc .csv nào trên Google Drive của bạn.')
        }

        // Chọn file đầu tiên hoặc file phù hợp nhất nếu không có Picker
        selectedFileId = files[0].id
        selectedFileName = files[0].name
      }

      // Tải nội dung file từ Google Drive
      const fileRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${selectedFileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!fileRes.ok) {
        throw new Error(`Không thể đọc file từ Google Drive: ${await fileRes.text()}`)
      }

      const content = await fileRes.text()
      const format = getFormat(selectedFileName || 'season.json')
      activeDriveFileId = selectedFileId

      const { seasons, activeSeasonIndex } = parseDocument(content, format)

      return {
        name: selectedFileName || 'drive-season.json',
        format,
        season: seasons[activeSeasonIndex] ?? seasons[0],
        seasons,
        activeSeasonIndex,
        driveFileId: selectedFileId,
      }
    },

    async save(document: StorageDocument): Promise<StorageDocument> {
      const token = await requestGoogleAccessToken()
      const fileId = document.driveFileId ?? activeDriveFileId

      if (!fileId) {
        return this.saveAs(document, document.format)
      }

      const content = serializeDocument(document, document.format)
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': document.format === 'json' ? 'application/json' : 'text/csv',
          },
          body: content,
        },
      )

      if (!res.ok) {
        throw new Error(`Lưu file lên Google Drive thất bại: ${await res.text()}`)
      }

      activeDriveFileId = fileId
      return {
        ...document,
        season: normalizeSeason(document.season),
        driveFileId: fileId,
      }
    },

    async saveAs(document: StorageDocument, format: StorageFormat): Promise<StorageDocument> {
      const token = await requestGoogleAccessToken()
      const extension = format === 'json' ? 'json' : 'csv'
      const baseName = document.name.replace(/\.(json|csv)$/i, '')
      const fileName = `${baseName}.${extension}`
      const content = serializeDocument(document, format)
      const mimeType = format === 'json' ? 'application/json' : 'text/csv'

      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const metadata = {
        name: fileName,
        mimeType,
      }

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        content +
        closeDelimiter

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        },
      )

      if (!res.ok) {
        throw new Error(`Tạo file trên Google Drive thất bại: ${await res.text()}`)
      }

      const data = (await res.json()) as { id: string; name: string }
      activeDriveFileId = data.id

      return {
        name: data.name || fileName,
        format,
        season: normalizeSeason(document.season),
        seasons: document.seasons,
        activeSeasonIndex: document.activeSeasonIndex,
        driveFileId: data.id,
      }
    },
  }
}
