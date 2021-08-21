# TW综艺节目国内索引计划
## 用爱发电，坚持免费、无广告、免注册式观看

#### 介绍

索引自己上传到Acfun的视频地址

#### 软件架构

nodejs 14+

#### 使用方法

1. 打开Chrome浏览器登录Acfun
2. 打开Chrome的开发者工具->Network标签
3. 打开 https://member.acfun.cn/video-history
4. 将这个网络请求复制为Fetch文本数据再提取headers这个字段的数据复制到headers.json，后续所有网络请求都会使用这些数据 下文图1
5. 执行命令安装运行环境 `npm install` 或 `yarn`
6. 执行命令启动脚本`npm run start`或`yarn run start`

图1
![图1](img/1.png)