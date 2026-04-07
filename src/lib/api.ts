import type {
  AnalysisResponse,
  CategoryId,
  FieldGuideEntry,
  LanguageId,
  ObservationQuestionResponse,
} from '../types'

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.replace(/\/$/, '')
  }
  const base = import.meta.env.BASE_URL ?? '/'
  const trimmed = base.replace(/\/$/, '')
  return trimmed ? `${trimmed}/api` : '/api'
}

const apiBaseUrl = resolveApiBaseUrl()

function parseJsonBody(text: string): unknown | null {
  const trimmed = text.trim()
  if (!trimmed) {
    return null
  }
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

function extractErrorMessage(
  json: unknown,
  status: number,
  rawText: string,
): string {
  if (json && typeof json === 'object') {
    const record = json as Record<string, unknown>
    const detail = record.detail
    const error = record.error
    const message = record.message
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
    if (typeof error === 'string' && error.trim()) {
      return error
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const nested = (error as { message?: unknown }).message
      if (typeof nested === 'string' && nested.trim()) {
        return nested
      }
    }
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  const snippet = rawText.trim().slice(0, 240)
  if (snippet && !snippet.startsWith('<')) {
    return `推論APIがエラーを返しました (${status})。${snippet}`
  }
  return `推論APIがエラーを返しました (${status})。ローカルでは「npm run dev」で API も一緒に起動し、.env.local に INATURALIST_API_TOKEN を設定してください。`
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolvePromise, rejectPromise) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolvePromise(reader.result)
        return
      }

      rejectPromise(new Error('画像の読み取りに失敗しました。'))
    }

    reader.onerror = () => {
      rejectPromise(new Error('画像の読み取り中にエラーが発生しました。'))
    }

    reader.readAsDataURL(file)
  })
}

export async function analyzeNaturePhoto(categoryId: CategoryId, file: File, language: LanguageId) {
  const imageDataUrl = await fileToDataUrl(file)
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        imageDataUrl,
        language,
      }),
    })
  } catch {
    throw new Error(
      'ローカル推論APIに接続できません。「npm run dev」で API も起動するか、別ターミナルで npm run api を実行してください。',
    )
  }

  const text = await response.text()
  const json = parseJsonBody(text)

  if (!response.ok) {
    throw new Error(extractErrorMessage(json, response.status, text))
  }

  if (json === null) {
    throw new Error('推論APIから空の応答が返りました。')
  }

  return json as AnalysisResponse
}

export async function askObservationQuestion(
  entry: FieldGuideEntry,
  question: string,
  language: LanguageId,
) {
  const response = await fetch(`${apiBaseUrl}/observation-question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entry,
      question,
      language,
    }),
  })

  const text = await response.text()
  const json = parseJsonBody(text)

  if (!response.ok) {
    throw new Error(extractErrorMessage(json, response.status, text))
  }

  if (json === null) {
    throw new Error('質問への回答取得に失敗しました。')
  }

  return json as ObservationQuestionResponse
}
