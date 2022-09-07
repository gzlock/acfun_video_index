import { FeedStatus, IFeed } from './types.js'
import { matchDate } from './index.js'

export class Feed {
  public id: string
  public auditMsg?: string
  public coverUrl: string
  public description: string
  public shareUrl: string
  public status: FeedStatus
  public title: string
  public page: number

  constructor (data: IFeed, page: number) {
    const match = data.title.match(matchDate)
    if (match) {
      data.title = data.title.replace(matchDate, match[0].replace(/[-.]/g, ''))
    }
    this.id = data.dougaId
    this.title = data.title.trim()
    this.status = data.status
    this.shareUrl = data.shareUrl
    this.description = data.description
    this.coverUrl = data.coverUrl
    this.auditMsg = data.auditMsg
    this.page = page
  }

  toJSON (replace: string | null = null) {
    return {
      id: this.id,
      title: replace ? this.title.replace(replace, '').trim() : this.title,
      status: this.status.toString(),
      shareUrl: this.shareUrl,
      description: this.description,
      coverUrl: this.coverUrl,
      auditMsg: this.auditMsg,
    }
  }

  toMarkDown () {
    let play = `[<a target="_blank" href="${this.shareUrl}">播放</a>]`
    switch (this.status) {
      case FeedStatus.fail:
        play += `[审核失败]\n原因：${this.auditMsg ?? '没有显示审核失败的原因'}`
        break
    }
    const str = `### ${this.title} ${play}\n\n` +
      `<img src="${this.coverUrl}" height="200px"/>\n\n`
    if (this.description)
      return str + `${this.description}`
    return str
  }

  toHtml () {
    let play = `[<a target="_blank" href="${this.shareUrl}">播放</a>]`

    if (this.status == FeedStatus.fail)
      play += `[审核失败]<br>原因：${this.auditMsg ?? '没有显示审核失败的原因'}`

    const str = `<h1>${this.title}</h1> <div>${play}</div> <div><img src="${this.coverUrl}" height="200px"/></div>`
    if (this.description)
      return str + `<div>${this.description}</div>`
    return str
  }

  toTxt (replace: string | null = null) {
    let play = `观看链接: ${this.shareUrl}\n`

    if (this.status == FeedStatus.fail)
      play += `[审核失败]\n原因：${this.auditMsg ?? '没有显示审核失败的原因'}\n`

    const title = replace ? this.title.replace(replace, '').trim() : this.title
    const str = `${title}\n${play}`
    // if (this.description)
    //   return str + this.description.replace('<br/>', '\n')
    return str
  }

  /** 转换为A站文章格式
   *
   * @param replace
   */
  toAcfunArticle (replace: string | null = null): string[] {
    const title = replace ? this.title.replace(replace, '').trim() : this.title
    const res = [title, `观看链接: ${this.shareUrl}`]

    if (this.status == FeedStatus.fail)
      res.push(...['审核失败', `原因：${this.auditMsg ?? '没有显示审核失败的原因'}`])
    res.push('<br>')
    return res
  }
}