import { useEffect, useState } from 'react'
import type { UiText } from '../copy'
import type { LanguageId, PageId } from '../types'

type TopBarProps = {
  uiText: UiText
  currentPage: PageId
  language: LanguageId
  onNavigate: (page: PageId) => void
  onLanguageChange: (language: LanguageId) => void
}

export function TopBar({ uiText, currentPage, language, onNavigate, onLanguageChange }: TopBarProps) {
  const [scrollState, setScrollState] = useState<'resting' | 'hidden' | 'peek'>('resting')
  const appIconSrc = `${import.meta.env.BASE_URL}Name_Nature_icon.png`

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let previousScrollY = window.scrollY

    const handleScroll = () => {
      const nextScrollY = window.scrollY

      if (nextScrollY <= 8) {
        setScrollState('resting')
        previousScrollY = nextScrollY
        return
      }

      if (nextScrollY > previousScrollY + 6) {
        setScrollState('hidden')
      } else if (nextScrollY < previousScrollY - 6) {
        setScrollState('peek')
      }

      previousScrollY = nextScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const navigationItems: Array<{ id: PageId; label: string }> = [
    { id: 'home', label: uiText.navHome },
    { id: 'analysis', label: uiText.navAnalyze },
    { id: 'guide', label: uiText.navGuide },
  ]

  return (
    <header className={`topbar panel topbar-${scrollState} ${currentPage === 'home' ? 'topbar-home' : ''}`}>
      <div className="topbar-brand">
        <img className="topbar-icon" src={appIconSrc} alt={`${uiText.appName} icon`} />
        <div className="topbar-brand-copy">
          <p className="eyebrow">{uiText.appName}</p>
        </div>
      </div>
      <nav className="topbar-nav" aria-label="Primary">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={currentPage === item.id ? 'nav-button is-active' : 'nav-button'}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="language-switch" role="group" aria-label={uiText.languageLabel}>
        <span>{uiText.languageLabel}</span>
        <div className="language-knob">
          {(['ja', 'en'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={language === option ? 'language-option is-active' : 'language-option'}
              onClick={() => onLanguageChange(option)}
            >
              {uiText.languages[option]}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}