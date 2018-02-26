var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
var fs = require('fs');

var Utils = require('../common/utils');
var Images = require('../proxy/images');
var Char = require('../proxy/char');
var Settings = require('../proxy/settings');

const VERSION_KEY = "charVersion";

/* GET index page. */
router.get('/', function(req, res, next) {
  res.render('gen');
});

/* GET test page. */
router.get('/test', function(req, res, next) {
  res.render('index');
});

// 代理下载图片
router.get('/captcha/proxy', function (req, res, next) {
  // 获取验证码的URL
  const url = "https://jwc.scnu.edu.cn/CheckCode.aspx";
  // 代理图片
  request.get(url).pipe(res);
});

/* GET train page. */
router.get('/train', function(req, res, next) {
  res.render('train');
});

// 获取新的验证码，返回下载好的验证码的路径
router.get('/train/captcha', function(req, res, next) {
  // 图片文件名
  let fileName = (Math.random() * 100).toString(36).substr(3) + ".gif";
  // 图片绝对路径
  let filePath = path.join(process.cwd(), 'data', 'captcha', fileName);
  // 获取验证码的URL
  const url = "https://jwc.scnu.edu.cn/CheckCode.aspx";
  // 下载验证码文件
  Utils.downloadFile(url, filePath)
    .then(function () {
      console.log("downloaded");
      // 把图片信息记录在数据库中
      return Images.addImage(fileName);
    })
    .then(function (result) {
      let { lastID } = result;
      // 返回图片名字
      res.send({
        success: true,
        data: {
          fileName,
          id: lastID
        }
      });
    })
    .catch(function (err) {
      console.log(err);
      res.send({
        success: false
      })
    });
});

// 获取字符列表
router.get('/chars/get', function (req, res, next) {
  Promise.all([Char.getAllChars(), Settings.get(VERSION_KEY)])
    .then((dataArr) => {
      res.send({
        success: true,
        data: dataArr[0],
        version: dataArr[1] || null
      });
    }).catch(function (err) {
    console.log(err);
    res.send({
      success: false
    });
  });
});

// 获取字符列表版本，检测是否更新
router.get('/chars/version', function (req, res, next) {
  Settings.get(VERSION_KEY)
    .then(function (version) {
      res.send({
        success: true,
        version: version || null
      })
    }).catch(function (err) {
    console.log(err);
    res.send({
      success: false
    });
    });
});

// 保存字符数组
router.post('/chars/add', function (req, res, next) {
  let { char, data, width, height, imageId, order } = req.body;
  // console.log(req.body);
  // 错误处理函数
  function errorHandler(err) {
    console.log(err);
    res.send({
      success: false
    });
  }

  // 获取版本
  Settings.get(VERSION_KEY)
    .then(function (version) {
      if (version === undefined) version = 0;
      // 添加新记录
      Char.addChar({
        char,
        data,
        width,
        height,
        imageId,
        order
      }).then(function ({ lastID }) {
        // 版本号+1
        version++;
        Settings.set(VERSION_KEY, version);
        res.send({
          success: true
        });
      }).catch(function (err) {
        errorHandler(err);
      });
  }).catch(function (err) {
    errorHandler(err);
  });
});

const SCRIPT_CURRENT_VERSION = 1;

// 脚本版本号
router.get('/script/version', function (req, res, next) {
  res.send({
    success: true,
    version: SCRIPT_CURRENT_VERSION
  })
});

// 获取最新版本脚本字符串
router.get('/script/get', function (req, res, next) {
  fs.readFile(`scripts/${SCRIPT_CURRENT_VERSION}.js`, function (err, data) {
    if (err) {
      console.log(err);
      res.send({
        success: false
      });
      return;
    }
    res.send({
      success: true,
      version: SCRIPT_CURRENT_VERSION,
      data: data.toString(),
    });
  });
});


module.exports = router;
