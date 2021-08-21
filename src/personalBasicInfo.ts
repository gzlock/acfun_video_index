import axios, {AxiosResponse} from "axios";
import headers from '../headers.json'

/**
 * 主要用于检测Cookie是否还可以使用
 * 以及拿到userId
 */
export function personalBasicInfo<T>(): Promise<AxiosResponse<T>> {
    return axios.get<T>('https://www.acfun.cn/rest/pc-direct/user/personalBasicInfo', {headers})
}
