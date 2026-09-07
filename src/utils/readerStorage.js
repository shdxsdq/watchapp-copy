import storage from '@blueos.storage.storage'

const STATE_KEY = 'watchreader.state.v1'
const CONTENT_VERSION = 2
let cachedState = null

function createDefaultState() {
  return {
    favorites: {},
    progress: {},
    scrollProgress: {},
    contentVersion: CONTENT_VERSION,
    deletedArticles: {},
    importedArticle: null,
    fontSize: '30',
    lineSpacing: '16',
    fontWeight: 'normal',
    textAlign: 'left',
    textColor: 'warm'
  }
}

function loadReaderState() {
  if (cachedState) {
    return cachedState
  }
  const defaultState = createDefaultState()

  try {
    const savedValue = storage.getSync({ key: STATE_KEY })
    if (typeof savedValue !== 'string' || savedValue.length === 0) {
      cachedState = defaultState
      return cachedState
    }

    const savedState = JSON.parse(savedValue)
    const fontSizeMap = { small: '26', medium: '30', large: '36' }
    const lineSpacingMap = { compact: '14', normal: '16', relaxed: '18' }
    cachedState = {
      favorites: savedState.favorites || {},
      progress:
        savedState.contentVersion === CONTENT_VERSION
          ? (savedState.progress || {})
          : {},
      contentVersion: CONTENT_VERSION,
      scrollProgress:
        savedState.contentVersion === CONTENT_VERSION
          ? (savedState.scrollProgress || {})
          : {},
      deletedArticles: savedState.deletedArticles || {},
      importedArticle: savedState.importedArticle || null,
      fontSize: fontSizeMap[savedState.fontSize] || savedState.fontSize || '30',
      lineSpacing:
        lineSpacingMap[savedState.lineSpacing] || savedState.lineSpacing || '16',
      fontWeight: savedState.fontWeight || 'normal',
      textAlign: savedState.textAlign || 'left',
      textColor: savedState.textColor || 'warm'
    }
    return cachedState
  } catch (error) {
    console.warn('读取阅读状态失败，将使用默认状态', error)
    cachedState = defaultState
    return cachedState
  }
}

function saveReaderState(state) {
  cachedState = state
  storage.set({
    key: STATE_KEY,
    value: JSON.stringify(state),
    fail(data, code) {
      console.warn('保存阅读状态失败', data, code)
    }
  })
}

export { loadReaderState, saveReaderState }
