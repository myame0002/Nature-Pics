import { useState, useRef } from 'react'
import type { UiText } from '../copy'
import type { FieldGuideEntry, CategoryId, TaxonomyInfo } from '../types'

type CategoryMeta = { id: CategoryId; name: string; description: string }

type GuideEntryEditHandler = <K extends keyof FieldGuideEntry>(
  entryId: string,
  field: K,
  value: FieldGuideEntry[K],
) => void

type GuideViewProps = {
  uiText: UiText
  categories: CategoryMeta[]
  fieldGuideEntries: FieldGuideEntry[]
  selectedGuideEntry: FieldGuideEntry | null
  chatInput: string
  chatStatus: 'idle' | 'loading' | 'error'
  onSelectGuideEntry: (entryId: string) => void
  onGuideEntryEdit: GuideEntryEditHandler
  onDeleteGuideEntry: (entryId: string) => void
  onDeleteGuideEntries: (entryIds: string[]) => void
  onChatInputChange: (value: string) => void
  onAskObservationQuestion: () => void
}

export function GuideView({
  uiText,
  categories,
  fieldGuideEntries,
  selectedGuideEntry,
  chatInput,
  chatStatus,
  onSelectGuideEntry,
  onGuideEntryEdit,
  onDeleteGuideEntry,
  onDeleteGuideEntries,
  onChatInputChange,
  onAskObservationQuestion,
}: GuideViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set())
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'restore' | 'delete' | 'deleteMultiple'
    title: string
    message: string
  } | null>(null)
  const [isTaxonomyEditing, setIsTaxonomyEditing] = useState(false)
  const [originalTaxonomy, setOriginalTaxonomy] = useState<TaxonomyInfo | null>(null)
  const [initialTaxonomy, setInitialTaxonomy] = useState<TaxonomyInfo | null>(null)
  const [exitingEntry, setExitingEntry] = useState<FieldGuideEntry | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev' | null>(null)
  const scrollPositionRef = useRef(0)

  const filteredEntries = selectedCategory === 'all'
    ? fieldGuideEntries
    : fieldGuideEntries.filter((entry) => entry.categoryId === selectedCategory)

  const currentEntryIndex = selectedGuideEntry
    ? filteredEntries.findIndex((entry) => entry.id === selectedGuideEntry.id)
    : -1

  const hasPrevEntry = currentEntryIndex > 0
  const hasNextEntry = currentEntryIndex < filteredEntries.length - 1

  const handlePrevEntry = () => {
    if (hasPrevEntry) {
      // Start transition: keep current page visible, slide in new page from left
      setExitingEntry(selectedGuideEntry)
      setTransitionDirection('prev')
      onSelectGuideEntry(filteredEntries[currentEntryIndex - 1].id)
      setInitialTaxonomy(filteredEntries[currentEntryIndex - 1].taxonomy)
      setOriginalTaxonomy(null)
      setIsTaxonomyEditing(false)
      
      // Clear exiting page after animation completes
      setTimeout(() => {
        setExitingEntry(null)
        setTransitionDirection(null)
      }, 500)
    }
  }

  const handleNextEntry = () => {
    if (hasNextEntry) {
      // Start transition: keep current page visible, slide in new page from right
      setExitingEntry(selectedGuideEntry)
      setTransitionDirection('next')
      onSelectGuideEntry(filteredEntries[currentEntryIndex + 1].id)
      setInitialTaxonomy(filteredEntries[currentEntryIndex + 1].taxonomy)
      setOriginalTaxonomy(null)
      setIsTaxonomyEditing(false)
      
      // Clear exiting page after animation completes
      setTimeout(() => {
        setExitingEntry(null)
        setTransitionDirection(null)
      }, 500)
    }
  }

  const handleEntryClick = (entryId: string) => {
    onSelectGuideEntry(entryId)
    setIsTaxonomyEditing(false)
    setOriginalTaxonomy(null)
    setInitialTaxonomy(selectedGuideEntry?.taxonomy ?? null)
  }

  const handleEntryDoubleClick = (entryId: string) => {
    scrollPositionRef.current = window.scrollY
    onSelectGuideEntry(entryId)
    setViewMode('detail')
    setIsTaxonomyEditing(false)
    setOriginalTaxonomy(null)
    setInitialTaxonomy(selectedGuideEntry?.taxonomy ?? null)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleResetTaxonomy = () => {
    if (initialTaxonomy && selectedGuideEntry) {
      setConfirmDialog({
        type: 'restore',
        title: uiText.confirmRestoreTitle,
        message: uiText.confirmRestoreMessage,
      })
    }
  }

  const handleBackToList = () => {
    setViewMode('grid')
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' })
    })
  }

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Exit edit mode
      setIsEditMode(false)
      setSelectedEntryIds(new Set())
    } else {
      // Enter edit mode
      setIsEditMode(true)
      setViewMode('grid')
    }
  }

  const handleToggleSelectEntry = (entryId: string) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedEntryIds.size === filteredEntries.length) {
      setSelectedEntryIds(new Set())
    } else {
      setSelectedEntryIds(new Set(filteredEntries.map((e) => e.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedEntryIds.size > 0) {
      setConfirmDialog({
        type: 'deleteMultiple',
        title: uiText.confirmDeleteTitle,
        message: uiText.guideDeleteSelectedConfirm,
      })
    }
  }

  const handleConfirmDialogAction = () => {
    if (!confirmDialog) return

    if (confirmDialog.type === 'restore') {
      if (initialTaxonomy && selectedGuideEntry) {
        onGuideEntryEdit(selectedGuideEntry.id, 'taxonomy', initialTaxonomy)
      }
    } else if (confirmDialog.type === 'delete') {
      if (selectedGuideEntry) {
        onDeleteGuideEntry(selectedGuideEntry.id)
        setViewMode('grid')
      }
    } else if (confirmDialog.type === 'deleteMultiple') {
      onDeleteGuideEntries(Array.from(selectedEntryIds))
      setSelectedEntryIds(new Set())
      setIsEditMode(false)
    }
    setConfirmDialog(null)
  }

  const entryNumberMap = (() => {
    const sortedByCreatedAt = [...fieldGuideEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const map = new Map<string, number>()
    for (let index = 0; index < sortedByCreatedAt.length; index += 1) {
      map.set(sortedByCreatedAt[index].id, index + 1)
    }
    return map
  })()

  const allTabLabel = uiText.navHome === 'Home' ? 'All' : '全て'
  const backLabel = uiText.navHome === 'Home' ? 'Back' : '戻る'
  const selectedEntryNumber = selectedGuideEntry ? entryNumberMap.get(selectedGuideEntry.id) ?? null : null

  // Render page content (without navigation arrows in detail view)
  const renderPageContent = (entry: FieldGuideEntry | null, entryNum: number | undefined) => {
    if (!entry) return null

    return (
      <>
        {viewMode === 'grid' ? (
          <div className="guide-grid-view">
            <header className="guide-book-header">
              <div className="guide-book-title-row">
                <h2 className="guide-book-title">
                  {selectedCategory === 'all' 
                    ? uiText.guideTitle 
                    : categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <div className="guide-header-actions">
                  <button
                    type="button"
                    className="guide-edit-toggle-button"
                    onClick={handleToggleEditMode}
                    title={isEditMode ? uiText.guideEditDone : uiText.guideEdit}
                    aria-label={isEditMode ? uiText.guideEditDone : uiText.guideEdit}
                  >
                    {isEditMode ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    )}
                  </button>
                  <div className="guide-book-stats">
                    <strong>{filteredEntries.length}</strong>
                    <span>{uiText.homeCollectionTotal}</span>
                  </div>
                </div>
              </div>
              {!isEditMode ? (
                <>
                  <p className="guide-book-lead">{uiText.guideCopy}</p>
                  <p className="guide-interaction-hint" style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px' }}>
                    ※ ダブルクリックで詳細を開きます
                  </p>
                </>
              ) : null}
              {isEditMode && (
                <div className="guide-edit-toolbar">
                  <button
                    type="button"
                    className="guide-select-all-button"
                    onClick={handleSelectAll}
                    disabled={filteredEntries.length === 0}
                  >
                    {selectedEntryIds.size === filteredEntries.length && filteredEntries.length > 0
                      ? '選択解除'
                      : uiText.guideSelectAll}
                  </button>
                  <button
                    type="button"
                    className="guide-delete-selected-button"
                    onClick={handleDeleteSelected}
                    disabled={selectedEntryIds.size === 0}
                  >
                    {uiText.guideDeleteSelected} ({selectedEntryIds.size})
                  </button>
                </div>
              )}
            </header>

            {filteredEntries.length === 0 ? (
              <div className="empty-state">
                <p>{uiText.guideEmpty}</p>
              </div>
            ) : (
              <div className="guide-collection-grid">
                {[...filteredEntries].reverse().map((e) => {
                  const displayTitle = e.customTitle || e.approvedName
                  const isSelected = e.id === selectedGuideEntry?.id
                  const num = entryNumberMap.get(e.id)
                  const isChecked = selectedEntryIds.has(e.id)

                  return (
                    <div
                      key={e.id}
                      className={`guide-collection-item-wrapper ${isChecked ? 'is-checked' : ''}`}
                    >
                      {isEditMode && (
                        <label className="guide-checkbox-label">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectEntry(e.id)}
                          />
                        </label>
                      )}
                      <button
                        type="button"
                        className={`guide-collection-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          if (isEditMode) {
                            handleToggleSelectEntry(e.id)
                          } else {
                            handleEntryClick(e.id)
                          }
                        }}
                        onDoubleClick={() => {
                          if (!isEditMode) {
                            handleEntryDoubleClick(e.id)
                          }
                        }}
                      >
                        <div className="item-image-wrapper">
                          <img src={e.imageDataUrl} alt={displayTitle} />
                        </div>
                        {num ? <span className="entry-number-bottom">{`No.${num}`}</span> : null}
                        <div className="item-info">
                          <strong>{displayTitle}</strong>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="guide-detail-view slide-up-fade">
            <button type="button" className="back-button" onClick={handleBackToList}>
              ← {backLabel}
            </button>

            <div className="guide-editor-with-nav">
              <div className="guide-editor">
                <div className="guide-editor-header">
                  <div className="editor-image-container">
                    <img src={entry.imageDataUrl} alt={entry.customTitle || entry.approvedName} />
                  </div>
                  <div className="guide-editor-title-group">
                    {entryNum ? <span className="entry-number-detail">{`No.${entryNum}`}</span> : null}
                    <p className="section-label scientific-name-label">
                      {entry.scientificName || 'Unknown Species'}
                    </p>
                    <h3 className="common-name-heading">{entry.approvedName}</h3>
                  </div>
                  <div className="guide-editor-taxonomy">
                    <div className="taxonomy-header">
                      <p className="section-label">{uiText.taxonomyTitle}</p>
                      <div className="taxonomy-actions">
                        {!isTaxonomyEditing ? (
                          <>
                            <button
                              type="button"
                              className="taxonomy-reset-button"
                              onClick={handleResetTaxonomy}
                              disabled={!initialTaxonomy}
                            >
                              復元
                            </button>
                            <button
                              type="button"
                              className="taxonomy-edit-button"
                              onClick={() => {
                                setIsTaxonomyEditing(true)
                                setOriginalTaxonomy(entry.taxonomy)
                                if (!initialTaxonomy) {
                                  setInitialTaxonomy(entry.taxonomy)
                                }
                              }}
                            >
                              編集
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="taxonomy-cancel-button"
                              onClick={() => {
                                if (originalTaxonomy) {
                                  onGuideEntryEdit(entry.id, 'taxonomy', originalTaxonomy)
                                }
                                setIsTaxonomyEditing(false)
                                setOriginalTaxonomy(null)
                              }}
                            >
                              キャンセル
                            </button>
                            <button
                              type="button"
                              className="taxonomy-save-button"
                              onClick={() => {
                                setIsTaxonomyEditing(false)
                                setOriginalTaxonomy(null)
                              }}
                            >
                              完了
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <dl className="taxonomy-grid">
                      <dt>{uiText.taxonomyKingdom}</dt>
                      <dd><span>{entry.taxonomy?.kingdom || '-'}</span></dd>
                      <dt>{uiText.taxonomyPhylum}</dt>
                      <dd><span>{entry.taxonomy?.phylum || '-'}</span></dd>
                      <dt>{uiText.taxonomyClass}</dt>
                      <dd><span>{entry.taxonomy?.class || '-'}</span></dd>
                      <dt>{uiText.taxonomyOrder}</dt>
                      <dd><span>{entry.taxonomy?.order || '-'}</span></dd>
                      <dt>{uiText.taxonomyFamily}</dt>
                      <dd><span>{entry.taxonomy?.family || '-'}</span></dd>
                    </dl>
                  </div>
                </div>

                <div className="detail-scroll-area">
                  <label className="editor-field">
                    <span>{uiText.editorName}</span>
                    <input
                      value={entry.customTitle}
                      onChange={(event) => onGuideEntryEdit(entry.id, 'customTitle', event.target.value)}
                      placeholder={uiText.editorPlaceholderName}
                    />
                  </label>

                  <label className="editor-field">
                    <span>{uiText.editorNotes}</span>
                    <textarea
                      value={entry.notes}
                      onChange={(event) => onGuideEntryEdit(entry.id, 'notes', event.target.value)}
                      placeholder={uiText.editorPlaceholderNotes}
                      rows={6}
                    />
                  </label>

                  <div className="editor-meta" style={{ marginTop: '24px' }}>
                    <span>{uiText.editorSaved}</span>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => {
                        setConfirmDialog({
                          type: 'delete',
                          title: uiText.confirmDeleteTitle,
                          message: uiText.confirmDeleteMessage,
                        })
                      }}
                    >
                      {uiText.guideDelete}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="question-panel guide-chat-outside">
              <p className="section-label">{uiText.chatTitle}</p>
              <div className="chat-history">
                {entry.chatHistory.length === 0 ? (
                  <div className="question-answer">
                    <p>{uiText.chatEmpty}</p>
                  </div>
                ) : (
                  entry.chatHistory.map((message) => (
                    <article
                      key={message.id}
                      className={message.role === 'user' ? 'chat-bubble is-user' : 'chat-bubble is-assistant'}
                    >
                      <strong>{message.role === 'user' ? 'You' : 'Guide'}</strong>
                      <p>{message.content}</p>
                    </article>
                  ))
                )}
              </div>
              <label className="editor-field">
                <span>{uiText.chatTitle}</span>
                <textarea
                  value={chatInput}
                  onChange={(event) => onChatInputChange(event.target.value)}
                  placeholder={uiText.chatPlaceholder}
                  rows={3}
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={onAskObservationQuestion}
                disabled={!chatInput.trim() || chatStatus === 'loading'}
              >
                {chatStatus === 'loading' ? uiText.chatLoading : uiText.chatSubmit}
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`guide-book-container is-view-${viewMode}`} data-guide-category={selectedCategory}>
      <nav className="guide-tabs" role="tablist">
        <button
          type="button"
          className={`guide-tab guide-tab-all ${selectedCategory === 'all' ? 'is-active' : ''}`}
          onClick={() => {
            setSelectedCategory('all')
            setViewMode('grid')
          }}
          role="tab"
          aria-selected={selectedCategory === 'all'}
        >
          {allTabLabel}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`guide-tab guide-tab-${category.id} ${
              selectedCategory === category.id ? 'is-active' : ''
            }`}
            onClick={() => {
              setSelectedCategory(category.id)
              setViewMode('grid')
            }}
            role="tab"
            aria-selected={selectedCategory === category.id}
          >
            {category.name}
          </button>
        ))}
      </nav>

      {/* Navigation arrows - independent from page animation */}
      {viewMode === 'detail' && selectedGuideEntry && (
        <div className="guide-nav-arrows">
          <button
            type="button"
            className="nav-triangle-button nav-prev"
            onClick={handlePrevEntry}
            disabled={!hasPrevEntry}
            title={hasPrevEntry ? '前の記録' : '前の記録はありません'}
            aria-label="前の記録へ"
          >
          </button>
          <button
            type="button"
            className="nav-triangle-button nav-next"
            onClick={handleNextEntry}
            disabled={!hasNextEntry}
            title={hasNextEntry ? '次の記録' : '次の記録はありません'}
            aria-label="次の記録へ"
          >
          </button>
        </div>
      )}

      {/* Base page - the new content */}
      <div className="guide-book-page">
        <div className="guide-book-inner">
          {selectedGuideEntry && renderPageContent(selectedGuideEntry, selectedEntryNumber || undefined)}
        </div>
      </div>

      {/* Exiting page overlay - slides out while new page is revealed */}
      {exitingEntry && transitionDirection && (
        <div className={`exiting-page-overlay exiting-${transitionDirection}`}>
          {/* Same sheet background as the base page */}
          <div className="guide-book-page" data-guide-category={selectedCategory}>
            <div className="guide-book-inner">
              {renderPageContent(exitingEntry, entryNumberMap.get(exitingEntry.id))}
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-dialog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-header">
              <h4>{confirmDialog.title}</h4>
            </div>
            <div className="confirm-dialog-body">
              <p>{confirmDialog.message}</p>
            </div>
            <div className="confirm-dialog-footer">
              <button
                type="button"
                className="confirm-dialog-cancel"
                onClick={() => setConfirmDialog(null)}
              >
                {uiText.confirmCancel}
              </button>
              <button
                type="button"
                className="confirm-dialog-ok"
                onClick={handleConfirmDialogAction}
              >
                {uiText.confirmOk}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}