const path = require('path');
const sqlite3 = require('sqlite3');

var DB = new sqlite3.Database(path.join(process.cwd(), "data", "captcha.db"), function (err) {
  if (err) {
    throw err;
  }
});

// 查询
DB.all("SELECT * FROM `images`", function (err, data) {
  if (err) throw err;
  console.log(data);
});

// 插入元素
DB.run("INSERT INTO `images` (`name`, `created`) VALUES (?, ?)", "Another Image", 12345678, function (err) {
  if (err) throw err;
  console.log(this);
});
