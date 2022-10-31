import * as fs from 'fs'
import { exec, execSync } from 'child_process'
import path from 'path'
import dayjs from 'dayjs'
import lodash from 'lodash'
import { Feed } from './feed.js'
import { ContributeListStatus, queryContributeList, } from './queryContributeList.js'
import PQueue from 'p-queue'
import axios from 'axios'
import { updateArticle } from './updateArticle.js'
import { sleep } from './sleep.js'
import * as readline from 'readline'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

// 匹配多种日期 20190202 190202 2019.02.02 2022-01-01
export const matchDate = /\d{2,4}[.-]?\d{2}[.-]?\d{2}/
const cwd = process.cwd()
const outputDir = path.join(cwd, 'output')
const acfunVideoIndexDir = path.join(outputDir, 'acfun_video_index')
console.log('目录', acfunVideoIndexDir)

const acPassToken = process.env.ACFUN_TOKEN as string
const uid = process.env.ACFUN_UID as string
const cookie = `acPasstoken=${acPassToken}; auth_key=${uid}; `

const options = {
  timeout: 10000,
  headers: {
    cookie,
    'host': 'member.acfun.cn',
    'origin': 'member.acfun.cn',
    'content-type': 'application/x-www-form-urlencoded',
  }
}

class CategoryForFeed {
  name: string
  feeds: Feed[]
  isEnd: boolean
  articleId?: number | undefined
  reorder?: (feeds: Feed[]) => Feed[] | undefined

  constructor ({
    name,
    feeds,
    isEnd,
    articleId = undefined,
    reorder = undefined,
  }: { name: string, feeds: Feed[], isEnd: boolean, articleId?: number, reorder?: (feeds: Feed[]) => Feed[] }) {
    this.name = name
    this.feeds = feeds
    this.isEnd = isEnd
    this.articleId = articleId
    this.reorder = reorder
  }
}

