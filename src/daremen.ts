import axios from 'axios'
import * as cheerio from 'cheerio'
import dayjs from 'dayjs'

/**
 * 这个文件是用于找出未上传的综艺大热门
 */

async function main (): Promise<void> {
  const res = await axios.get('https://dev.azure.com/gzlock/74ac0619-da0a-4676-a06c-311f9fd1e5be/_apis/git/repositories/c807a5d1-ed3f-4fd6-847a-6ffdb770884f/items?path=/%E7%BB%BC%E8%89%BA%E5%A4%A7%E7%83%AD%E9%97%A8.txt&versionDescriptor%5BversionOptions%5D=0&versionDescriptor%5BversionType%5D=0&versionDescriptor%5Bversion%5D=master&resolveLfs=true&%24format=octetStream&api-version=5.0&download=true')
  const wiki = await loadWiki()
  wiki.forEach(item => {
    if (res.data.indexOf(item.date) == -1)
      console.log('缺失', item)
  })
}

async function loadWiki (): Promise<{ date: string, title: string }[]> {
  const res = await axios.get('https://tw-entertainment.fandom.com/zh/wiki/%E7%B6%9C%E8%97%9D%E5%A4%A7%E7%86%B1%E9%96%80', {
    proxy: { host: '192.168.2.2', port: 7890 },
  })
  const $ = cheerio.load(res.data)
  const list: { date: string, title: string }[] = []
  $('.NavFrame').each(function (this: any, index) {
    const $container = $(this)
    const year = parseInt($('.NavHead', $container).text())

    // 2021年不完整
    if (year == 2021) return

    const $rows = $('tr', $container)
    // console.log(index, year, $rows.length)
    $rows.each(function (this: any, index) {
      const $row = $(this)
      const title = $('td:nth-child(3)', $row).text()
      if (title.length == 0) return
      let date = $('td:nth-child(2)', $row).text().replace(/\D+$/, '')
        .replace(/\D+/g, '-')
      if (date.length < 3) return
      if (date.length < 6)
        date = `${year}-${date}`
      date = dayjs(date).format('YYYYMMDD')
      // console.log(date, title)
      list.push({ date, title })
    })
  })
  return list
}

main()