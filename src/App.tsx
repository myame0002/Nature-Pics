import { useEffect, useRef, useState } from 'react'
import './App.css'
import { AnalysisView } from './components/AnalysisView'
import { GuideView } from './components/GuideView'
import { HomeView } from './components/HomeView'
import { TopBar } from './components/TopBar'
import { copy } from './copy'
import { analyzeNaturePhoto, askObservationQuestion, fileToDataUrl } from './lib/api'
import { createEntryId, loadFieldGuideEntries, saveFieldGuideEntries } from './lib/storage'
import type {
  AnalysisStatus,
  Candidate,
  CategoryId,
  ChatMessage,
  FieldGuideEntry,
  LanguageId,
  PageId,
} from './types'

type GuideDecision = 'confirmed' | 'rejected' | null

function App() {
  const [language, setLanguage] = useState<LanguageId>('ja')
  const [currentPage, setCurrentPage] = useState<PageId>('home')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle')
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null)
  const [guideFeedback, setGuideFeedback] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [confirmedCandidateId, setConfirmedCandidateId] = useState<string | null>(null)
  const [currentDecision, setCurrentDecision] = useState<GuideDecision>(null)
  const [fieldGuideEntries, setFieldGuideEntries] = useState<FieldGuideEntry[]>(() => loadFieldGuideEntries())
  const [selectedGuideEntryId, setSelectedGuideEntryId] = useState<string | null>(null)
  const [currentGuideEntryId, setCurrentGuideEntryId] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatStatus, setChatStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const toastTimerRef = useRef<number | null>(null)

  function showGuideToast(message: string) {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    setGuideFeedback(message)
    setShowToast(true)
    toastTimerRef.current = window.setTimeout(() => {
      setShowToast(false)
      setGuideFeedback(null)
      toastTimerRef.current = null
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const uiText = copy[language]
  const categories: Array<{ id: CategoryId; name: string; description: string }> = [
    { id: 'flower', ...uiText.categories.flower },
    { id: 'fungus', ...uiText.categories.fungus },
    { id: 'bird', ...uiText.categories.bird },
    { id: 'insect', ...uiText.categories.insect },
  ]
  const selectedCategoryMeta = categories.find(({ id }) => id === selectedCategory)
  const selectedGuideEntry =
    fieldGuideEntries.find(({ id }) => id === selectedGuideEntryId) ?? fieldGuideEntries[0] ?? null
  const approvedCount = fieldGuideEntries.filter(({ approval }) => approval === 'confirmed').length
  const rejectedCount = fieldGuideEntries.filter(({ approval }) => approval === 'rejected').length
  const recentEntry = fieldGuideEntries[0] ?? null

  useEffect(() => {
    const currentPreviewUrl = previewUrl

    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    saveFieldGuideEntries(fieldGuideEntries)
  }, [fieldGuideEntries])

  function resetAnalysisSession() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedCategory(null)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedImageDataUrl(null)
    setFileName('')
    setHasAnalyzed(false)
    setCurrentDecision(null)
    setCurrentGuideEntryId(null)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setShowToast(false)
    setGuideFeedback(null)
    setCandidates([])
    setAnalysisStatus('idle')
    setAnalysisMessage(null)
    setConfirmedCandidateId(null)
  }

  function handleCategorySelect(categoryId: CategoryId) {
    setCandidates([])
    setHasAnalyzed(false)
    setCurrentDecision(null)
    setCurrentGuideEntryId(null)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setShowToast(false)
    setGuideFeedback(null)
    setAnalysisStatus(previewUrl ? 'ready' : 'idle')
    setAnalysisMessage(null)
    setConfirmedCandidateId(null)
    setSelectedCategory(categoryId)
  }

  function handleFileSelect(file: File) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setFileName(file.name)
    setHasAnalyzed(false)
    setCurrentDecision(null)
    setCurrentGuideEntryId(null)
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setShowToast(false)
    setGuideFeedback(null)
    setCandidates([])
    setAnalysisStatus('ready')
    setAnalysisMessage(null)
    setConfirmedCandidateId(null)
    void fileToDataUrl(file).then((value) => {
      setUploadedImageDataUrl(value)
    })
  }

  async function handleAnalyze(options?: { preserveConfirmation?: boolean; languageOverride?: LanguageId }) {
    if (!selectedFile || !selectedCategory) {
      return
    }

    const analysisLanguage = options?.languageOverride ?? language
    const analysisUiText = copy[analysisLanguage]
    const previousConfirmedCandidateId = options?.preserveConfirmation ? confirmedCandidateId : null

    setHasAnalyzed(true)
    setAnalysisStatus('loading')
    setAnalysisMessage(null)
    setGuideFeedback(null)
    if (!options?.preserveConfirmation) {
      setConfirmedCandidateId(null)
      setCurrentDecision(null)
      setCurrentGuideEntryId(null)
    }

    try {
      const response = await analyzeNaturePhoto(selectedCategory, selectedFile, analysisLanguage)

      setCandidates(response.results)
      setAnalysisStatus('success')
      if (
        previousConfirmedCandidateId &&
        response.results.some(({ id }) => id === previousConfirmedCandidateId)
      ) {
        setConfirmedCandidateId(previousConfirmedCandidateId)
      } else if (options?.preserveConfirmation) {
        setConfirmedCandidateId(null)
      }

      if (response.results.length === 0) {
        setAnalysisMessage(analysisUiText.emptyCopy)
      }
    } catch (error) {
      setCandidates([])
      setAnalysisStatus('error')
      setConfirmedCandidateId(null)
      setCurrentDecision(null)
      setAnalysisMessage(error instanceof Error ? error.message : '推論結果の取得に失敗しました。')
    }
  }

  async function saveObservationToFieldGuide(approval: Exclude<GuideDecision, null>, candidate?: Candidate) {
    if (!uploadedImageDataUrl || !selectedCategory) {
      return
    }

    const now = new Date().toISOString()
    const nextId = currentGuideEntryId ?? createEntryId()
    const fallbackTitle = approval === 'confirmed' ? candidate?.name ?? '' : uiText.unknown

    setFieldGuideEntries((currentEntries) => {
      const existingEntry = currentEntries.find(({ id }) => id === nextId) ?? null
      const nextEntry: FieldGuideEntry = {
        id: nextId,
        createdAt: existingEntry?.createdAt ?? now,
        updatedAt: now,
        categoryId: selectedCategory,
        language,
        imageDataUrl: uploadedImageDataUrl,
        approval,
        approvedName: approval === 'confirmed' ? candidate?.name ?? fallbackTitle : uiText.unknown,
        scientificName: candidate?.scientificName ?? '',
        confidence: candidate?.confidence ?? null,
        referenceUrl: candidate?.referenceUrl ?? null,
        customTitle: existingEntry?.customTitle || candidate?.name || fallbackTitle,
        notes: existingEntry?.notes ?? '',
        taxonomy: candidate?.taxonomy ?? existingEntry?.taxonomy ?? null,
        chatHistory: existingEntry?.chatHistory ?? [],
      }

      return [nextEntry, ...currentEntries.filter(({ id }) => id !== nextId)]
    })

    setCurrentGuideEntryId(nextId)
    setSelectedGuideEntryId(nextId)
    setCurrentDecision(approval)
    showGuideToast(uiText.savedGuide)
  }

  async function handleConfirmCandidate(candidate: Candidate) {
    setConfirmedCandidateId(candidate.id)
    await saveObservationToFieldGuide('confirmed', candidate)
  }

  async function handleRejectCandidates() {
    setConfirmedCandidateId(null)
    await saveObservationToFieldGuide('rejected')
  }

  function handleGuideEntryEdit<K extends keyof FieldGuideEntry>(
    entryId: string,
    field: K,
    value: FieldGuideEntry[K],
  ) {
    setFieldGuideEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              [field]: value,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    )
  }

  function handleDeleteGuideEntry(entryId: string) {
    setFieldGuideEntries((currentEntries) => {
      const nextEntries = currentEntries.filter((entry) => entry.id !== entryId)

      if (selectedGuideEntryId === entryId) {
        setSelectedGuideEntryId(nextEntries[0]?.id ?? null)
      }

      return nextEntries
    })
    showGuideToast(uiText.deletedGuide)
  }

  function handleDeleteGuideEntries(entryIds: string[]) {
    setFieldGuideEntries((currentEntries) => {
      const nextEntries = currentEntries.filter((entry) => !entryIds.includes(entry.id))

      if (selectedGuideEntryId && entryIds.includes(selectedGuideEntryId)) {
        setSelectedGuideEntryId(nextEntries[0]?.id ?? null)
      }

      return nextEntries
    })
    showGuideToast(uiText.deletedGuide)
  }

  async function handleAskObservationQuestion() {
    if (!selectedGuideEntry || !chatInput.trim()) {
      return
    }

    const userMessage: ChatMessage = {
      id: createEntryId(),
      role: 'user',
      content: chatInput.trim(),
      createdAt: new Date().toISOString(),
    }

    setChatStatus('loading')
    setChatInput('')
    setFieldGuideEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === selectedGuideEntry.id
          ? {
              ...entry,
              updatedAt: new Date().toISOString(),
              chatHistory: [...entry.chatHistory, userMessage],
            }
          : entry,
      ),
    )

    try {
      const response = await askObservationQuestion(
        {
          ...selectedGuideEntry,
          chatHistory: [...selectedGuideEntry.chatHistory, userMessage],
        },
        userMessage.content,
        language,
      )

      const assistantMessage: ChatMessage = {
        id: createEntryId(),
        role: 'assistant',
        content: response.answer,
        createdAt: new Date().toISOString(),
        source: response.source,
      }

      setFieldGuideEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === selectedGuideEntry.id
            ? {
                ...entry,
                updatedAt: new Date().toISOString(),
                chatHistory: [...entry.chatHistory, assistantMessage],
              }
            : entry,
        ),
      )
      setChatStatus('idle')
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: createEntryId(),
        role: 'assistant',
        content: error instanceof Error ? error.message : '回答を取得できませんでした。',
        createdAt: new Date().toISOString(),
        source: 'template',
      }

      setFieldGuideEntries((currentEntries) =>
        currentEntries.map((entry) =>
          entry.id === selectedGuideEntry.id
            ? {
                ...entry,
                updatedAt: new Date().toISOString(),
                chatHistory: [...entry.chatHistory, assistantMessage],
              }
            : entry,
        ),
      )
      setChatStatus('error')
    }
  }

  function handleSelectGuideEntry(entryId: string) {
    setSelectedGuideEntryId(entryId)
    setChatInput('')
    setChatStatus('idle')
  }

  function handleLanguageChange(nextLanguage: LanguageId) {
    setLanguage(nextLanguage)
    if (!selectedFile || !hasAnalyzed || analysisStatus === 'loading') {
      return
    }
    void handleAnalyze({ preserveConfirmation: true, languageOverride: nextLanguage })
  }

  const appShellClassName =
    currentPage === 'analysis' ? 'app-shell is-analysis' : `app-shell is-${currentPage}`

  return (
    <main className={appShellClassName}>

      <TopBar
        uiText={uiText}
        currentPage={currentPage}
        language={language}
        onNavigate={(page) => {
          if (currentPage === 'analysis' && page !== 'analysis') {
            resetAnalysisSession();
          }
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onLanguageChange={handleLanguageChange}
      />

      {currentPage === 'home' ? (
        <HomeView
          uiText={uiText}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          fieldGuideEntriesLength={fieldGuideEntries.length}
          recentEntry={recentEntry}
          onGoAnalysis={() => { setCurrentPage('analysis'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          onGoGuide={() => { setCurrentPage('guide'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
        />
      ) : null}

      {currentPage === 'analysis' ? (
        <AnalysisView
          uiText={uiText}
          analysisStatus={analysisStatus}
          analysisMessage={analysisMessage}
          guideFeedback={showToast ? guideFeedback : null}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedCategoryMeta={selectedCategoryMeta}
          previewUrl={previewUrl}
          fileName={fileName}
          selectedFile={selectedFile}
          candidates={candidates}
          confirmedCandidateId={confirmedCandidateId}
          currentDecision={currentDecision}
          onCategorySelect={handleCategorySelect}
          onGoGuide={() => { resetAnalysisSession(); setCurrentPage('guide'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          onGoHome={() => { resetAnalysisSession(); setCurrentPage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          onReset={resetAnalysisSession}
          onFileSelect={handleFileSelect}
          onAnalyze={() => {
            void handleAnalyze()
          }}
          onConfirmCandidate={(candidate) => {
            void handleConfirmCandidate(candidate)
          }}
          onRejectCandidates={() => {
            void handleRejectCandidates()
          }}
        />
      ) : null}

      {currentPage === 'guide' ? (
        <GuideView
          uiText={uiText}
          categories={categories}
          fieldGuideEntries={fieldGuideEntries}
          selectedGuideEntry={selectedGuideEntry}
          chatInput={chatInput}
          chatStatus={chatStatus}
          onSelectGuideEntry={handleSelectGuideEntry}
          onGuideEntryEdit={handleGuideEntryEdit}
          onDeleteGuideEntry={handleDeleteGuideEntry}
          onDeleteGuideEntries={handleDeleteGuideEntries}
          onChatInputChange={setChatInput}
          onAskObservationQuestion={handleAskObservationQuestion}
        />
      ) : null}
    </main>
  )
}

export default App
