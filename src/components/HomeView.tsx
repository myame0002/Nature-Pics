import { useEffect, useRef } from 'react'
import type { UiText } from '../copy'
import type { FieldGuideEntry } from '../types'

type HomeViewProps = {
  uiText: UiText
  approvedCount: number
  rejectedCount: number
  fieldGuideEntriesLength: number
  recentEntry: FieldGuideEntry | null
  onGoAnalysis: () => void
  onGoGuide: () => void
}

export function HomeView({
  uiText,
  approvedCount,
  rejectedCount,
  fieldGuideEntriesLength,
  recentEntry,
  onGoAnalysis,
  onGoGuide,
}: HomeViewProps) {
  const steps = [
    { title: uiText.homeStep1Title, desc: uiText.homeStep1Desc },
    { title: uiText.homeStep2Title, desc: uiText.homeStep2Desc },
    { title: uiText.homeStep3Title, desc: uiText.homeStep3Desc },
  ]

  // Intersection Observer for scroll animations
  const observerRef = useRef<IntersectionObserver | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const recentRef = useRef<HTMLDivElement>(null)
  const visual1Ref = useRef<HTMLImageElement>(null)
  const visual2Ref = useRef<HTMLImageElement>(null)
  const stepCardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // メインセクションの要素
    const elements = ([
      titleRef.current,
      heroRef.current,
      stepsRef.current,
      statsRef.current,
      recentRef.current,
    ] as const).filter(
      (el): el is HTMLDivElement => el !== null
    )

    // IntersectionObserverの作成
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            // 一度表示されたら監視を解除
            observerRef.current?.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -30px 0px',
      }
    )

    // メインセクションに遅延時間を設定（200msずつ）
    elements.forEach((el, index) => {
      el.classList.add('fade-in-up')
      el.style.transitionDelay = `${index * 200}ms`
      if (observerRef.current) {
        observerRef.current.observe(el)
      }
    })

    // 画像のフェードイン（ヒーローパネル内）
    const visualElements = [visual1Ref.current, visual2Ref.current].filter(
      (el): el is HTMLImageElement => el !== null
    )
    visualElements.forEach((el, index) => {
      el.classList.add('fade-in-up')
      el.style.transitionDelay = `${index * 300}ms`
      if (observerRef.current) {
        observerRef.current.observe(el)
      }
    })

    // ステップカードのフェードイン（123）
    const stepCards = stepCardRefs.current.filter(
      (el): el is HTMLDivElement => el !== null
    )
    stepCards.forEach((el, index) => {
      el.classList.add('fade-in-up')
      el.style.transitionDelay = `${index * 150}ms`
      if (observerRef.current) {
        observerRef.current.observe(el)
      }
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  // 落ち葉の数を設定
  const leafCount = 12

  return (
    <>
      {/* Falling Leaves Background */}
      <div className="home-falling-leaves" aria-hidden="true">
        {Array.from({ length: leafCount }).map((_, i) => (
          <div
            key={i}
            className="home-leaf"
            style={{
              left: `${(i + 1) * (100 / (leafCount + 1))}%`,
              animationDuration: `${15 + Math.random() * 10}s`,
              animationDelay: `${-Math.random() * 15}s`,
              transform: `scale(${0.6 + Math.random() * 0.8})`,
            }}
          />
        ))}
      </div>

      {/* Title Section - app name at top-left, tagline below */}
      <div ref={titleRef} className="fade-in-up">
        <section className="home-title-section">
          <h1 className="home-app-name">{uiText.appName}</h1>
          <p className="home-tagline">{uiText.appTagline}</p>
        </section>
      </div>

      {/* Hero Panel - with decorative images */}
      <div ref={heroRef} className="fade-in-up">
        <section className="hero-panel home-hero">
          <div className="hero-copy">
            <h2>{uiText.heroTitle}</h2>
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

          {/* Decorative visual section with nature images */}
          <div className="home-visual">
            <div className="home-visual-stack">
              <img
                ref={visual1Ref}
                src={`${import.meta.env.BASE_URL}enaga_free.avif`}
                alt="Flower example"
                className="visual-tile visual-1"
              />
              <img
                ref={visual2Ref}
                src={`${import.meta.env.BASE_URL}ooinunofuguri_free.jpeg`}
                alt="Bird example"
                className="visual-tile visual-2"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Steps Section - 3-step process */}
      <div ref={stepsRef} className="fade-in-up">
        <section className="home-steps-section">
          <p className="section-label home-steps-label">{uiText.homeStepsLabel}</p>
          <div className="home-steps-grid">
            {steps.map((step, index) => (
              <div
                key={index}
                ref={(el) => { stepCardRefs.current[index] = el }}
                className="panel home-step-card"
              >
                <span className="step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          {/* CTA Button after steps */}
          <div className="home-steps-cta">
            <button type="button" className="analyze-button home-cta-button" onClick={onGoAnalysis}>
              {uiText.homeActionAnalyze}
            </button>
          </div>
        </section>
      </div>

      {/* Stats Section - Quick overview of collection */}
      {fieldGuideEntriesLength > 0 && (
        <div ref={statsRef} className="fade-in-up">
          <section className="panel stats-panel home-stats">
            <div className="panel-heading">
              <p className="section-label">{uiText.homeCollectionTitle}</p>
            </div>
            <div className="stats-grid">
              <button type="button" className="stat-chip" onClick={onGoGuide}>
                <strong>{fieldGuideEntriesLength}</strong>
                <span>{uiText.homeCollectionTotal}</span>
              </button>
              <button type="button" className="stat-chip" onClick={onGoGuide}>
                <strong>{approvedCount}</strong>
                <span>{uiText.homeCollectionApproved}</span>
              </button>
              <button type="button" className="stat-chip" onClick={onGoGuide}>
                <strong>{rejectedCount}</strong>
                <span>{uiText.homeCollectionRejected}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Recent Observation Section */}
      {recentEntry && (
        <div ref={recentRef} className="fade-in-up">
          <section className="panel recent-panel">
            <p className="section-label home-recent-label">{uiText.homeRecentTitle}</p>
            <h2 className="home-recent-title">{recentEntry.customTitle || recentEntry.approvedName}</h2>

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
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Footer with contact links */}
      <footer className="home-footer">
        <div className="home-footer-links">
          <a
            href="mailto:myame.official@gmail.com"
            className="home-footer-link"
            aria-label="Email: myame.official@gmail.com"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <span>Gmail</span>
          </a>
          <a
            href="https://note.com/myame_pic0002"
            target="_blank"
            rel="noopener noreferrer"
            className="home-footer-link"
            aria-label="note: https://note.com/myame_pic0002"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>note</span>
          </a>
        </div>
        <p className="home-footer-copyright">© {new Date().getFullYear()} Nature-Pics</p>
      </footer>
    </>
  )
}
