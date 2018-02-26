const fs = require('fs');
const axios = require('axios');

// 下载文件函数
exports.downloadFile = function (url, dest) {
  return new Promise(function(resolve, reject) {
    var file = fs.createWriteStream(dest);
    axios.get(url, {
      responseType: 'stream'
    })
    .then(function(response) {
      response.data.pipe(file);
      file.on('finish', function() {
        file.close(function () {
          resolve();
        });  // close() is async, call cb after close completes.
      });
    })
    .catch(function (err) {
      fs.unlink(dest);
      reject(err);
    });
  });
}
