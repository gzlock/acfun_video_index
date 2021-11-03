import axios from 'axios'
import { Feed } from './feed'

export enum ContributeListStatus {
  all,
  verified,
  verifying,
  fail
}

/**
 *
 * @param authorId 账号id
 * @param page 页数，从0开始
 * @param status 视频状态 0
 */
export function queryContributeList (
  authorId: number,
  page: number | string = 0,
  status: ContributeListStatus,
): Promise<{ page: any, list: Feed[] }> {
  page = page >= 0 ? page : 0
  return axios.post<ContributeList>(
    'https://member.acfun.cn/list/api/queryContributeList',
    `pcursor=${page}&resourceType=2&sortType=3&authorId=${authorId}&status=${status}`,
    {
      timeout: 10000, // 10秒超时
      headers: {
        cookie: process.env.ACFUN_COOKIES as string,
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        "pragma": "no-cache",
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
    }).then(res => ({
    page: res.data.pcursor,
    list: res.data.feed.map(data => new Feed(data)),
  }))
}