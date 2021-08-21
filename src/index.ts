import {personalBasicInfo} from "./personalBasicInfo";
import {ContributeListStatus, queryContributeList} from "./queryContributeList";
import * as fs from "fs";
import {exec, execSync, spawnSync} from "child_process";
import path from "path";
import dayjs from "dayjs";

const cwd = process.cwd()
const outputDir = path.join(cwd, 'output')
const acfunVideoIndexDir = path.join(outputDir, 'acfun_video_index')
console.log('目录', acfunVideoIndexDir);

async function main() {
    const {data: {info: {userId}}} = await personalBasicInfo<PersonBasicInfo>()
    const list: Feed[] = []
    let page: any = 0
    while (page != 'no_more') {
        console.log('正在读取', `第${page}页`)
        const {
            data: {
                feed,
                pcursor
            }
        } = await queryContributeList<ContributeList>(userId, page, ContributeListStatus.verified)
        page = pcursor
        list.push(...feed)
    }
    console.log('视频总数', list.length)
    const categories = {
        '综艺玩很大': list.filter(feed => feed.title.includes('玩很大')),
        '综艺大热门': list.filter(feed => feed.title.includes('大热门')),
        '小明星大跟班': list.filter(feed => feed.title.includes('小明星') || feed.title.includes('大跟班')),
    }
    const time = dayjs().format('YYYY-MM-DD HH:mm:ss')
    let content = `### 此列表在 ${time} 自动生成\n\n`
    Object.keys(categories).forEach(key => {
        content += `# ${key}\n\n`
        // @ts-ignore
        content += categories[key].map(feed => {
            return `### ${feed.title} [播放](${feed.shareUrl})\n\n<img src="${feed.coverUrl}" height="200px"/>\n\n${feed.description}\n\n`
        }).join('')
    })
    try {
        execSync(`rm -rf ${outputDir}`)
    } catch (e) {
        console.log('删除output文件夹失败', e)
    }
    fs.mkdirSync(outputDir)

    let log: any = execSync(`cd ${outputDir} && git clone --depth=1 https://gzlock:${process.env.GITEE_TOKEN}@gitee.com/gzlock/acfun_video_index.git`)
    console.log('从Gitee克隆仓库', log.toString())

    console.log('生成README.md文件')
    fs.writeFileSync(path.join(acfunVideoIndexDir, 'README.md'), content)

    console.log('git status:', execSync(`cd ${acfunVideoIndexDir} && git status -s`).toString())

    execSync(`cd ${acfunVideoIndexDir} && git config user.name gzlock`)
    execSync(`cd ${acfunVideoIndexDir} && git config user.email srleo@qq.com`)

    await new Promise((resolve, reject) => {
        exec(`cd ${acfunVideoIndexDir} && git commit -am '自动生成${time}'`, (err, stdout, stderr) => {
            if (err) return reject(stdout)
            resolve(stdout)
        })
    }).then(() => {
        console.log('git commit', '成功')
    }).catch(e => {
        console.error('git commit', e)
    })

    log = execSync(`cd ${acfunVideoIndexDir} && git push`)
    console.log('git push', log.toString())
}

main()