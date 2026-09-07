// Exercise the page controller without requiring the watch runtime.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const source = fs.readFileSync('src/pages/Reader/index.ux', 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/import[\s\S]*?from\s+'[^']+'\s*/g, '')
  .replace('export default', 'controller =')
const sandbox = { IMPORTED_ARTICLE_ID: 'imported-txt', saveReaderState() {} }
vm.runInNewContext(source, sandbox)

function reader(height = 450, contentHeight = 2400) {
  const page = { ...sandbox.controller, ...structuredClone(sandbox.controller.data) }
  page.articleId = 'book'
  page.article.paragraphs = ['one', 'two', 'three']
  page.pageVisible = page.positionReady = true
  const rectangles = {
    readerScroll: { left: 0, width: 390, height },
    readerContent: { top: -page.currentScrollY, height: contentHeight },
    'paragraph-2': { top: 920 }
  }
  page.$element = id => rectangles[id] && ({
    getBoundingClientRect({ success }) { success(rectangles[id]) },
    getScrollRect({ success }) { success({ height: contentHeight }) }
  })
  return page
}

const page = reader()
page.turnPage(320)
assert.equal(page.scrollTop, 354, 'right tap moves one viewport minus two lines')
page.turnPage(30)
assert.equal(page.scrollTop, 0, 'left tap returns to the previous position')
page.turnPage(30)
assert.equal(page.scrollTop, 0, 'cannot move above the beginning')
page.onReaderScroll({ scrollY: 700 })
page.turnPage(320)
assert.equal(page.scrollTop, 1054, 'tap starts from the actual swipe/crown position')
page.onReaderScroll({ scrollY: 1900 })
page.turnPage(320)
assert.equal(page.scrollTop, 1950, 'clamps to the end')
page.turnPage(320)
assert.equal(page.scrollTop, 1950, 'repeated end tap stays at the end')
page.onReaderTouchStart({ touches: [{ clientX: 300, clientY: 100 }] })
page.onReaderTouchMove({ touches: [{ clientX: 300, clientY: 130 }] })
page.onReaderTouchEnd()
assert.equal(page.scrollTop, 1950, 'swipe does not also trigger tap paging')
page.onReaderTouchStart({ touches: [{ clientX: 20, clientY: 100 }] })
page.onReaderTouchCancel()
page.onReaderTouchEnd()
assert.equal(page.scrollTop, 1950, 'cancelled gesture does not page')
const short = reader(450, 120)
short.turnPage(320)
assert.equal(short.scrollTop, 0, 'short article remains at the beginning')
const large = reader(300)
large.readerState.fontSize = '45'
large.readerState.lineSpacing = '24'
large.turnPage(320)
assert.equal(large.scrollTop, 150, 'large font still makes forward progress')
const restored = reader()
restored.readerState.scrollProgress.book = 615
restored.restoreReadingPosition()
assert.equal(restored.scrollTop, 615, 'restores exact saved offset')
restored.onReaderScroll({ scrollY: 800 })
restored.onHide()
assert.equal(restored.readerState.scrollProgress.book, 800, 'saves manual scroll on exit')
const legacy = reader()
legacy.currentParagraphIndex = 2
legacy.restoreReadingPosition()
assert.equal(legacy.scrollTop, 920, 'migrates an old paragraph bookmark')
const loading = reader()
loading.articleId = 'imported-txt'
loading.importLoading = true
loading.positionReady = false
loading.readerState.scrollProgress['imported-txt'] = 800
loading.restoreReadingPosition()
loading.persistReadingPosition()
assert.equal(loading.scrollTop, 0)
assert.equal(loading.readerState.scrollProgress['imported-txt'], 800,
  'loading placeholder cannot overwrite imported book progress')
console.log('Reader paging checks passed (15 scenarios).')
