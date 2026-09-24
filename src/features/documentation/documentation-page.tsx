import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, NavLink, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '@/shared/components/async-state'
import {
  DOCUMENTATION_ENTRIES,
  DOCUMENTATION_SECTIONS,
  getDocumentationEntry,
  getDocumentationUrl,
  highlightSearchText,
  searchDocumentationEntries,
  type DocumentationEntry,
  type DocumentationSearchResult,
} from './documentation-data'
import { renderMarkdown } from './markdown'

function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSearchText(text, query).map((part, index) =>
        part.highlighted ? (
          <mark key={`${part.text}-${index}`} className="rounded bg-amber-100 px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  )
}

function DocumentationNav({
  mobile = false,
  query,
  onQueryChange,
  contentBySlug,
  isSearchIndexLoading,
}: {
  mobile?: boolean
  query: string
  onQueryChange: (query: string) => void
  contentBySlug: Record<string, string>
  isSearchIndexLoading: boolean
}) {
  const filteredSections = useMemo(
    () =>
      DOCUMENTATION_SECTIONS.map((section) => ({
        ...section,
        entries: searchDocumentationEntries(section.entries, query, contentBySlug),
      })).filter((section) => section.entries.length > 0),
    [contentBySlug, query],
  )
  const resultCount = filteredSections.reduce((count, section) => count + section.entries.length, 0)

  return (
    <div className={mobile ? 'pt-3' : ''}>
      <div className="mb-5 border-b border-slate-200 px-3 pb-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
            <BookOpen size={16} />
          </span>
          <div className="min-w-0">
            <strong className="block text-sm font-bold tracking-tight text-slate-800">
              Documentation
            </strong>
            <span className="block text-[0.7rem] text-slate-400">
              {query ? `${resultCount} matches` : `${DOCUMENTATION_ENTRIES.length} articles`}
            </span>
          </div>
        </div>
        <label className="relative block">
          <Search
            aria-hidden="true"
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <span className="sr-only">Search documentation</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search documentation..."
            aria-label="Search documentation"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-9 text-xs text-slate-700 transition-colors outline-none placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-3 focus:ring-violet-100"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear documentation search"
              onClick={() => onQueryChange('')}
              className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <nav aria-label="Documentation sections">
        {filteredSections.map((section) => (
          <section key={section.id} className="mb-6 last:mb-0">
            <h2 className="mb-2 flex items-center justify-between px-3 text-[0.68rem] font-bold tracking-[0.16em] text-slate-400 uppercase">
              <span>{section.label}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.62rem] tracking-normal text-slate-400">
                {section.entries.length}
              </span>
            </h2>
            <div className="grid gap-0.5">
              {section.entries.map((result: DocumentationSearchResult) => {
                const item = result.entry

                return (
                  <NavLink
                    key={item.slug}
                    to={`/documentation/${item.slug}`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                    className={({ isActive }) =>
                      `group flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-[0.8rem] leading-tight transition-colors ${
                        isActive
                          ? 'bg-violet-100 font-semibold text-violet-800'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      } ${isActive ? '[&>span:first-child]:bg-violet-500' : ''}`
                    }
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 transition-colors" />
                    <span className="min-w-0">
                      <span className="block truncate">
                        <HighlightedText text={item.title} query={query} />
                      </span>
                      {result.snippet && (
                        <span className="mt-1 block truncate text-[0.68rem] font-normal text-slate-400">
                          <HighlightedText text={result.snippet} query={query} />
                        </span>
                      )}
                    </span>
                  </NavLink>
                )
              })}
            </div>
          </section>
        ))}
        {query && isSearchIndexLoading && (
          <p className="px-3 py-5 text-xs leading-relaxed text-slate-500" role="status">
            Searching documentation contents...
          </p>
        )}
        {filteredSections.length === 0 && !isSearchIndexLoading && (
          <p className="px-3 py-5 text-xs leading-relaxed text-slate-500" role="status">
            No documentation matches "{query}".
          </p>
        )}
      </nav>
    </div>
  )
}

function DocumentPager({ entry }: { entry: DocumentationEntry }) {
  const index = DOCUMENTATION_ENTRIES.findIndex((item) => item.slug === entry.slug)
  const previous = index > 0 ? DOCUMENTATION_ENTRIES[index - 1] : undefined
  const next =
    index < DOCUMENTATION_ENTRIES.length - 1 ? DOCUMENTATION_ENTRIES[index + 1] : undefined

  return (
    <nav
      aria-label="Documentation pagination"
      className="mt-14 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          to={`/documentation/${previous.slug}`}
          className="group rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-violet-200 hover:bg-violet-50"
        >
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowLeft size={14} /> Previous
          </span>
          <strong className="mt-2 block text-sm text-slate-700 group-hover:text-violet-800">
            {previous.title}
          </strong>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          to={`/documentation/${next.slug}`}
          className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-violet-200 hover:bg-violet-50 sm:text-right"
        >
          <span className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
            Next <ArrowRight size={14} />
          </span>
          <strong className="mt-2 block text-sm text-slate-700 group-hover:text-violet-800">
            {next.title}
          </strong>
        </Link>
      )}
    </nav>
  )
}

