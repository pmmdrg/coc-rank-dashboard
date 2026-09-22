import type { Player, Season, StorageAdapter, StorageDocument, StorageFormat } from '../types'
import { csvToSeasons, seasonsToCsv } from '../lib/csv'
import { normalizeSeason } from '../lib/ranking'

type WritableFileHandle = FileSystemFileHandle & {
  createWritable: () => Promise<FileSystemWritableFileStream>
}

type StoredDocument = StorageDocument & {
  handle?: WritableFileHandle
}

function getFormat(fileName: string): StorageFormat {
  return fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'json'
}

function serializeDocument(document: StorageDocument, format: StorageFormat): string {
  const seasons = (document.seasons && document.seasons.length > 0)
    ? document.seasons.map(normalizeSeason)
    : [normalizeSeason(document.season)]

  if (format === 'csv') {
    return seasonsToCsv(seasons)
  }

  // JSON format
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

  // JSON parsing
  const parsed = JSON.parse(content) as unknown

  // Case 1: Mảng trực tiếp (ví dụ: [ { id, name, ... } ])
  if (Array.isArray(parsed)) {
    if (parsed.length > 0 && Array.isArray((parsed[0] as Season)?.players)) {
      const seasons = (parsed as Season[]).map(normalizeSeason)
      return { seasons, activeSeasonIndex: 0 }
    }
    // Mảng người chơi trực tiếp
    const season: Season = {
      league: 'Legend 3',
      seasonName: 'Legend 3',
      startsAt: '',
      endsAt: '',
      myPlayerId: (parsed[0] as Player)?.id || '',
      players: parsed as Player[],
    }
    return { seasons: [normalizeSeason(season)], activeSeasonIndex: 0 }
  }

  const record = parsed as Record<string, unknown>

  // Case 2: Đa mùa giải { seasons: [ ... ] }
  if (Array.isArray(record.seasons) && record.seasons.length > 0) {
    const seasons = (record.seasons as Season[]).map(normalizeSeason)
    const activeSeasonName = typeof record.activeSeasonName === 'string' ? record.activeSeasonName : ''
    const foundIndex = seasons.findIndex((s) => s.seasonName === activeSeasonName)
    const activeSeasonIndex = foundIndex >= 0 ? foundIndex : 0
    return { seasons, activeSeasonIndex }
  }

  // Case 3: Bọc trong thuộc tính { season: { ... } } (như format draft)
  if (record.season && typeof record.season === 'object') {
    const single = normalizeSeason(record.season as Season)
    return { seasons: [single], activeSeasonIndex: 0 }
  }

  // Case 4: Mùa giải đơn trực tiếp { league, players, ... }
  const single = normalizeSeason(record as unknown as Season)
  return { seasons: [single], activeSeasonIndex: 0 }
}

async function writeFile(handle: WritableFileHandle, document: StorageDocument, format: StorageFormat) {
  const writable = await handle.createWritable()
  await writable.write(serializeDocument(document, format))
  await writable.close()
}

const DB_NAME = 'coc_rank_storage'
const STORE_NAME = 'handles'
const KEY_ACTIVE_HANDLE = 'active_file_handle'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB không được hỗ trợ.'))
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveHandleToIDB(handle: WritableFileHandle) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(handle, KEY_ACTIVE_HANDLE)
  } catch {
    // Bỏ qua nếu môi trường không cho phép ghi IndexedDB
  }
}

