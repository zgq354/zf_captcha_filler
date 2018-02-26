// 设置表代理层
const DB = require('../common/database').DB;

// 根据 key 获取 value
exports.get = function (key) {
  return new Promise(function(resolve, reject) {
    let sql = "SELECT `value` FROM `settings` WHERE `key` = ?";
    DB.get(sql, key, function (err, data) {
      if (err) return reject(err);
      console.log(data);
      if (!data) {
        resolve();
      } else {
        resolve(JSON.parse(data.value));
      }
    });
  });
}

// 根据 key 设置 value
exports.set = function (key, value) {
  return new Promise(function(resolve, reject) {
    // 先查询一下看它是否存在
    exports.get(key).then((data) => {
      let sql;
      // 不存在的时候就插入
      if (data === undefined) {
        sql = "INSERT INTO `settings` (`value`, `key`) VALUES (?, ?)";
      } else {
        sql = "UPDATE `settings` SET `value` = ? WHERE `key` = ?";
      }
      DB.run(sql, JSON.stringify(value), key, function (err) {
        if (err) return reject(err);
        var { lastID } = this;
        resolve({ lastID });
      });
    }).catch(function (err) {
      reject(err);
    });
  });
};

// 移除某个key的值
exports.remove = function (key) {
  return new Promise(function(resolve, reject) {
    let sql = "DELETE FROM `settings` WHERE `key` = ?";
    DB.run(sql, key, function (err) {
      if (err) return reject(err);
      resolve();
    })
  });
};