let mermaidRenderSequence = 0

function DocumentationArticle({ html }: { html: string }) {
  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false

    const showFallback = (container: HTMLElement, source: string) => {
      const fallback = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = source
      fallback.append(code)
      container.replaceChildren(fallback)
      container.dataset.mermaidError = 'true'
    }

    const renderDiagrams = async () => {
      const containers = Array.from(
        articleRef.current?.querySelectorAll<HTMLElement>('[data-mermaid]') ?? [],
      )
      if (containers.length === 0) return

      const sources = containers.map((container) => container.textContent ?? '')
      let mermaid: typeof import('mermaid').default
      try {
        mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            fontFamily: 'Plus Jakarta Sans Variable, sans-serif',
            primaryColor: '#dbeafe',
            primaryTextColor: '#1e3a8a',
            primaryBorderColor: '#2563eb',
            lineColor: '#64748b',
          },
        })
      } catch {
        if (!cancelled)
          containers.forEach((container, index) => showFallback(container, sources[index]))
        return
      }

      for (const [index, container] of containers.entries()) {
        const source = sources[index]
        try {
          const { svg, bindFunctions } = await mermaid.render(
            `documentation-mermaid-${++mermaidRenderSequence}`,
            source,
          )
          if (cancelled) return
          container.innerHTML = svg
          bindFunctions?.(container)
        } catch {
          if (cancelled) return
          showFallback(container, source)
        }
      }
    }

    void renderDiagrams()
    return () => {
      cancelled = true
    }
  }, [html])

  return (
    <article
      ref={articleRef}
      className="documentation-article animate-slide-up"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function DocumentationPage() {
  const { slug } = useParams<{ slug: string }>()
  const entry = getDocumentationEntry(slug)
  const fallbackEntry = getDocumentationEntry('00-index')!
  const activeEntry = entry ?? fallbackEntry
  const [documentationQuery, setDocumentationQuery] = useState('')
  const [documentationContentBySlug, setDocumentationContentBySlug] = useState<
    Record<string, string>
  >({})
  const [isSearchIndexLoading, setIsSearchIndexLoading] = useState(false)
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; markdown: string }
    | { status: 'error'; message: string }
  >({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setIsSearchIndexLoading(true)

    Promise.all(
      DOCUMENTATION_ENTRIES.map(async (documentationEntry) => {
        try {
          const response = await fetch(getDocumentationUrl(documentationEntry))
          return [documentationEntry.slug, response.ok ? await response.text() : ''] as const
        } catch {
          return [documentationEntry.slug, ''] as const
        }
      }),
    ).then((entries) => {
      if (cancelled) return
      setDocumentationContentBySlug(Object.fromEntries(entries))
      setIsSearchIndexLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    window.scrollTo({ top: 0, behavior: 'instant' })

    fetch(getDocumentationUrl(activeEntry))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.text()
      })
      .then((markdown) => {
        if (!cancelled) setState({ status: 'ready', markdown })
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'Dokumen tidak dapat dimuat dari folder public/documentation.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeEntry])

  if (!entry) return <Navigate to="/documentation/00-index" replace />

  return (
    <div className="documentation-page bg-slate-50">
      <details className="mb-5 rounded-lg border border-slate-200 bg-white p-3 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            <BookOpen size={16} className="text-violet-600" />
            Browse documentation
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </summary>
        <DocumentationNav
          mobile
          query={documentationQuery}
          onQueryChange={setDocumentationQuery}
          contentBySlug={documentationContentBySlug}
          isSearchIndexLoading={isSearchIndexLoading}
        />
      </details>

      <div className="grid w-full min-w-0 items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block">
          <DocumentationNav
            query={documentationQuery}
            onQueryChange={setDocumentationQuery}
            contentBySlug={documentationContentBySlug}
            isSearchIndexLoading={isSearchIndexLoading}
          />
        </aside>

        <main className="w-full min-w-0">
          {state.status === 'loading' && (
            <LoadingState label="Loading documentation" variant="canvas" />
          )}
          {state.status === 'error' && <ErrorState message={state.message} />}
          {state.status === 'ready' && (
            <DocumentationArticle html={renderMarkdown(state.markdown)} />
          )}
          <DocumentPager entry={entry} />
        </main>
      </div>
    </div>
  )
}
