// 字符表代理层
const DB = require('../common/database').DB;

// 添加字符数据的操作
exports.addChar = function (charData) {
  let { char, data, width, height, imageId, order } = charData;
  return new Promise(function(resolve, reject) {
    // created是创建的时间戳
    var sql = "INSERT INTO `chars` (`char`, `data`, `width`, `height`, `image_id`, `order`, `created`) VALUES (?, ?, ?, ?, ?, ?, ?)";
    DB.run(sql,
      char,
      data,
      width,
      height,
      imageId,
      order,
      Math.floor(Date.now() / 1000),
      function (err) {
        if (err) return reject(err);
        var { lastID } = this;
        resolve({ lastID });
      })
    });
}

// 获取所有的字符
exports.getAllChars = function () {
  return new Promise(function(resolve, reject) {
    let sql = "SELECT `char`, `data`, `width`, `height` FROM `chars`";
    // 查询
    DB.all(sql, function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
};
