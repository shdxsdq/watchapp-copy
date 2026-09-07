import interconnect from '@blueos.bluexlink.connectionManager'
import file from '@blueos.storage.file'
import {
  PHONE_APP_PACKAGE,
  PHONE_APP_FINGERPRINT,
  hasPhoneAppConfiguration
} from '../config/blueXlink.js'
import {
  loadReaderState,
  saveReaderState
} from './readerStorage.js'

const IMPORTED_ARTICLE_ID = 'imported-txt'
const IMPORTED_FILE_URI = 'internal://files/watchreader-imported.txt'

let connection = null
let transferStatus = '需要手机配套端'
const importListeners = []

function isTxtFile(fileName) {
  return typeof fileName === 'string' && /\.txt$/i.test(fileName)
}

function titleFromFileName(fileName) {
  const cleanName = String(fileName || '导入的文章').replace(/\.txt$/i, '')
  return cleanName.length > 28 ? cleanName.slice(0, 28) : cleanName
}

function notifyImport(metadata) {
  for (let index = 0; index < importListeners.length; index += 1) {
    importListeners[index](metadata)
  }
}

function saveImportedMetadata(fileName, uri) {
  const state = loadReaderState()
  const metadata = {
    id: IMPORTED_ARTICLE_ID,
    title: titleFromFileName(fileName),
    summary: '从手机传入的离线 TXT 文档',
    readTime: '离线文本',
    fileName,
    fileUri: uri,
    importedAt: Date.now()
  }

  state.importedArticle = metadata
  state.progress[IMPORTED_ARTICLE_ID] = 0
  delete state.scrollProgress[IMPORTED_ARTICLE_ID]
  state.favorites[IMPORTED_ARTICLE_ID] = false
  saveReaderState(state)
  transferStatus = 'TXT 已保存到书架'
  notifyImport(metadata)
}

function acceptIncomingFile(message) {
  if (!message || !message.isFileType || !isTxtFile(message.fileName)) {
    transferStatus = '仅支持 .txt 文件'
    return
  }

  const copyIncomingFile = () => file.copy({
    srcUri: message.fileUri,
    dstUri: IMPORTED_FILE_URI,
    success(uri) {
      saveImportedMetadata(message.fileName, uri || IMPORTED_FILE_URI)
    },
    fail(data, code) {
      transferStatus = `TXT 保存失败（${code}）`
      console.warn('保存传入的 TXT 失败', data, code)
    }
  })

  file.access({
    uri: IMPORTED_FILE_URI,
    success() {
      file.delete({
        uri: IMPORTED_FILE_URI,
        complete: copyIncomingFile
      })
    },
    fail: copyIncomingFile
  })
}

function startTxtReceiver() {
  if (connection) {
    return true
  }

  if (!hasPhoneAppConfiguration()) {
    transferStatus = '需要手机配套端'
    return false
  }

  connection = interconnect.instance({
    package: PHONE_APP_PACKAGE,
    fingerprint: PHONE_APP_FINGERPRINT
  })

  connection.onOpen = () => {
    transferStatus = '已连接，等待 TXT'
  }
  connection.onClose = () => {
    transferStatus = '手机连接已断开'
  }
  connection.onError = (data, code) => {
    transferStatus = `连接失败（${code}）`
    console.warn('BlueXlink 连接失败', data, code)
  }
  connection.onMessage = acceptIncomingFile
  transferStatus = '正在连接手机'
  return true
}

function subscribeTxtImport(listener) {
  if (typeof listener === 'function') {
    importListeners.push(listener)
  }
}

function getTxtTransferStatus() {
  return transferStatus
}

function getImportedArticleMetadata() {
  return loadReaderState().importedArticle
}

function deleteImportedArticle(callbacks) {
  const state = loadReaderState()
  const metadata = state.importedArticle

  const clearMetadata = () => {
    state.importedArticle = null
    delete state.progress[IMPORTED_ARTICLE_ID]
    delete state.scrollProgress[IMPORTED_ARTICLE_ID]
    delete state.favorites[IMPORTED_ARTICLE_ID]
    saveReaderState(state)
    transferStatus = '等待接收 TXT'
    if (callbacks && callbacks.success) {
      callbacks.success()
    }
  }

  if (!metadata || !metadata.fileUri) {
    clearMetadata()
    return
  }

  file.delete({
    uri: metadata.fileUri,
    success: clearMetadata,
    fail(data, code) {
      console.warn('删除导入的 TXT 失败', data, code)
      if (callbacks && callbacks.fail) {
        callbacks.fail(data, code)
      }
    }
  })
}

function splitTxtIntoParagraphs(text) {
  const normalized = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()

  if (!normalized) {
    return ['这个 TXT 文件没有可显示的文字。']
  }

  let paragraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n+/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 0)

  if (paragraphs.length === 1 && normalized.indexOf('\n') >= 0) {
    paragraphs = normalized
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
  }

  const readableParagraphs = []
  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index]
    if (paragraph.length <= 260) {
      readableParagraphs.push(paragraph)
      continue
    }

    for (let offset = 0; offset < paragraph.length; offset += 260) {
      readableParagraphs.push(paragraph.slice(offset, offset + 260))
    }
  }

  return readableParagraphs
}

function readImportedArticle(metadata, callbacks) {
  if (!metadata || !metadata.fileUri) {
    if (callbacks && callbacks.fail) {
      callbacks.fail('没有已导入的 TXT', -1)
    }
    return
  }

  file.readText({
    uri: metadata.fileUri,
    success(data) {
      const article = {
        id: IMPORTED_ARTICLE_ID,
        title: metadata.title,
        summary: metadata.summary,
        readTime: metadata.readTime,
        paragraphs: splitTxtIntoParagraphs(data.text)
      }
      if (callbacks && callbacks.success) {
        callbacks.success(article)
      }
    },
    fail(data, code) {
      if (callbacks && callbacks.fail) {
        callbacks.fail(data, code)
      }
    }
  })
}

export {
  IMPORTED_ARTICLE_ID,
  deleteImportedArticle,
  getImportedArticleMetadata,
  getTxtTransferStatus,
  readImportedArticle,
  splitTxtIntoParagraphs,
  startTxtReceiver,
  subscribeTxtImport
}
