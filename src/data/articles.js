import { LOCAL_ARTICLES } from './localArticles.js'

const ARTICLES = LOCAL_ARTICLES

function getArticle(articleId) {
  for (let index = 0; index < ARTICLES.length; index += 1) {
    if (ARTICLES[index].id === articleId) {
      return ARTICLES[index]
    }
  }

  return ARTICLES[0]
}

export { ARTICLES, getArticle }
