import type { UiText } from '../copy'
import type { FieldGuideEntry } from '../types'

type HomeViewProps = {
  uiText: UiText
  approvedCount: number
  rejectedCount: number
  fieldGuideEntriesLength: number
  recentEntry: FieldGuideEntry | null
  visualSources: string[]
  onGoAnalysis: () => void
  onGoGuide: () => void
}

export function HomeView({
  uiText,
  approvedCount,
  rejectedCount,
  fieldGuideEntriesLength,
  recentEntry,
  visualSources,
  onGoAnalysis,
  onGoGuide,
}: HomeViewProps) {
  return (
    <>
      <section className="hero-panel home-hero">
        <div className="hero-copy">
          <p className="eyebrow">{uiText.appName}</p>
          <h1>{uiText.heroTitle}</h1>
          <p className="lead">{uiText.heroLead}</p>
          <div className="hero-actions">
            <button type="button" className="analyze-button" onClick={onGoAnalysis}>
              {uiText.homeActionAnalyze}
            </button>
            <button type="button" className="secondary-button" onClick={onGoGuide}>
              {uiText.homeActionGuide}
            </button>
          </div>
        </div>

        <div className="home-visual">
          <div className="home-visual-stack">
            {visualSources.length > 0 ? (
              visualSources.slice(0, 3).map((source, index) => (
                <img
                  key={`${source}-${index}`}
                  src={source}
                  alt={index === 0 ? 'current observation preview' : 'nature reference'}
                  className={`visual-tile visual-${index + 1}`}
                />
              ))
            ) : (
              <>
                <div className="visual-tile visual-1 is-placeholder" />
                <div className="visual-tile visual-2 is-placeholder" />
                <div className="visual-tile visual-3 is-placeholder" />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="home-feature-grid">
        <div className="panel home-feature-panel">
          <div className="panel-heading">
            <p className="section-label">{uiText.homeFeatureLabel}</p>
            <h2>{uiText.homeReadyTitle}</h2>
          </div>
          <p className="analysis-copy">{uiText.homeReadyCopy}</p>
          <div className="quick-link-grid">
            <button type="button" className="quick-link-card" onClick={onGoAnalysis}>
              <strong>{uiText.homeAnalysisCardTitle}</strong>
              <span>{uiText.homeAnalysisCardBody}</span>
            </button>
            <button type="button" className="quick-link-card" onClick={onGoGuide}>
              <strong>{uiText.homeGuideCardTitle}</strong>
              <span>{uiText.homeGuideCardBody}</span>
            </button>
          </div>
        </div>

        <div className="panel stats-panel">
          <div className="panel-heading">
            <p className="section-label">{uiText.homeCollectionTitle}</p>
            <h2>{uiText.homeCollectionCopy}</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-chip">
              <strong>{fieldGuideEntriesLength}</strong>
              <span>{uiText.homeCollectionTotal}</span>
            </div>
            <div className="stat-chip">
              <strong>{approvedCount}</strong>
              <span>{uiText.homeCollectionApproved}</span>
            </div>
            <div className="stat-chip">
              <strong>{rejectedCount}</strong>
              <span>{uiText.homeCollectionRejected}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-card-grid">
        {uiText.homeFeatureCards.map((feature) => (
          <article key={feature.title} className="panel feature-card">
            <p className="section-label">{uiText.homeFeatureLabel}</p>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="panel recent-panel">
        <div className="analysis-header">
          <div>
            <p className="section-label">{uiText.homeRecentTitle}</p>
            <h2>{recentEntry ? recentEntry.customTitle || recentEntry.approvedName : uiText.homeRecentTitle}</h2>
          </div>
          <p className="analysis-copy">{recentEntry ? uiText.guideCopy : uiText.homeRecentEmpty}</p>
        </div>

        {recentEntry ? (
          <div className="recent-observation">
            <img src={recentEntry.imageDataUrl} alt={recentEntry.customTitle || recentEntry.approvedName} />
            <div className="recent-observation-body">
              <span className="guide-card-status">
                {recentEntry.approval === 'confirmed' ? uiText.guideConfirmed : uiText.guideRejected}
              </span>
              <h3>{recentEntry.customTitle || recentEntry.approvedName}</h3>
              <p>
                {recentEntry.scientificName || recentEntry.approvedName}
                {recentEntry.taxonomy?.family ? ` / ${recentEntry.taxonomy.family}` : ''}
              </p>
              <div className="hero-actions">
                <button type="button" className="secondary-button" onClick={onGoGuide}>
                  {uiText.homeActionGuide}
                </button>
                <button type="button" className="analyze-button" onClick={onGoAnalysis}>
                  {uiText.homeActionAnalyze}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h3>{uiText.homeRecentTitle}</h3>
            <p>{uiText.homeRecentEmpty}</p>
          </div>
        )}
      </section>
    </>
  )
}