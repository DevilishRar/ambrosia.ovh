
(() => {
  'use strict'

  if (typeof window === 'undefined' || window.AIFX) return

  const currentScript = document.currentScript
  if (!currentScript) return

  const scriptSrc = currentScript.src
  const baseUrl = scriptSrc.replace(/\/runtime\/v1\.js.*$/, '')
  const queryString = scriptSrc.includes('?')
    ? '?' + scriptSrc.slice(scriptSrc.indexOf('?'))
    : ''

  let licenseKey = ''
  const keyAttr = currentScript.getAttribute('data-aifx-key')
  if (keyAttr) {
    licenseKey = keyAttr
  } else {
    const urlParams = new URLSearchParams(queryString.replace('?', ''))
    licenseKey = urlParams.get('key') || ''
  }

  const effectRegistry = new Map()
  const loadingEffects = new Set()
  const errorEffects = new WeakMap()

  function initEffects() {
    const elements = document.querySelectorAll('[data-aifx]')
    elements.forEach(el => {
      const slug = el.getAttribute('data-aifx')
      if (slug && !effectRegistry.has(slug) && !loadingEffects.has(slug)) {
        loadEffect(slug, el)
      }
    })
  }

  function loadEffect(slug, hostElement) {
    loadingEffects.add(slug)
    setTimeout(() => loadingEffects.delete(slug), 100)
  }

  function mountEffect(slug, hostElement) {
    const computed = window.getComputedStyle(hostElement)
    if (computed.position === 'static') {
      hostElement.style.position = 'relative'
    }

    hostElement.style.isolation = 'isolate'

    return {
      slug,
      host: hostElement,
      destroy: () => {
        try {
          if (hostEffect && typeof hostEffect.destroy === 'function') {
            hostEffect.destroy()
          }
          effectRegistry.delete(slug)
          hostElement.style.isolation = ''
          hostElement.style.position = ''
        } catch (e) {
          console.warn('[AIFX] destroy error:', e)
        }
      }
    }
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.target.hasAttribute('data-aifx')) {
        const el = mutation.target
        const slug = el.getAttribute('data-aifx')
        if (slug && !effectRegistry.has(slug) && !loadingEffects.has(slug)) {
          loadEffect(slug, el)
        }
      } else {
        const newNodes = Array.from(mutation.addedNodes).filter(n => n.nodeType === 1)
        newNodes.forEach(el => {
          if (el.hasAttribute('data-aifx')) {
            const slug = el.getAttribute('data-aifx')
            if (slug && !effectRegistry.has(slug) && !loadingEffects.has(slug)) {
              loadEffect(slug, el)
            }
          }
        })
      }
    })
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true
      })
      initEffects()
    })
  } else {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true
    })
    initEffects()
  }

  window.AIFX = {
    register: (slug, factory) => {
      if (typeof factory === 'function') {
        effectRegistry.set(slug, factory())
      }
    },
    rescan: () => {
      initEffects()
    }
  }
})()