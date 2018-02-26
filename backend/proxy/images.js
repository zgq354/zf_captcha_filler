// 图片表代理层
const DB = require('../common/database').DB;

// 保存文件名，返回图片id
exports.addImage = function (name) {
  return new Promise(function(resolve, reject) {
    // created是创建的时间戳
    var sql = "INSERT INTO `images` (`name`, `created`) VALUES (?, ?)";
    DB.run(sql, name, Math.floor(Date.now() / 1000), function (err) {
      if (err) return reject(err);
      var { lastID } = this;
      resolve({ lastID });
    })
  });
}

// 根据id查找图片
exports.getImage = function (id) {
  // body...
};
