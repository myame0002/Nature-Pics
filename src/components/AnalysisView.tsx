import React, { useState, useEffect, useRef } from 'react'
import type { UiText } from '../copy'
import type { AnalysisStatus, Candidate, CategoryId } from '../types'

type CategoryMeta = { id: CategoryId; name: string; description: string }

type AnalysisViewProps = {
  uiText: UiText
  analysisStatus: AnalysisStatus
  analysisMessage: string | null
  guideFeedback: string | null
  categories: CategoryMeta[]
  selectedCategory: CategoryId | null
  selectedCategoryMeta?: CategoryMeta
  previewUrl: string | null
  fileName: string
  selectedFile: File | null
  candidates: Candidate[]
  confirmedCandidateId: string | null
  currentDecision: 'confirmed' | 'rejected' | null
  onCategorySelect: (categoryId: CategoryId) => void
  onGoGuide: () => void
  onGoHome: () => void
  onReset: () => void
  onFileSelect: (file: File) => void
  onAnalyze: () => void
  onConfirmCandidate: (candidate: Candidate) => void
  onRejectCandidates: () => void
}

export function AnalysisView({
  uiText,
  analysisStatus,
  analysisMessage,
  guideFeedback,
  categories,
  selectedCategory,
  selectedCategoryMeta,
  previewUrl,
  fileName,
  selectedFile,
  candidates,
  confirmedCandidateId,
  currentDecision,
  onCategorySelect,
  onGoGuide,
  onGoHome,
  onReset,
  onFileSelect,
  onAnalyze,
  onConfirmCandidate,
  onRejectCandidates,
}: AnalysisViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedFile, analysisStatus, currentDecision])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }

  return (
    <div className="analysis-page">
      {guideFeedback && (
        <div className="analysis-toast slide-down-fade">
          <span className="toast-icon">✓</span>
          <p>{guideFeedback}</p>
        </div>
      )}

      <header className="analysis-page-intro">
        {/* Placeholder to maintain connection and spacing */}
      </header>

      <section key="category" className="panel panel-soft analysis-section" aria-labelledby="analysis-section-category">
        <h2 id="analysis-section-category" className="analysis-section-heading">
          {uiText.analysisChoicePrompt}
        </h2>

        <div className="category-grid category-grid-simple">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`category-card category-card-simple category-card-${category.id} ${
                category.id === selectedCategory ? 'is-selected' : ''
              }`}
              aria-pressed={category.id === selectedCategory}
              onClick={() => onCategorySelect(category.id)}
            >
              <span className="category-card-name">{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedCategory && (
        <section key="upload-section" className="panel panel-strong analysis-section" style={{ animationDelay: '100ms' }}>
          <div className={`analysis-upload-layout ${previewUrl ? 'has-preview' : ''}`}>
            {previewUrl && (
              <div className="preview-frame">
                <img src={previewUrl} alt="uploaded nature preview" />
              </div>
            )}

            <div className="analysis-upload-actions">
              <label
                className={`upload-dropzone ${isDragging ? 'is-dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
                <span className="upload-subtitle">{fileName || uiText.selectPhotoHint}</span>
              </label>

              <button
                type="button"
                className="analyze-button"
                onClick={onAnalyze}
                disabled={!selectedFile || analysisStatus === 'loading'}
              >
                {!selectedFile
                  ? uiText.analyzeReady
                  : analysisStatus === 'loading'
                    ? uiText.analyzing
                    : uiText.analyzeAs(selectedCategoryMeta?.name ?? '')}
              </button>
            </div>
          </div>
        </section>
      )}

      {(analysisStatus === 'loading' || analysisStatus === 'error') && (
        <section
          key="status-section"
          className="panel panel-soft analysis-section"
          style={{ animationDelay: '200ms' }}
        >
          <div className="analysis-status-content">
            {analysisStatus === 'loading' ? (
              <div className="empty-state is-ready is-loading-state">
                <h3>{uiText.analyzing}</h3>
                <p>{uiText.loadingBanner}</p>
                <div className="loading-bar-container">
                  <div className="loading-bar-fill" />
                </div>
              </div>
            ) : analysisStatus === 'error' && analysisMessage ? (
              <div className="status-banner is-error">{analysisMessage}</div>
            ) : null}
          </div>
        </section>
      )}

      {analysisStatus === 'success' && (
        <section
          key="results-section"
          className="panel analysis-panel analysis-section"
          style={{ animationDelay: '200ms' }}
        >
          {candidates.length === 0 ? (
            <div className="empty-state">
              <h3>{uiText.emptyTitle}</h3>
              <p>{analysisMessage ?? uiText.emptyCopy}</p>
            </div>
          ) : (
            <div className="analysis-results-container">
              <div className="candidate-grid">
                {candidates.map((candidate) => {
                  const isConfirmed = candidate.id === confirmedCandidateId

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      className={
                        isConfirmed
                          ? 'candidate-card is-confirmed candidate-card-compact'
                          : 'candidate-card candidate-card-compact'
                      }
                      onClick={() => onConfirmCandidate(candidate)}
                      aria-pressed={isConfirmed}
                    >
                      {candidate.referenceImage ? (
                        <img src={candidate.referenceImage} alt={candidate.name} />
                      ) : (
                        <div className="candidate-image-fallback">{uiText.noImage}</div>
                      )}

                      <div className="candidate-meta candidate-meta-compact">
                        <div className="candidate-score-badge">
                          {uiText.confidence(Math.round((candidate.confidence || 0) * 100))}
                        </div>
                        <h3>{candidate.scientificName || candidate.name}</h3>
                        {candidate.scientificName && candidate.name !== candidate.scientificName ? (
                          <p className="candidate-support">{candidate.name}</p>
                        ) : null}

                        <a
                          className="candidate-link"
                          href={candidate.referenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {uiText.detailsLink}
                        </a>
                      </div>
                    </button>
                  )
                })}

                <div className="candidate-actions-card">
                  <button
                    type="button"
                    className={`reject-all-button ${currentDecision === 'rejected' ? 'is-active' : ''}`}
                    onClick={onRejectCandidates}
                  >
                    <span className="icon">✕</span>
                    <strong>{uiText.noneOfThese}</strong>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {currentDecision && (
        <section key="actions-section" className="panel panel-soft analysis-section decision-summary-section" style={{ animationDelay: '400ms' }}>
          <div className="decision-header">
            <p className="decision-title">
              {currentDecision === 'rejected'
                ? uiText.rejectedTitle
                : uiText.confirmedTitle()}
            </p>
          </div>
          <div className="decision-actions">
            <button type="button" className="analyze-button" onClick={onGoGuide}>
              {uiText.analysisOpenGuide}
            </button>
            <button type="button" className="secondary-button" onClick={onReset}>
              {uiText.analyzeAgain}
            </button>
            <button type="button" className="secondary-button" onClick={onGoHome}>
              {uiText.goHome}
            </button>
          </div>
        </section>
      )}
      <div ref={bottomRef} style={{ height: '80px', pointerEvents: 'none' }} />
    </div>
  )
}
