import * as fs from 'fs'
import { exec, execSync } from 'child_process'
import path from 'path'
import dayjs from 'dayjs'
import lodash from 'lodash'
import { personalBasicInfo } from './personalBasicInfo.js'
import { Feed } from './feed.js'
import { ContributeListStatus, queryContributeList, } from './queryContributeList.js'
import { PersonBasicInfo } from './types.js'
import PQueue from 'p-queue'

// 匹配多种日期 20190202 190202 2019.02.02 2022-01-01
const matchDate = /\d{2,4}[.-]?\d{2}[.-]?\d{2}/
const cwd = process.cwd()
const outputDir = path.join(cwd, 'output')
const acfunVideoIndexDir = path.join(outputDir, 'acfun_video_index')
console.log('目录', acfunVideoIndexDir)

async function main () {
  const { data: { info: { userId } } } = await personalBasicInfo<PersonBasicInfo>()
  const queue = new PQueue({ autoStart: true, concurrency: 8 })
  // 获取一页的数据长度，和total总数
  const { list: feeds, total } = await queryContributeList(
    userId,
    0,
    ContributeListStatus.all,
  )
  const list: Feed[] = []
  // 总页数，如果是有小数自动+1
  const totalPage = Math.ceil(total / feeds.length)
  for (let page = 0; page < totalPage; page++) {
    queue.add(() => queryContributeList(
      userId,
      page,
      ContributeListStatus.all,
    )).then(res => {
      list.push(...res.list)
    })
  }
  await queue.onIdle()

  console.log('视频总数', list.length)
  const categories: { [key: string]: Feed[] } = {
    '综艺玩很大': list.filter(feed => feed.title.includes('玩很大')),
    '综艺大热门': list.filter(feed => feed.title.includes('大热门')),
    '小明星大跟班': list.filter(feed => feed.title.includes('小明星大跟班')),
    '天王到你家': list.filter(feed => feed.title.includes('天王到你家')),
    '小姐不熙娣': list.filter(feed => feed.title.includes('小姐不熙娣')),
    '来吧！营业中': list.filter(feed => feed.title.includes('营业中')),
    '料理之王3': list.filter(feed => feed.title.includes('料理之王')),
    '全部视频': list,
  }
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss')

  let readme_md = `此列表在 ${time} 自动生成\n\n
由于自动化原因，源代码迁移到了https://github.com/gzlock/acfun_video_index\n\n
分类列表：\n\n
${Object.keys(categories).map(key => `- [${key} (${categories[key].length} 个视频)](./${key}.md)`).join('\n\n')}\n\n
# 最新上传的10个视频：\n\n`

  lodash.take(list, 10).forEach(feed => readme_md += feed.toMarkDown())

  try {
    execSync(`rm -rf ${outputDir}`)
    fs.mkdirSync(outputDir)
  } catch (e) {
    console.log('删除output文件夹失败', e)
  }

  let log: any = execSync(
    `cd ${outputDir} && git clone --depth=1 https://gzlock:${process.env.AZURE_TOKEN}@dev.azure.com/gzlock/acfun_video_index/_git/acfun_video_index`)
  console.log('从Gitee克隆仓库', log.toString())

  console.log('生成README.md文件')
  fs.writeFileSync(path.join(acfunVideoIndexDir, 'README.md'), readme_md)

  Object.keys(categories).forEach(key => {
    // const html = [`<h2>此列表在 ${time} 自动生成</h2>`]
    const text = [`此列表在 ${time} 自动生成，一共 ${categories[key].length} 个视频\n\n`]
    const markdown = [`此列表在 ${time} 自动生成，一共 ${categories[key].length} 个视频\n\n`]
    let list: Feed[] = []
    const other: Feed[] = []
    if (key == '全部视频') {
      list = categories[key]
    } else {
      categories[key].forEach(feed => {
        const test = matchDate.test(feed.title)
        if (test) list.push(feed)
        else other.push(feed)
      })
      list = list.sort((a, b) => {
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
    }
    [...list, ...other].forEach(feed => {
      // html.push(feed.toHtml())
      markdown.push(feed.toMarkDown())
      text.push(feed.toTxt())
    })
    fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.md`), markdown.join('\n'))
    fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.txt`), text.join('\n'))
    // fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.html`), html.join('\n'))
  })

  console.log('git status:',
    execSync(`cd ${acfunVideoIndexDir} && git status -s`).toString())

  execSync(`cd ${acfunVideoIndexDir} && git config user.name ${process.env.AZURE_USERNAME}`)
  execSync(`cd ${acfunVideoIndexDir} && git config user.email ${process.env.AZURE_EMAIL}`)

  await outputJSON(list, categories)

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

main()

async function outputJSON (list: Feed[], categories: { [key: string]: Feed[] }) {
  const keys = Object.keys(categories)
  const main = {
    createdAt: new Date(),
    list: keys.reduce((data, key) => {
      // @ts-ignore
      data.push({ name: key, file: `./${key}.json` })
      return data
    }, []), // 视频列表
    new: lodash.take(list, 10).splice(0, 10), // 最新的视频
  }

  fs.rmSync(path.join(acfunVideoIndexDir, 'json'), { recursive: true })

  fs.mkdirSync(path.join(acfunVideoIndexDir, 'json'))

  console.log('生成main.json文件')
  fs.writeFileSync(path.join(acfunVideoIndexDir, 'json', 'main.json'), JSON.stringify(main))

  for (let key of keys) {
    console.log(`生成${key}.json文件`)
    fs.writeFileSync(path.join(acfunVideoIndexDir, 'json', `${key}.json`), JSON.stringify(categories[key]))
  }
}