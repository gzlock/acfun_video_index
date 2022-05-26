declare interface PersonBasicInfo {
  info: {
    userId: number
    userName: string
  }
}

declare interface ContributeList {
  feed: IFeed[] // 视频列表
  pcursor: string | 'no_more' // 下一页页码
  /**
   * @link ContributeListStatus
   * 按这个状态查询，整个账号有多少视频
   */
  totalNum: number
}

declare const enum FeedStatus {
  encoding = 5, // 转码中
  reviewing = 1, // 审核中
  success = 2, // 成功
  fail = 7 // 已退回
}

declare interface IFeed {
  dougaId: string // 视频id
  title: string // 视频标题
  description: string // 视频描述
  coverUrl: string // 视频封面
  shareUrl: string // 视频网址
  status: FeedStatus // 视频状态
  auditMsg?: string // 审核失败的原因
}