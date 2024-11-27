import cn from 'clsx'
import type { Heading } from 'nextra'
import { removeLinks } from 'nextra/remove-links'
import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import { useActiveAnchor, useThemeConfig } from '../contexts'
import { renderComponent } from '../utils'
import { Anchor } from './anchor'
import { BackToTop } from './back-to-top'
import RightPanel from './rightpanel/page'
import ChatInput from './chat-input'
import { Timeline } from './timeline'

export type TOCProps = {
  toc: Heading[]
  filePath: string
}

const linkClassName = cn(
  '_text-xs _font-medium',
  '_text-gray-600 dark:_text-gray-400',
  'hover:_text-gray-800 dark:hover:_text-gray-200',
  'contrast-more:_text-gray-700 contrast-more:dark:_text-gray-100'
)

export function TOC({ toc, filePath }: TOCProps): ReactElement {
  const [activeView, setActiveView] = useState<'toc' | 'chat' | 'timeline'>('toc')
  const activeAnchor = useActiveAnchor()
  const tocRef = useRef<HTMLUListElement>(null)
  const themeConfig = useThemeConfig()

  const hasHeadings = toc.length > 0
  const hasMetaInfo = Boolean(
    themeConfig.feedback.content ||
      themeConfig.editLink.component ||
      themeConfig.toc.extraContent ||
      themeConfig.toc.backToTop
  )

  const activeSlug = Object.entries(activeAnchor).find(
    ([, { isActive }]) => isActive
  )?.[0]
  const activeIndex = toc.findIndex(({ id }) => id === activeSlug)

  useEffect(() => {
    if (!activeSlug) return
    const anchor = tocRef.current?.querySelector(`a[href="#${activeSlug}"]`)

    if (anchor) {
      scrollIntoView(anchor, {
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
        scrollMode: 'if-needed',
        boundary: tocRef.current
      })
    }
  }, [activeSlug])

  return (
    <div
      className={cn(
        hasHeadings && '_grid _grid-rows-[min-content_1fr_min-content]',
        '_sticky _top-[--nextra-navbar-height] _pt-6 _text-sm',
        '_max-h-[calc(100vh-var(--nextra-navbar-height))]'
      )}
    >
      <div className="_flex _gap-2 _mx-4 _mb-4">
        <button
          onClick={() => setActiveView('chat')}
          className={cn(
            '_px-3 _py-1',
            activeView === 'chat'
              ? '_border-b-2 _border-zinc-200 _font-medium'
              : '_text-gray-700 dark:_text-gray-400'
          )}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveView('timeline')}
          className={cn(
            '_px-3 _py-1',
            activeView === 'timeline'
              ? '_border-b-2 _border-zinc-200 _font-medium'
              : '_text-gray-700 dark:_text-gray-400'
          )}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveView('toc')}
          className={cn(
            '_px-3 _py-1',
            activeView === 'toc'
              ? '_border-b-2 _border-zinc-200 _font-medium'
              : '_text-gray-700 dark:_text-gray-400'
          )}
        >
          Table of Contents
        </button>
      </div>

      {activeView === 'toc' ? (
        <>
          {hasHeadings && (
            <>
              <p
                className={cn(
                  '_mx-4', // use margin instead padding to not have shadow on scrollbar
                  '_font-semibold _tracking-tight',
                  '_pb-2 _shadow-[0_12px_16px_rgb(var(--nextra-bg))] contrast-more:_shadow-none _z-[1]'
                )}
              >
                {renderComponent(themeConfig.toc.title)}
              </p>
              <ul
                ref={tocRef}
                className={cn(
                  '_px-4 nextra-scrollbar _overscroll-y-contain _overflow-y-auto _hyphens-auto',
                  '_py-1.5' // for title/footer shadow
                )}
              >
                {toc.map(({ id, value, depth }) => (
                  <li className="_my-2 _scroll-my-6 _scroll-py-6" key={id}>
                    <a
                      href={`#${id}`}
                      className={cn(
                        'nextra-focus',
                        {
                          2: '_font-semibold',
                          3: '_ms-4',
                          4: '_ms-8',
                          5: '_ms-12',
                          6: '_ms-16'
                        }[depth],
                        '_block _transition-colors _subpixel-antialiased',
                        activeAnchor[id]?.isActive
                          ? '_text-primary-600 contrast-more:!_text-primary-600'
                          : '_text-gray-500 hover:_text-gray-900 dark:_text-gray-400 dark:hover:_text-gray-300',
                        'contrast-more:_text-gray-900 contrast-more:_underline contrast-more:dark:_text-gray-50 _break-words'
                      )}
                    >
                      {removeLinks(value)}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {hasMetaInfo && (
            <div
              className={cn(
                hasHeadings && 'nextra-toc-footer _pt-4',
                '_flex _flex-col _items-start _gap-2 _pb-4',
                '_mx-4' // for border top width
              )}
            >
              <span className="_text-[8px] ">VISIBL SEMICONDUCTORS<sup>TM</sup></span>
              {/* {themeConfig.feedback.content ? (
                <Anchor
                  className={linkClassName}
                  href={themeConfig.feedback.useLink()}
                  newWindow
                >
                  {renderComponent(themeConfig.feedback.content)}
                </Anchor>
              ) : null} */}

              {/* {renderComponent(themeConfig.editLink.component, {
                filePath,
                className: linkClassName,
                children: renderComponent(themeConfig.editLink.content)
              })} */}

              {/* {renderComponent(themeConfig.toc.extraContent)} */}

              {themeConfig.toc.backToTop && (
                <BackToTop className={linkClassName} hidden={activeIndex < 2}>
                  {renderComponent(themeConfig.toc.backToTop)}
                </BackToTop>
              )}
            </div>
          )}
        </>
      ) : activeView === 'chat' ? (
        <div className="">
          <div className="">
            <ChatInput />
          </div>
        </div>
      ) : (
        <Timeline filePath={filePath} />
      )}
    </div>
  )
}
