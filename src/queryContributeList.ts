import axios, {AxiosResponse} from "axios";

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
export function queryContributeList<T>(
    authorId: number,
    page: number | string = 0,
    status: ContributeListStatus,
): Promise<AxiosResponse<T>> {
    page = page >= 0 ? page : 0
    return axios.post<T>('https://member.acfun.cn/list/api/queryContributeList',
        `pcursor=${page}&resourceType=2&sortType=3&authorId=${authorId}&status=${status}`,
        {
            headers: {
                cookie: process.env.ACFUN_COOKIES
            }
        })
}
