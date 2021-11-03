import axios, {AxiosResponse} from "axios";

/**
 * 主要用于检测Cookie是否还可以使用
 * 以及拿到userId
 */
export function personalBasicInfo<T>(): Promise<AxiosResponse<T>> {
    return axios.get<T>('https://www.acfun.cn/rest/pc-direct/user/personalBasicInfo', {
        headers: {
            cookie: process.env.ACFUN_COOKIES as string,
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-CN,zh;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded",
            "pragma": "no-cache",
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
        }
    })
}
