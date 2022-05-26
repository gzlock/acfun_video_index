export class Feed {
  public id: string
  public auditMsg?: string
  public coverUrl: string
  public description: string
  public shareUrl: string
  public status: FeedStatus
  public title: string

  constructor (data: IFeed) {
    this.id = data.dougaId
    this.title = data.title
    this.status = data.status
    this.shareUrl = data.shareUrl
    this.description = data.description
    this.coverUrl = data.coverUrl
    this.auditMsg = data.auditMsg
  }

  toJSON () {
    return {
      id: this.id,
      title: this.title,
      status: this.status.toString(),
      shareUrl: this.shareUrl,
      description: this.description,
      coverUrl: this.coverUrl,
      auditMsg: this.auditMsg,
    }
  }

  toMarkDown () {
    let play
    switch (this.status) {
      case FeedStatus.success:
        play = `[<a target="_blank" href="${this.shareUrl}">播放</a>]`
        break
      case FeedStatus.encoding:
        play = `[正在进行视频编码]`
        break
      case FeedStatus.fail:
        play = `[审核失败]\n原因：${this.auditMsg ?? '没有显示审核失败的原因'}`
        break
      case FeedStatus.reviewing:
        play = '[正在审核视频]'
        break
      default:
        play = '[视频状态未知]'
    }
    const str = `### ${this.title} ${play}\n\n` +
      `<img src="${this.coverUrl}" height="200px"/>\n\n`
    if (this.description)
      return str + `${this.description}\n\n`
    return str
  }

  toHtml () {
    let play
    switch (this.status) {
      case FeedStatus.success:
        play = `[<a target="_blank" href="${this.shareUrl}">播放</a>]`
        break
      case FeedStatus.encoding:
        play = `[正在进行视频编码]`
        break
      case FeedStatus.fail:
        play = `[审核失败]<br>原因：${this.auditMsg ?? '没有显示审核失败的原因'}`
        break
      case FeedStatus.reviewing:
        play = '[正在审核视频]'
        break
      default:
        play = '[视频状态未知]'
    }
    const str = `<h1>${this.title}</h1> <div>${play}</div> <div><img src="${this.coverUrl}" height="200px"/></div>`
    if (this.description)
      return str + `<div>${this.description}</div>`
    return str
  }

  toTxt () {
    let play
    switch (this.status) {
      case FeedStatus.success:
        play = `观看链接: ${this.shareUrl}\n`
        break
      case FeedStatus.encoding:
        play = `[正在进行视频编码]\n`
        break
      case FeedStatus.fail:
        play = `[审核失败]\n原因：${this.auditMsg ?? '没有显示审核失败的原因'}\n`
        break
      case FeedStatus.reviewing:
        play = '[正在审核视频]\n'
        break
      default:
        play = '[视频状态未知]\n'
    }
    const str = `${this.title}\n${play}`
    if (this.description)
      return str + this.description.replace('<br/>', '\n') + '\n\n'
    return str + '\n\n'
  }
}