async function getHandleFromIDB(): Promise<WritableFileHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(KEY_ACTIVE_HANDLE)
      req.onsuccess = () => resolve((req.result as WritableFileHandle) || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export function createFileSystemAdapter(): StorageAdapter {
  let activeHandle: WritableFileHandle | undefined
  let cachedHandle: WritableFileHandle | undefined

  // Tự động kiểm tra và phục hồi quyền ghi file đã mở trước đó khi tải trang
  getHandleFromIDB().then(async (handle) => {
    if (!handle) return
    cachedHandle = handle
    try {
      const queryable = handle as unknown as { queryPermission?: (desc: { mode: string }) => Promise<string> }
      if (typeof queryable.queryPermission === 'function') {
        const perm = await queryable.queryPermission({ mode: 'readwrite' })
        if (perm === 'granted') {
          activeHandle = handle
        }
      }
    } catch {
      // Bỏ qua lỗi truy vấn quyền ban đầu
    }
  })

  return {
    label: 'Local file',
    canWriteBack: 'showOpenFilePicker' in window && 'showSaveFilePicker' in window,
    hasActiveFile() {
      return Boolean(activeHandle)
    },
    async open() {
      const openPicker = window.showOpenFilePicker
      if (!openPicker) {
        throw new Error('Trình duyệt chưa hỗ trợ File System Access API.')
      }

      const [handle] = await openPicker({
        multiple: false,
        types: [
          {
            description: 'Rank data',
            accept: {
              'application/json': ['.json'],
              'text/csv': ['.csv'],
            },
          },
        ],
      })

      // Chủ động xin quyền ghi đè (readwrite) ngay lúc người dùng vừa bấm chọn file
      let writableHandle = handle as WritableFileHandle
      try {
        const requestable = handle as unknown as { requestPermission?: (desc: { mode: string }) => Promise<string> }
        if (typeof requestable.requestPermission === 'function') {
          const perm = await requestable.requestPermission({ mode: 'readwrite' })
          if (perm === 'granted') {
            writableHandle = handle as WritableFileHandle
          }
        }
      } catch {
        // Nếu người dùng không cấp quyền ghi, vẫn đọc bình thường
      }

      const file = await handle.getFile()
      const format = getFormat(file.name)
      const content = await file.text()
      const { seasons, activeSeasonIndex } = parseDocument(content, format)

      // Chỉ lưu và kích hoạt handle khi file đã parse thành công 100%
      activeHandle = writableHandle
      cachedHandle = writableHandle
      await saveHandleToIDB(writableHandle)

      return {
        name: file.name,
        format,
        season: seasons[activeSeasonIndex] ?? seasons[0],
        seasons,
        activeSeasonIndex,
      }
    },
    async save(document) {
      const storedDocument = document as StoredDocument
      let handle = storedDocument.handle ?? activeHandle

      // Nếu chưa có activeHandle nhưng có cachedHandle từ phiên làm việc trước
      if (!handle && cachedHandle) {
        try {
          const requestable = cachedHandle as unknown as { requestPermission?: (desc: { mode: string }) => Promise<string> }
          if (typeof requestable.requestPermission === 'function') {
            const perm = await requestable.requestPermission({ mode: 'readwrite' })
            if (perm === 'granted') {
              activeHandle = cachedHandle
              handle = cachedHandle
            }
          }
        } catch {
          // Bỏ qua nếu người dùng hủy
        }
      }

      if (!handle) {
        return this.saveAs(document, document.format)
      }

      try {
        await writeFile(handle, document, document.format)
        activeHandle = handle
        cachedHandle = handle
        await saveHandleToIDB(handle)
        return {
          ...document,
          season: normalizeSeason(document.season),
        }
      } catch (writeErr) {
        // Nếu mất quyền ghi đè, gọi saveAs để người dùng cấp quyền lại
        if (writeErr instanceof DOMException && writeErr.name === 'NotAllowedError') {
          return this.saveAs(document, document.format)
        }
        throw writeErr
      }
    },
    async saveAs(document, format) {
      const savePicker = window.showSaveFilePicker
      if (!savePicker) {
        throw new Error('Trình duyệt chưa hỗ trợ lưu file trực tiếp.')
      }

      const extension = format === 'json' ? 'json' : 'csv'
      const handle = (await savePicker({
        suggestedName: document.name.replace(/\.(json|csv)$/i, `.${extension}`),
        types: [
          {
            description: format === 'json' ? 'JSON data' : 'CSV data',
            accept:
              format === 'json'
                ? { 'application/json': ['.json'] }
                : { 'text/csv': ['.csv'] },
          },
        ],
      })) as WritableFileHandle

      await writeFile(handle, document, format)
      activeHandle = handle
      cachedHandle = handle
      await saveHandleToIDB(handle)

      return {
        name: handle.name,
        format,
        season: normalizeSeason(document.season),
        seasons: document.seasons,
        activeSeasonIndex: document.activeSeasonIndex,
      }
    },
  }
}
