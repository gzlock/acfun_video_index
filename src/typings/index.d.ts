declare interface PersonBasicInfo {
    info: {
        userId: number
        userName: string
    }
}

declare interface Headers {
    cookie: string

    [key: string]: string
}

declare interface ContributeList {
    feed: Feed[] // 视频列表
    pcursor: string | "no_more" // 下一页页码
    /**
     * @link ContributeListStatus
     * 按这个状态查询，整个账号有多少视频
     */
    totalNum: number
}

declare interface Feed {
    title: string // 视频标题
    description: string // 视频描述
    coverUrl: string // 视频封面
    shareUrl: string // 视频网址
}