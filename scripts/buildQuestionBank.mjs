import fs from 'fs'
import path from 'path'

const sourceDirectory = 'C:\\Users\\DQ\\Desktop\\保密题库'
const outputFile = path.resolve('src/data/questionBank.js')
const books = [
  ['single-choice', '单选题', '单选.txt'],
  ['multiple-choice', '多选题', '多选.txt'],
  ['short-answer', '简答题', '简答题.txt'],
  ['true-false', '判断题', '判断题.txt'],
  ['fill-blank', '填空题', '填空题.txt'],
].map(([id, title, fileName]) => {
  const text = fs.readFileSync(path.join(sourceDirectory, fileName), 'utf8')
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)

  const paragraphs = []
  for (let index = 0; index < lines.length; index += 8) {
    paragraphs.push(lines.slice(index, index + 8).join('\n'))
  }

  return {
    id,
    title,
    summary: '离线题库',
    readTime: `${lines.length} 条`,
    paragraphs,
  }
})

const output = `// 此文件由 scripts/buildQuestionBank.mjs 从本地 TXT 生成。\nconst QUESTION_BANK = ${JSON.stringify(books, null, 2)}\n\nexport { QUESTION_BANK }\n`
fs.writeFileSync(outputFile, output, 'utf8')
console.log(`Generated ${outputFile} with ${books.length} books.`)
