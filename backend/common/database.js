const path = require('path');
const sqlite3 = require('sqlite3');

// 初始化Sqlite数据库
var DB = new sqlite3.Database(path.join(process.cwd(), "data", "captcha.db"), function (err) {
  if (err) {
    throw err;
  }
});

// 直接把DB暴露出去好了
exports.DB = DB;
