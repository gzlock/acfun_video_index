import { AxiosInstance } from 'axios'
import lodash from 'lodash'
import * as fs from 'fs'
import pRetry from 'p-retry'

export async function updateArticle ({
  axios,
  articleId,
  title,
  content
}: { axios: AxiosInstance, articleId: number, title: string, content: string[] }) {
  console.log('第一行', content[0])
  const referer = `https://member.acfun.cn/edit-article/${articleId}`

  axios.defaults.headers.common['referer'] = referer
  console.log('更新A站文章', referer, title)

  let params = new URLSearchParams()
  params.append('articleId', articleId + '')
  const article = await axios.post('https://member.acfun.cn/article/api/getArticleInfo', params).then(res => res.data)

  // const article = await pRetry(() => axios.post('https://member.acfun.cn/article/api/getArticleInfo', params).then(res => res.data), { retries: 5 })

  // console.log('文章数据', article)
  if (!article['articleId']) return
  article['title'] = title
  article['content'] = lodash.flatten(content).map(line => `<p>${line}</p>`).join('')
  // console.log('提交数据', article['content'])
  params = toURLSearchParams(article)

  // console.log(params.get('body')!.toString())

  const updateRes =
    // await axios.post('https://member.acfun.cn/article/api/updateArticle', params)
    await pRetry(() => axios.post('https://member.acfun.cn/article/api/updateArticle', params), { retries: 5 })
  console.log('更新结果', updateRes.data)

  // fs.writeFileSync(`./${articleId}.json`, JSON.stringify(article, null, 2))
  // fs.writeFileSync(`./${articleId}.txt`, params.toString())
  //
  //
  // await axios.post('https://www.acfun.cn/articlepreview', params, {
  //   headers: {
  //     host: 'www.acfun.cn',
  //     origin: 'https://member.acfun.cn',
  //     referer: 'https://member.acfun.cn',
  //   }
  // }).then(res => fs.writeFileSync('preview.html', res.data))
}

const toURLSearchParams = (data: any): URLSearchParams => {
  const params = new URLSearchParams()
  const body = JSON.stringify({
    bodyList: [{
      orderId: '',
      title: '',
      txt: encodeURIComponent(htmlEntities(data['content']!)),
      desc: '',
    }]
  })
  params.append('title', data['title']!)
  params.append('description', data['description'] ?? '')
  // params.append('typeId', data['typeId']!)
  params.append('detail', body)
  // params.append('body', body)
  params.append('tagNames', JSON.stringify(data['tagList']!))
  params.append('creationType', '3')
  params.append('cover', data['titleImg']!)
  params.append('channelId', data['channelId']!)
  params.append('realmId', data['realmId']!)
  params.append('supportZtEmot', 'true')
  params.append('articleId', data['articleId']!)
  return params
}

function htmlEntities (str: string): string {
  return str.replace(/&/g, '&amp;')
  // .replace(/</g, '&lt;')
  // .replace(/>/g, '&gt;')
  // .replace(/"/g, '&quot;')
}