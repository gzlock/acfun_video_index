import { personalBasicInfo } from './personalBasicInfo'
import { ContributeListStatus, queryContributeList, } from './queryContributeList'
import * as fs from 'fs'
import { exec, execSync } from 'child_process'
import path from 'path'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { Feed } from './feed'
import lodash from 'lodash/'

dayjs.extend(utc)

const cwd = process.cwd()
const outputDir = path.join(cwd, 'output')
const acfunVideoIndexDir = path.join(outputDir, 'acfun_video_index')
console.log('目录', acfunVideoIndexDir)

async function main () {
  const { data: { info: { userId } } } = await personalBasicInfo<PersonBasicInfo>()
  const list: Feed[] = []
  let page: any = 0
  while (page != 'no_more') {
    console.log('正在读取', `第${page}页`)
    const { page: current, list: feeds } = await queryContributeList(
      userId,
      page,
      ContributeListStatus.all,
    )
    page = current
    list.push(...feeds)

    // 等待1秒
    // await new Promise(resolve => {
    //   setTimeout(() => resolve(null), 5000)
    // })
  }

  console.log('视频总数', list.length)
  const categories: { [key: string]: Feed[] } = {
    '综艺玩很大': list.filter(feed => feed.title.includes('玩很大')),
    '综艺大热门': list.filter(feed => feed.title.includes('大热门')),
    '小明星大跟班': list.filter(
      feed => feed.title.includes('小明星') || feed.title.includes('大跟班')),
    '天王到你家': list.filter(feed => feed.title.includes('天王到你家')),
    '小姐不熙娣': list.filter(feed => feed.title.includes('小姐不熙娣')),
    '来吧！营业中': list.filter(feed => feed.title.includes('营业中') || feed.title.includes('營業中')),
    '全部视频': list,
  }
  const time = dayjs.utc().add(8, 'hours').format('YYYY-MM-DD HH:mm:ss')

  let readme_md = `此列表在 ${time} 自动生成\n\n
由于自动化原因，源代码迁移到了https://github.com/gzlock/acfun_video_index\n\n
分类列表：\n\n
${Object.keys(categories).map(key => `- [${key}](./${key}.md)`).join('\n\n')}\n\n
# 最新上传的10个视频：\n\n`

  lodash.take(list, 10).forEach(feed => readme_md += feed.toMarkDown())

  try {
    execSync(`rm -rf ${outputDir}`)
    fs.mkdirSync(outputDir)
  } catch (e) {
    console.log('删除output文件夹失败', e)
  }

  let log: any = execSync(
    `cd ${outputDir} && git clone --depth=1 https://gzlock:${process.env.GITEE_TOKEN}@gitee.com/gzlock/acfun_video_index.git`)
  console.log('从Gitee克隆仓库', log.toString())

  console.log('生成README.md文件')
  fs.writeFileSync(path.join(acfunVideoIndexDir, 'README.md'), readme_md)

  Object.keys(categories).forEach(key => {
    let html = `<h2>此列表在 ${time} 自动生成</h2>`
    let text = `此列表在 ${time} 自动生成\n\n`
    let markdown = `此列表在 ${time} 自动生成\n\n`
    categories[key].forEach(feed => {
      markdown += feed.toMarkDown()
      html += feed.toHtml()
      text += feed.toTxt()
    })
    fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.md`), markdown)
    // fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.txt`), text)
    // fs.writeFileSync(path.join(acfunVideoIndexDir, `${key}.html`), html)
  })

  console.log('git status:',
    execSync(`cd ${acfunVideoIndexDir} && git status -s`).toString())

  execSync(`cd ${acfunVideoIndexDir} && git config user.name ${process.env.GITEE_USERNAME}`)
  execSync(`cd ${acfunVideoIndexDir} && git config user.email ${process.env.GITEE_EMAIL}`)

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

  fs.rmdirSync(path.join(acfunVideoIndexDir, 'json'), { recursive: true })

  fs.mkdirSync(path.join(acfunVideoIndexDir, 'json'))

  console.log('生成main.json文件')
  fs.writeFileSync(path.join(acfunVideoIndexDir, 'json', 'main.json'), JSON.stringify(main))

  for (let key of keys) {
    console.log(`生成${key}.json文件`)
    fs.writeFileSync(path.join(acfunVideoIndexDir, 'json', `${key}.json`), JSON.stringify(categories[key]))
  }
}