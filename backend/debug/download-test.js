const fs = require('fs');
const axios = require('axios');

function download(url, dest) {
  return new Promise(function(resolve, reject) {
    var file = fs.createWriteStream(dest);
    axios.get(url, {
      responseType:'stream'
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

download("https://wx4.sinaimg.cn/mw690/6b6e21dely1fno6wqjfhhj20rs1dchbs.jpg", "test.jpg")
  .then(function () {
    console.log("success");
  })
  .catch(function (err) {
    console.log(err);
  })
