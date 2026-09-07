import fs from 'fs'
import path from 'path'

const sourceFile = path.resolve('src/data/questionBank.js')
const targetDirectory = path.resolve('local-texts')
const source = fs.readFileSync(sourceFile, 'utf8')
const jsonStart = source.indexOf('[')
const jsonEnd = source.lastIndexOf('\n\nexport')

if (jsonStart < 0 || jsonEnd < 0) {
  throw new Error('无法解析旧题库数据。')
}

const articles = JSON.parse(source.slice(jsonStart, jsonEnd))
fs.mkdirSync(targetDirectory, { recursive: true })

for (const article of articles) {
  const fileName = `${article.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`
  const filePath = path.join(targetDirectory, fileName)
  const text = article.paragraphs.join('\n')
  fs.writeFileSync(filePath, `${text}\n`, 'utf8')
  console.log(`已还原：${fileName}`)
}
