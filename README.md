# zf_captcha_filler
前端一键识别并填充正方教务系统的验证码

详细介绍：https://blog.izgq.net/archives/944/

## 文件列表
* backend: 收集字符样本、提供加载服务的后端，基于 express.js 与 SQLite3
* draft: 切割算法调试文件
* jwc_captcha_filler.user.js: [实现验证码自动填充的 Userscript](https://greasyfork.org/en/scripts/38286-scnu-jwc-captcha-filler)
* bookmark_loader.js: 在没有用户脚本管理器的情况下，通过浏览器书签执行 javascript: 协议脚本加载后端提供的 JavaScript 并 eval，绕过 CORS 的方案

## License
GPLv3
