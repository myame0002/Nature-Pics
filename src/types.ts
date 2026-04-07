export type CategoryId = 'flower' | 'fungus' | 'bird' | 'insect'
export type LanguageId = 'ja' | 'en'
export type PageId = 'home' | 'analysis' | 'guide'

export type TaxonomyInfo = {
  kingdom: string | null
  phylum: string | null
  class: string | null
  order: string | null
  family: string | null
  genus: string | null
  species: string | null
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  source?: 'ollama' | 'template'
}

export type Candidate = {
  id: string
  name: string
  scientificName: string
  confidence: number
  summary: string
  checkpoints: string[]
  referenceImage: string | null
  referenceUrl: string
  rankLabel: string
  taxonomy: TaxonomyInfo
}

export type FieldGuideEntry = {
  id: string
  createdAt: string
  updatedAt: string
  categoryId: CategoryId
  language: LanguageId
  imageDataUrl: string
  approval: 'confirmed' | 'rejected'
  approvedName: string
  scientificName: string
  confidence: number | null
  referenceUrl: string | null
  customTitle: string
  notes: string
  objectPosition?: string
  cropArea?: { x: number; y: number; size: number }
  imageAspect?: number
  taxonomy: TaxonomyInfo | null
  chatHistory: ChatMessage[]
}

export type AnalysisStatus = 'idle' | 'ready' | 'loading' | 'success' | 'error'

export type AnalysisResponse = {
  category: {
    id: CategoryId
    name: string
    notice: string
  }
  notice?: string
  results: Candidate[]
  totalResults: number
}

export type ObservationQuestionResponse = {
  answer: string
  source: 'ollama' | 'template'
}