async function main () {
  const queue = new PQueue({ autoStart: true, concurrency: 8 })
  // 获取一页的数据长度，和total总数
  const { list: feeds, total } = await queryContributeList(
    uid,
    axios.create(options),
    0,
    ContributeListStatus.all,
  )
  const list: Feed[] = []
  // 总页数，如果有小数自动+1
  const totalPage = Math.ceil(total / feeds.length)
  const lastVideos: Feed[] = []
  for (let page = 0; page < totalPage; page++) {
    queue.add(() => queryContributeList(
      uid,
      axios.create(options),
      page,
      ContributeListStatus.all,
    )).then(res => {
      list.push(...res.list)
      if (page == 0)
        lastVideos.push(...res.list)
    })
  }
  await queue.onIdle()

  console.log('视频总数', list.length)
  const categories: CategoryForFeed[] = [
    new CategoryForFeed({
      name: '全部视频',
      isEnd: false,
      feeds: list,
      reorder: (feeds) => feeds
    }),
    new CategoryForFeed({
      name: '综艺玩很大',
      isEnd: false,
      articleId: 35347096,
      feeds: list.filter(feed => feed.title.startsWith('综艺玩很大') || feed.title.includes('玩很大'))
    }),
    new CategoryForFeed({
      name: '综艺大热门',
      isEnd: false,
      articleId: 35422683,
      feeds: list.filter(feed => feed.title.startsWith('综艺大热门') || feed.title.startsWith('大热门'))
    }),
    new CategoryForFeed({
      name: '小明星大跟班',
      isEnd: false,
      articleId: 35650980,
      feeds: list.filter(feed => feed.title.startsWith('小明星大跟班') || feed.title.startsWith('小大'))
    }),
    new CategoryForFeed({
      name: '小姐不熙娣',
      isEnd: false,
      articleId: 35639119,
      feeds: list.filter(feed => feed.title.startsWith('小姐不熙娣') || feed.title.startsWith('不熙娣'))
    }),
    new CategoryForFeed({
      name: '11点热吵店',
      isEnd: false,
      articleId: 39129480,
      feeds: list.filter(feed => feed.title.startsWith('11点热吵店') || feed.title.startsWith('热吵店'))
    }),
    new CategoryForFeed({
      name: '来吧！营业中',
      isEnd: true,
      feeds: list.filter(feed => feed.title.startsWith('来吧！营业中'))
    }),
    new CategoryForFeed({
      name: '料理之王3',
      isEnd: true,
      feeds: list.filter(feed => feed.title.startsWith('料理之王3')),
      reorder: list => {
        const result: Feed[] = []
        // 料理之王按集数排序，集数从1开始，所以-1
        list.forEach(feed => {
          const number = parseInt(feed.title.match(/ep(\d+)/i)![1]) - 1
          result[number] = feed
        })
        return result.reverse()
      }
    }),
    new CategoryForFeed({
      name: '開動吧！漂亮姐姐',
      isEnd: true,
      feeds: list.filter(feed => feed.title.startsWith('開動吧！漂亮姐姐'))
    }),
    new CategoryForFeed({
      name: 'Jacky Show',
      isEnd: true,
      feeds: list.filter(feed => /jacky show/i.test(feed.title)),
      reorder: (feeds) => {
        let list: Feed[] = []
        const other: Feed[] = []
        // 有没有包含ep来区分
        feeds.forEach(feed => {
          const ep = /ep\s*\d+/i.test(feed.title)
          if (ep)
            list.push(feed)
          else
            other.push(feed)
        })
        list = list.sort((a, b) => {
          const epA = parseInt(a.title.match(/ep(\d+)/i)![1])
            , epB = parseInt(b.title.match(/ep(\d+)/i)![1])
          return epA - epB
        })
        return [...list, ...other]
      },
    }),
    new CategoryForFeed({
      name: '综艺旗舰',
      isEnd: true,
      feeds: list.filter(feed => feed.title.includes('综艺旗舰'))
    }),
  ]
  const time = dayjs().tz('PRC').format('YYYY-MM-DD HH:mm:ss')

  let readme_md = `此列表在 ${time} 自动生成\n\n
分类列表：\n\n
${categories.map(category => `- [${category.name} (${category.feeds.length} 个视频)](./${encodeURI(category.name)}.md)`).join('\n\n')}\n\n
# 最新上传的10个视频：\n\n`

  lastVideos.forEach(feed => readme_md += feed.toMarkDown())

  try {
    execSync(`rm -rf ${outputDir}`)
    fs.mkdirSync(outputDir)
  } catch (e) {
    console.log('删除output文件夹失败', e)
  }

  let log: any = execSync(
    `cd ${outputDir} && git clone https://gzlock:${process.env.AZURE_TOKEN}@dev.azure.com/gzlock/acfun_video_index/_git/acfun_video_index`)
  console.log('从Gitee克隆仓库', log.toString())

  console.log('生成README.md文件')
  fs.writeFileSync(path.join(acfunVideoIndexDir, 'README.md'), readme_md)
  for (let category of categories) {
    // const html = [`<h2>此列表在 ${time} 自动生成</h2>`]
    const title = `此列表在 ${time} 生成，一共 ${category.feeds.length} 个视频`
    const text = [title + '\n\n']
    const markdown = [title + '\n\n']
    let list: Feed[]
    if (category.reorder) {
      list = category.reorder(category.feeds)!
    } else {
      // 其余按日期排序
      let tempList: Feed[] = []
      const otherList: Feed[] = []
      category.feeds.forEach(feed => {
        const test = matchDate.test(feed.title)
        if (test) tempList.push(feed)
        else otherList.push(feed)
      })
      tempList = tempList.sort((a, b) => {
        const aMatch = a.title.match(matchDate)
        const bMatch = b.title.match(matchDate)
        if (aMatch && bMatch) {
          const aTime = parseInt(aMatch[0].replace(/[.-]/g, ''))
          const bTime = parseInt(bMatch[0].replace(/[.-]/g, ''))
          // console.log({ aMatch: aMatch[0], aTime, bMatch: bMatch[0], bTime })
          return dayjs(aTime).isAfter(dayjs(bTime)) ? -1 : 1
        }
        return 1
      })
      list = [...tempList, ...otherList]
    }
    let page: number | null
    list.forEach((feed) => {
      // html.push(feed.toHtml())
      markdown.push(feed.toMarkDown())
      if (category.name == '全部视频' && page != feed.page) {
        page = feed.page
        text.push(`第${page + 1}页`)
      }
      text.push(feed.toTxt(category.name))
    })
    fs.writeFileSync(path.join(acfunVideoIndexDir, `${category.name}.md`), markdown.join('\n'))
    fs.writeFileSync(path.join(acfunVideoIndexDir, `${category.name}.txt`), text.join('\n'))
    fs.writeFileSync(path.join(acfunVideoIndexDir, 'json', `${category.name}.json`), JSON.stringify(list.map(feed => feed.toJSON(category.name))))
    // fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.html`), html.join('\n'))

    /**
     * 更新Acfun文章
     */
    if (category.articleId) {
      await sleep(1000)
      await updateArticle({
        axios: axios.create(options),
        articleId: category.articleId,
        title: `${category.name} 全集在线看 ${category.feeds.length} 个视频`,
        content: [title, '<br>', '<br>', ...list.map(feed => feed.toAcfunArticle(category.name))] as string[],
      })
    }
  }
  await outputMainJson(categories, lastVideos)

  console.log('git status:',
    execSync(`cd ${acfunVideoIndexDir} && git status -s`).toString())

  execSync(`cd ${acfunVideoIndexDir} && git config user.name ${process.env.AZURE_USERNAME}`)
  execSync(`cd ${acfunVideoIndexDir} && git config user.email ${process.env.AZURE_EMAIL}`)

  await new Promise((resolve, reject) => {
    exec(
      `cd ${acfunVideoIndexDir} && git add ./ && git commit -am '自动生成${time}'`,
      (err, stdout, stderr) => {
        if (err) return reject(stdout)
        resolve(stdout)
      })
  }).then(() => {
    console.log('git commit', '成功')
  }).catch(e => {
    console.error('git commit', '失败', e)
  })

  log = execSync(`cd ${acfunVideoIndexDir} && git push`)
  console.log('git push', log.toString())

}

async function outputMainJson (categories: CategoryForFeed[], lastVideos: Feed[]) {
  const main = {
    createdAt: new Date(),
    list: categories.map(category => ({
      name: `${category.name}（${category.feeds.length}个视频）`,
      file: `${category.name}.json`
    })), // 视频列表
    new: lastVideos.map(feed => feed.toJSON()), // 最新的视频
  }
  console.log('生成main.json文件')
  fs.writeFileSync(path.join(acfunVideoIndexDir, 'json', 'main.json'), JSON.stringify(main))
}

export function print (...args: any[]) {
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(args.join(' '))
}

main()