enum FeedStatus {
  encoding = 5, // 转码中
  reviewing = 1, // 审核中
  success = 2, // 成功
  fail = 7 // 已退回
}

export class Feed{
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

  toString () {
    let play
    switch (this.status) {
      case FeedStatus.success:
        play = `[<a target="_blank" href="${this.shareUrl}">播放</a>]`
        break
      case FeedStatus.encoding:
        play = `[正在进行视频编码]`
        break
      case FeedStatus.fail:
        play = `[审核失败]\n\n原因：${this.auditMsg ?? '没有显示审核失败的原因'}`
        break
      case FeedStatus.reviewing:
        play = '[正在审核视频]'
        break
      default:
        play = '[视频状态未知]'
    }
    return `### ${this.title} ${play}\n\n` +
      `<img src="${this.coverUrl}" height="200px"/>\n\n` +
      `${this.description}\n\n`
  }
}