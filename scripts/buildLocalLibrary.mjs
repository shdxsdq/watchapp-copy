import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const sourceDirectory = path.resolve('local-texts')
const articleOutput = path.resolve('src/data/localArticles.js')
const bookOutput = path.resolve('src/data/localBooks.js')

fs.mkdirSync(sourceDirectory, { recursive: true })

const files = fs.readdirSync(sourceDirectory)
  .filter(fileName => fileName.toLowerCase().endsWith('.txt'))
  .sort((left, right) => left.localeCompare(right, 'zh-CN'))

const SUPPORTED_COLORS = new Set([
  'blue',
  'white',
  'red',
  'yellow',
  'green',
  'aqua',
  'warm',
])

function appendParagraphs(paragraphs, source, color = '') {
  const lines = source
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)

  for (let index = 0; index < lines.length; index += 8) {
    paragraphs.push({
      text: lines.slice(index, index + 8).join('\n'),
      color: SUPPORTED_COLORS.has(color) ? color : '',
    })
  }
}

function parseParagraphs(text) {
  const normalized = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
  const paragraphs = []
  const tagPattern = /\[([a-z]+)\]([\s\S]*?)\[\/\1\]/gi
  let cursor = 0
  let match

  while ((match = tagPattern.exec(normalized)) !== null) {
    appendParagraphs(paragraphs, normalized.slice(cursor, match.index))
    appendParagraphs(paragraphs, match[2], match[1].toLowerCase())
    cursor = tagPattern.lastIndex
  }
  appendParagraphs(paragraphs, normalized.slice(cursor))
  return paragraphs.length > 0
    ? paragraphs
    : [{ text: '这个 TXT 文件没有内容。', color: '' }]
}

const articles = files.map(fileName => {
  const filePath = path.join(sourceDirectory, fileName)
  const bytes = fs.readFileSync(filePath)
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  const title = path.basename(fileName, path.extname(fileName))
  const idHash = crypto.createHash('sha1').update(fileName).digest('hex').slice(0, 10)
  const paragraphs = parseParagraphs(text)
  const lineCount = paragraphs.reduce(
    (count, paragraph) => count + paragraph.text.split('\n').length,
    0
  )

  return {
    id: `local-${idHash}`,
    title: title.slice(0, 40),
    summary: '本地 TXT',
    readTime: `${lineCount} 条`,
    paragraphs,
  }
})

const books = articles.map(article => ({ id: article.id, title: article.title }))
fs.writeFileSync(
  articleOutput,
  `// 自动生成，请勿手工编辑。\nconst LOCAL_ARTICLES = ${JSON.stringify(articles, null, 2)}\n\nexport { LOCAL_ARTICLES }\n`,
  'utf8'
)
fs.writeFileSync(
  bookOutput,
  `// 自动生成，请勿手工编辑。\nconst LOCAL_BOOKS = ${JSON.stringify(books, null, 2)}\n\nexport { LOCAL_BOOKS }\n`,
  'utf8'
)
console.log(`已生成 ${articles.length} 本本地 TXT。`)
