import {personalBasicInfo} from "./personalBasicInfo";
import {ContributeListStatus, queryContributeList} from "./queryContributeList";
import * as fs from "fs";

(async () => {
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
    let content = ''
    Object.keys(categories).forEach(key => {
        content += `# ${key}\n\n`
        // @ts-ignore
        content += categories[key].map(feed => {
            return `### ${feed.title} [播放1](${feed.shareUrl})\n\n<img src="${feed.coverUrl}" height="200px"/>\n\n${feed.description}\n\n`
        }).join('')
    })
    fs.writeFileSync('./README.md', content)
})()