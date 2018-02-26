//
// Lovingly By © 2018 ISCNU Technology Department  L__(●'◡'●)ﾉ♥
//


// --------------- common.js ----------------

// 定义一个 GrayImage 数据类型
function GrayImage(width, height, dataArr) {
  this.width = width;
  this.height = height;

  // 预先设置图片数据
  if (dataArr) {
    this.imageData = dataArr;
  } else {
    this.imageData = [];
    // 初始化：所有像素点置0
    for (let i = 0; i < this.width * this.height; i++) {
      this.imageData.push(0);
    }
  }
}

// 获取坐标对应像素点的值
GrayImage.prototype.get = function (x, y) {
  return this.imageData[y * this.width + x];
};

// 设置像素点的值
GrayImage.prototype.set = function (x, y, value) {
  this.imageData[y * this.width + x] = value;
};

// 去除四周空白部分
GrayImage.prototype.removeBlank = function () {
  let newImageData = [];
  // 上下左右边界
  let u = this.height * 2;
  let d = 0;
  let l = -1;
  let r = 0;
  // 按竖线来扫描
  for (let i = 0; i < this.width; i++) {
    // 统计数量，方便区分左右边界
    let count = 0;
    for (let j = 0; j < this.height; j++) {
      // console.log(i, j, this.get(i, j));
      if (parseInt(this.get(i, j)) === 1) {
        count++;
        // 上边界
        if (j < u) {
          u = j;
        }
        // 下边界
        if (j > d) {
          d = j;
        }
      }
    }
    // 左边界，如果l没被赋值过就设置初值，以后都不变了
    if (count > 0 && l === -1) {
      l = i;
    }
    // 右边界
    if (count > 0 && r < i) {
      r = i;
    }
  }
  // 若u没有改变，说明没扫到像素点
  if (u === this.height * 2) {
    u = 0;
  }
  // 保存到数组里面
  for (let i = u; i < d + 1; i++) {
    for (let j = l; j < r + 1; j++) {
      // console.log(this.get(j, i));
      newImageData.push(this.get(j, i));
    }
  }
  this.imageData = newImageData;
  // 新的宽高
  this.width = r - l + 1;
  this.height = d - u + 1;
}

// 绕中心点旋转一定角度，返回一个旋转后的GrayImage
GrayImage.prototype.rotate = function (deg) {
  // 创建一个 30 x 30 的临时画布
  let grayChar = new GrayImage(30, 30);
  // 开始旋转，像素矩阵需要经过旋转矩阵变换得到新的矩阵
  let tx = Math.round(this.width / 2);
  let ty = Math.round(this.height / 2);
  for (let i = 0; i < this.width; i++) {
    for (let j = 0; j < this.height; j++) {
      let axis = rotate(i, j, tx, ty, deg * Math.PI / 180); // 旋转角，需要转换为弧度制
      // console.log(i, j, axis);
      // +8是为了把旋转后的图形平移到可视范围，方便进一步切割
      grayChar.set(axis.rx + 8, axis.ry + 8, this.get(i, j));
    }
  }
  // 返回之前去除多余空白
  grayChar.removeBlank();
  return grayChar;

  //
  // 旋转角度函数，基于齐次坐标的线性变换
  // 待完善。。。
  // 未来可以考虑用插值算法
  // http://blog.csdn.net/csxiaoshui/article/details/65446125
  //
  function rotate(x, y, tx, ty, angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    let rx = Math.round(x * cos - y * sin + (1 - cos) * tx + sin * ty);
    let ry = Math.round(x * sin + y * cos + (1 - cos) * ty - sin * tx);
    return { rx, ry };
  }
}

// 获得标准化字符（把歪了的字符转回来）
GrayImage.prototype.normalize = function () {
  let charList = [];
  let minIndex = -1;
  let minWidth = this.width;
  // 从-25度旋转到25度，比较宽度，找到宽度最小的一个
  for (let i = -25; i <= 25; i += 2) {
    let newChar = this.rotate(i);
    charList.push(newChar);
    if (newChar.width < minWidth) {
      minWidth = newChar.width;
      minIndex = charList.length - 1;
    }
  }
  if (minIndex === -1)
  return this;
  // console.log(minWidth, minIndex);
  return charList[minIndex];
};

// 通过 Canvas API 把二值化图形可视化
GrayImage.prototype.draw = function (ctx) {
  let imgArr = new Uint8ClampedArray(4 * this.width * this.height);
  for (let i = 0; i < this.width * this.height; i++) {
    for (let j = 0; j < 3; j++) {
      imgArr[4 * i + j] = this.imageData[i] * 255;
    }
    imgArr[4 * i + 3] = 255;
  }

  let newImageData = new ImageData(imgArr, this.width, this.height);

  ctx.putImageData(newImageData, 0, 0);
};

// 去除孤立噪点
GrayImage.prototype.removeNoise = function () {
  this.imageData.forEach((v, i) => {
    // 第几行 i / width
    // 第几列 i % width
    let x = i % this.width, y = parseInt(i / this.width);
    // console.log(x, ', ', y);
    let u = this.get(x, y - 1) !== 0;
    let d = this.get(x, y + 1) !== 0;
    let l = this.get(x - 1, y) !== 0;
    let r = this.get(x + 1, y) !== 0;
    // 判断像素四周是否为孤立的像素点，没有就设置为0
    // console.log(u + d + l + r);
    if (v == 1 && (u + d + l + r) < 2) {
      this.imageData[i] = 0;
    }
    // if (v == 1 && (!u && !d && !l && !r
    //   || u && !d && !l && !r
    //   || !u && d && !l && !r
    //   || !u && !d && l && !r
    //   || !u && !d && !l && r
    // )) {
    //   this.imageData[i] = 0;
    // }
  });
};

// 将图片元素二值化，返回一个二值化图片对象
function binaryImage(img) {
  // 获取图片宽高
  const { width, height } = img;
  // 通过 canvas 存图片
  const canvas = document.createElement("canvas");
  // 设置 canvas 的宽高
  canvas.width = width;
  canvas.height = height;
  // context
  const ctx = canvas.getContext("2d");
  // 把验证码绘制到canvas中
  ctx.drawImage(img, 0, 0);
  // 提取像素颜色数组
  let imageData = ctx.getImageData(0, 0, width, height).data;

  // 下一步，二值化
  let grayImageData = [];
  for (let i = 0; i < 4 * width * height; i += 4) {
    // 排列依次是RGBA的顺序
    // 玄学调参开始了～
    // 策略，蓝色优先
    let white = imageData[i] < 105 && imageData[i + 1] < 105 && imageData[i + 2] > 100;
    // if (weight > 150)
    grayImageData.push(white ? 1 : 0);
  }

  let grayImage = new GrayImage(width, height, grayImageData);

  // 返回之前先去除噪点
  grayImage.removeNoise();

  return grayImage;
}

// 平均分割图片区域，通过回调传递分割结果
function partImageArea(img, grayImage, num, callback) {
  // 分割大的部分
  let dx = 0;
  let sumdx = 0; // 记录之前的区域和
  let dy = img.dy;
  let sx = img.sx;
  let sy = img.sy;
  for (let j = 0; j < num; j++) {
    // 初始化sx
    sx = sx + dx;
    // 初始化dx，考虑最后一个的情况
    dx = j === num - 1 ? img.dx - sumdx : Math.round(img.dx / num);
    // push进去之前先扫描一下上下边界
    // 跑一遍，得到上下边界，顺便判断是否应该
    let min = 0, max = 0;
    // 记录之前扫描的结果，以便判断是否最优
    let countArr = [];
    for (let k = sx; k <= sx + dx; k++) {
      let count = 0;
      for (let l = sy; l < sy + img.dy; l++) {
        if (parseInt(grayImage.get(k, l)) === 1) {
          count++;
          if (min === 0 || l < min) {
            min = l;
          }
          if (l > max) {
            max = l;
          }
        }
      }
      // 最后结束的时候比较前两次的结果，决定接下来的sx从哪里开始
      // 可能有缺陷，需要继续改进
      // 最后一个不做切割
      if (k === sx + dx && j !== num - 1) {
        if (count > countArr[countArr.length - 1] && countArr[countArr.length - 1] > countArr[countArr.length - 2]) {
          // 往前数第二个最大
          dx -= 2;
        } else if (count > countArr[countArr.length - 1] && countArr[countArr.length - 1] < countArr[countArr.length - 2]) {
          // 前一个最小
          dx -= 1;
        }
      }
      // 记录搜索结果
      countArr.push(count);
    }
    // 计算宽度和
    sumdx += dx;
    // 切割后的图片
    callback({
      sx,
      sy: min,
      dx,
      dy: max - min + 1,
    });
  }
}

function processImg(img) {
  // console.log("image loaded");
  // 二值化图片
  const grayImage = binaryImage(img);

  //
  // 开始下一步：字符分割操作
  // 保存字符坐标的数组
  let imgs = [];
  // sx, sy: 字符起始坐标, dx, dy: 字符宽度
  let sx = 0, sy = 0, dx = 0, dy = 0;
  // 标记一个字符扫描的开始
  let start = false;
  // 存储已扫描字符的宽度
  let width = 0;
  for (let i = 0; i < grayImage.width; i++) {
    // 统计每次纵向扫描中1的数目
    let count = 0;
    // 纵向扫描
    // 保存最小和最大的纵坐标
    let min = 0, max = 0;
    // 统计每次扫描最高和最低像素点的高度差
    let height = 0;
    for (let j = 0; j < grayImage.height; j++) {
      count += parseInt(grayImage.get(i, j));
      if (parseInt(grayImage.get(i, j)) === 1) {
        // 扫描到的纵坐标范围
        if (min === 0 || j < min) {
          min = j;
        }
        if (j > max) {
          max = j;
        }
        height = max - min + 1;
        // 字符的纵坐标
        if (sy === 0 || j < sy) {
          dy += sy - j; // 当sy向上扩展时候，dy也同时加上
          sy = j;
        }
        // 若产生最大的高度则更新dy
        if (j - sy + 1 > dy) {
          dy = j - sy + 1;
        }
      }
    }

    // 标记起始记号
    if (!start && height >= 1) {
      start = true;
      // 记录起始的横坐标
      sx = i;
      width = 0;
      // 判断结束一个字母的条件
      // 先来一个粗略的切割，把一定可以分开的字符分开
    } else if (start && count === 0) {
      // 结束了，保存最终的坐标，还原
      dx = i - sx;
      imgs.push({
        sx,
        sy,
        dx,
        dy
      });
      // console.log(`${dy}\t${dx}`);
      sx = sy = dx = dy = 0;
      start = false;
    } else {
      width++;
    }
  }

  // console.log(imgs);
  // 粘连的处理
  // 注意到正方的验证码的字符分布较为均匀
  // 所以尝试通过把宽度等分的方式来分割验证码
  let newImages = [];
  if (imgs.length === 3) {
    // 两个粘连的情况，宽度最大的绝大多数情况都是粘连的那两个
    let index = 0;
    // 寻找最大的那个小图
    for (let i = 0; i < 3; i++) {
      if (imgs[i].dx > imgs[index].dx) {
        index = i;
      }
    }
    // 遍历数组，按顺序加入
    for (let i = 0; i < 3; i++) {
      if (i === index) {
        // 分割图片
        partImageArea(imgs[i], grayImage, 2, function (area) {
          newImages.push(area);
        });

      } else {
        newImages.push(imgs[i]);
      }
    }
    // console.log(newImages);
    imgs = newImages;
  } else if (imgs.length === 2) {
    // 首先区分两张小图片中哪一张比较大
    let minIndex = imgs[0].dx > imgs[1].dx ? 1 : 0;
    let maxIndex = imgs[0].dx > imgs[1].dx ? 0 : 1;
    // 可能是1个独立，3个粘连，或是两两粘连的情况，通过这个if判断分开
    if (imgs[maxIndex].dx / imgs[minIndex].dx > 2) {
      // 一个独立，三个粘连的情况
      // 如果是第一个最小，则把第一个push进去
      if (minIndex === 0) {
        newImages.push(imgs[minIndex]);
      }
      // 分割三个粘连的字符
      partImageArea(imgs[maxIndex], grayImage, 3, function (area) {
        newImages.push(area);
      });
      // 如果是最后一个最小，别忘了最后把它push进去
      if (minIndex === 1) {
        newImages.push(imgs[minIndex]);
      }
    } else {
      // 接下来处理两两粘连的情况
      // 这里比较简单，循环两次即可
      for (let i = 0; i < 2; i++) {
        partImageArea(imgs[i], grayImage, 2, function (area) {
          newImages.push(area);
        });
      }
    }
    imgs = newImages;
  } else if (imgs.length === 1) {
    // 4个都粘连的情况
    // 准确率可能难以保证，可以考虑直接更新验证码了
    partImageArea(imgs[0], grayImage, 4, function (area) {
      newImages.push(area);
    });
    imgs = newImages;
  }

  // console.log(imgs);
  // 把坐标转化为真正的图片
  let charArray = [];
  imgs.forEach(function (v) {
    let imageData = [];
    for (let i = 0; i < v.dx * v.dy; i++) {
      imageData.push(grayImage.get(v.sx + i % v.dx, v.sy + parseInt(i / v.dx)));
    }
    let grayChar = new GrayImage(v.dx, v.dy);
    // grayChar.removeNoise();
    grayChar.imageData = imageData;
    charArray.push(grayChar);
  });

  // 通过旋转得到较为标准化的字符
  let newCharArray = [];
  charArray.forEach(function (char) {
    newCharArray.push(char.normalize());
  });

  return {
    raw: charArray,
    normalized: newCharArray
  };
}

// ---------------- common.js end -------------


// 访问后端接口
async function fetchURL(path) {
  try {
    let response = await fetch(window.captchaBaseURL + path);
    return await response.json();
  } catch (e) {
    return Promise.reject(e);
  }
}

//
// 网页顶部显示的通知条
let noticeBar = {
  // 指向通知条对象的元素
  element: false,
  // 定时器实例
  timer: 0,
  // 显示一条通知
  show: function (text, delay) {
    // 先把之前的条去掉
    this.remove();
    // 创建顶部的通知条
    this.element = document.createElement('div');
    this.element.style = `background: rgba(148, 148, 148, 0.47);
      color: #353535;
      width: 100%;
      position: fixed;
      top: 0px;
      left: 0px;
      text-align: center;
      padding: 8px;
      font-size: 14px;`;
    // 创建文本节点
    let span = document.createElement('span');
    span.innerText = text;
    this.element.appendChild(span);
    document.body.appendChild(this.element);

    // 支持定时消失
    if (delay) {
      this.timer = setTimeout(() => {
        this.remove();
      }, delay);
    }
  },
  // 移除通知
  remove: function () {
    if (this.element) document.body.removeChild(this.element);
    clearTimeout(this.timer);
    this.element = undefined;
  }
}

// 本地存储对象
let storage = {
  // 读取 LocalStorage
  get: function (key) {
    return JSON.parse(localStorage.getItem(key));
  },
  // 写入 LocalStorage
  set: function (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// 错误提示
function showError(err) {
  console.log("Oops, error", err);
  if (window.showModel) {
    showModel("Oops, 出错了", `${err}`);
  } else {
    alert("出错了\n" + err);
  }
}


// 莱文斯坦距离算法
// https://github.com/gustf/js-levenshtein
let levenshtein = (function()
{
  function _min(d0, d1, d2, bx, ay)
  {
    return d0 < d1 || d2 < d1 ? d0 > d2 ? d2 + 1
    : d0 + 1
    : bx === ay ? d1
    : d1 + 1;
  }

  return function(a, b)
  {
    if (a === b) {
      return 0;
    }

    if (a.length > b.length) {
      var tmp = a;
      a = b;
      b = tmp;
    }

    var la = a.length;
    var lb = b.length;

    while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
      la--;
      lb--;
    }

    var offset = 0;

    while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
      offset++;
    }

    la -= offset;
    lb -= offset;

    if (la === 0 || lb === 1) {
      return lb;
    }

    var x = 0;
    var y;
    var d0;
    var d1;
    var d2;
    var d3;
    var dd;
    var dy;
    var ay;
    var bx0;
    var bx1;
    var bx2;
    var bx3;

    var vector = [];

    for (y = 0; y < la; y++) {
      vector.push(y + 1);
      vector.push(a.charCodeAt(offset + y));
    }

    for (; (x + 3) < lb;) {
      bx0 = b.charCodeAt(offset + (d0 = x));
      bx1 = b.charCodeAt(offset + (d1 = x + 1));
      bx2 = b.charCodeAt(offset + (d2 = x + 2));
      bx3 = b.charCodeAt(offset + (d3 = x + 3));
      dd = (x += 4);
      for (y = 0; y < vector.length; y += 2) {
        dy = vector[y];
        ay = vector[y + 1];
        d0 = _min(dy, d0, d1, bx0, ay);
        d1 = _min(d0, d1, d2, bx1, ay);
        d2 = _min(d1, d2, d3, bx2, ay);
        dd = _min(d2, d3, dd, bx3, ay);
        vector[y] = dd;
        d3 = d2;
        d2 = d1;
        d1 = d0;
        d0 = dy;
      }
    }
    for (; x < lb;) {
      bx0 = b.charCodeAt(offset + (d0 = x));
      dd = ++x;
      for (y = 0; y < vector.length; y += 2) {
        dy = vector[y];
        vector[y] = dd = dy < d0 || dd < d0 ? dy > dd ? dd + 1 : dy + 1
        : bx0 === vector[y + 1] ? d0
        : d0 + 1;
        d0 = dy;
      }
    }

    return dd;
  };
})();

// charList 样本库数据对象
let charList = {
  // 按照宽度分类的字符列表
  charQueueList: null,
  // 初始化
  init: async function () {
    try {
      let lastCheckTime = storage.get("lastCheckTime");
      // 需要检查版本的时机
      if (!lastCheckTime || !storage.get("charListVersion") || Date.now() - lastCheckTime > 3600000) {
        let newVersion = await this.checkVersion();
        if (newVersion) {
          await this.download();
        }
        storage.set("lastCheckTime", Date.now());
      }
    } catch (e) {
      return Promise.reject(e);
    }
  },
  // 从服务器下载样本集
  download: async function () {
    try {
      let { success, data, version } = await fetchURL("/chars/get");
      if (!success) throw "error";
      // 保存样本集的数组
      let charList = data;
      // 按照宽度来分类样本集
      this.charQueueList = [];
      charList.forEach((v) => {
        // 创建二维数组
        if (!this.charQueueList[v.width]) {
          this.charQueueList[v.width] = [];
        }
        this.charQueueList[v.width].push(v);
      });
      // 存入缓存
      storage.set("charListVersion", version);
      storage.set("charList", this.charQueueList);
      // 开始处理
      return { version };
    } catch (e) {
      return Promise.reject(e);
    }
  },
  // 检查版本
  checkVersion: async function () {
    return new Promise(function(resolve, reject) {
      fetchURL("/chars/version")
      .then(function (res) {
        let { success, version } = res;
        if (!success) throw "error";
        // 获取本地版本号
        let ver = parseInt(storage.get("charListVersion") || 0);
        if (ver < version) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(function (err) {
        console.log(err);
        reject(err);
      });
    });
  },
  // 加载样本集
  load: async function () {
    try {
      // 如果没有样本的话就先加载
      if (!this.charQueueList) {
        // 先从本地读取
        let queueList = storage.get("charList");
        if (queueList) {
          this.charQueueList = queueList;
          noticeBar.show(`已加载样本库 ${storage.get("charListVersion")}`, 3000);
        } else {
          // 否则通过网络读取
          noticeBar.show("正在下载样本库...");
          let { version } = await charList.download();
          noticeBar.show(`已加载样本库 ${version}`, 3000);
        }
      }
    } catch (e) {
      return Promise.reject(e);
    }
  },
  // 把GrayImage转换为最接近的字符(!important)
  recognize: function (char) {
    console.log(char);
    let distance;
    let c;
    // 取出宽度对应的执行队列
    let queue = this.charQueueList[char.width];
    // console.log(queue);
    for (let i = 0; i < queue.length; i++) {
      let d = levenshtein(char.imageData.join(""), queue[i].data);
      if (distance === undefined || d < distance) {
        distance = d;
        c = queue[i];
      }
      if (distance < 4) break;
    }

    return { distance, char: c };
  },
}

// 验证码识别过程的提示框
let charsPanel = {
  // 元素容器
  container: null,
  // 字符容器
  div: null,
  // 提示文字元素
  span: null,
  // 父元素
  parent: document.getElementById('icode').parentNode,

  // 显示识别中
  start: function () {
    // 移除之前的元素
    if (this.container) this.remove();
    // 新建节点
    this.container = document.createElement("div");
    this.div = document.createElement("div");
    this.span = document.createElement("span");

    // 把元素加入DOM树
    this.container.appendChild(this.div);
    this.container.appendChild(this.span);

    // 设置显示二值化字符的框的样式
    this.container.style = `position: absolute;
      left: 210px;
      top: -11px;
      width: 80px;
      padding: 3px;
      color: white;
      background: rgb(0, 0, 0);
      text-align: center;`;
    // span
    this.span.innerText = "识别中...";
    this.span.style = "font-size: 13px";

    this.parent.appendChild(this.container);
    // 设置点击事件
    this.container.addEventListener("click", function (e) {
      window.recognizeCaptha();
    })
  },
  // 往 div 添加字符元素，这里是 canvas
  add: function (element) {
    this.div.appendChild(element);
  },
  // 显示完成状态
  finish: function (time) {
    this.span.innerText = "耗时 " + time + " ms";
  },
  // 删除原来的元素
  remove: function () {
    if (this.container) {
      // 从DOM中移除代码
      this.container.parentNode.removeChild(this.container);
      // 取消引用
      this.container = null;
      this.div = null;
      this.span = null;
    }
  }
}

// 验证码识别函数
async function processCaptcha(captchaImg) {
  try {
    // 首先确保载入样本集
    await charList.load();
  } catch (e) {
    return Promise.reject(e);
  }

  let { raw, normalized } = processImg(captchaImg);
  let input = document.getElementById("txtSecretCode");

  // 提示用户正在识别验证码
  charsPanel.start();

  // 原版字符
  raw.forEach(function (v) {
    // 通过 canvas 存图片
    let canvas = document.createElement("canvas");
    charsPanel.add(canvas);
    // 设置 canvas 的宽高
    canvas.width = v.width;
    canvas.height = v.height;
    // 每个字符的间距
    canvas.style = "margin-top: 2px; margin-right: 5px;";
    // context
    let ctx = canvas.getContext("2d");
    v.draw(ctx);
  });

  // 记录开始时间点
  let startTime = Date.now();

  // 改写成异步函数，方便其他脚本做识别后的工作
  await new Promise(function(resolve, reject) {
    // 把识别任务放到下一个MacroTask中执行，因为要先展示更新的UI
    setTimeout(function () {
      // 结果
      let result = "";
      normalized.forEach(function (v, i) {
        let { distance, char: c } = charList.recognize(v);
        console.log(distance, c);
        // console.log(v.width, c.width);
        result += c.char;
      });
      input.value = result;
      // 识别完成的提示
      charsPanel.finish(Date.now() - startTime);
      resolve();
    }, 0);
  });
}

// 其他的UI界面

// 注入CSS样式
function addCSS() {
  let css = document.createElement("style");
  css.innerHTML = `
  /* 修复辣鸡正方瞎改的样式 */
  .model-mask * {
    margin: initial;
    padding: initial;
    color: initial;
  }
  .model-mask {
    font-size: 14px;
    text-align: left;
  }
  .model-mask a, .model-mask a:visited {
    color: -webkit-link;
    text-decoration: underline;
  }
  .model-mask p {
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
  }
  .model-mask h4 {
    font-size: 14px;
    font-weight: bold;
    -webkit-margin-before: 1.33em;
    -webkit-margin-after: 1.33em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
  }
  .model-mask h3 {
    font-size: 1.17em;
    font-weight: bold;
    -webkit-margin-before: 1em;
    -webkit-margin-after: 1em;
    -webkit-margin-start: 0px;
    -webkit-margin-end: 0px;
  }
  /* 按钮样式 */
  .captcha-button {
    display: inline-block;
    border: black solid 1px !important;
    color: black;
    padding: 3px 5px;
    cursor: pointer;
    background: white;
    letter-spacing: normal;
    font-size: 13px;
    word-spacing: normal;
    height: auto;
    white-space: nowrap;
  }
  .captcha-button:hover {
    padding: 3px 5px;
    height: auto;
    color: white;
    background: black;
    letter-spacing: normal;
    border: gray solid 1px !important;
  }
  /* 模态框 */
  .model-mask {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(80, 121, 155, 0.57);
  }
  .model-container {
    position: relative;
    margin-top: 80px;
    width: 420px;
    min-height: 410px;
    background: aliceblue;
    padding: 10px 20px 20px;
    margin-left: auto;
    margin-right: auto;
  }
  /* 选项卡Tab */
  .tab-switcher {
    border-bottom: solid 1px;
    text-align: center;
    list-style: none;
    padding: 0;
    line-height: initial;
  }
  .tab-switcher li {
    display: inline-block;
    padding: 2px 10px 0;
    border: black solid 1px;
    margin-right: -5px;
    margin-bottom: -1px;
    font-size: 13px;
    color: black;
    cursor: pointer;
  }
  .tab-switcher .current {
    border-bottom: aliceblue solid 1px;
  }
  /* 关闭按钮 */
  .close-button {
    position: absolute;
    top: 5px;
    right: 10px;
    height: 15px;
    width: 15px;
    border: black solid 2px;
    cursor: pointer;
  }
  .close-button .bar {
    background: black;
    position: absolute;
    top: 6.5px;
    left: .1px;
    width: 15px;
    height: 2px;
  }
  .close-button:hover {
    background: black;
  }
  .close-button:hover .bar {
    background: white;
  }
  /* 弹框 */
  .model-confirm {
    position: relative;
    margin-top: 80px;
    width: 250px;
    background: aliceblue;
    padding: 10px 20px 20px;
    margin-left: auto;
    margin-right: auto;
  }
  .model-confirm .buttons {
    text-align: right;
    margin-top: 30px;
  }
  .model-confirm .buttons button {
    margin-left: 5px;
  }
  `;
  document.body.appendChild(css);
}

// 显示弹窗
window.showModel = function (title, content, cancelBtn) {
  return new Promise(function(resolve, reject) {
    let model = document.createElement("div");
    model.classList.add("model-mask");
    model.innerHTML = `<div class="model-confirm">
      <h3 style="border-bottom: black solid 1px;">${title}</h3>
      <div class="model-content">
      ${content}
      </div>
      <div class="buttons">
        <button class="captcha-button"${!cancelBtn ? " style='display: none;'" : ""}>取消</button>
        <button class="captcha-button">确定</button>
      </div>
      <div class="close-button">
        <div class="bar" style="transform: rotateZ(45deg);"></div>
        <div class="bar" style="transform: rotateZ(-45deg);"></div>
      </div>
    </div>`;

    // 关闭按钮
    model.getElementsByClassName("close-button")[0].addEventListener("click", function (e) {
      document.body.removeChild(model);
      resolve(false);
    });

    // 确认按钮
    model.getElementsByClassName("captcha-button")[1].addEventListener("click", function (e) {
      document.body.removeChild(model);
      resolve(true);
    });

    // 取消按钮
    model.getElementsByClassName("captcha-button")[0].addEventListener("click", function (e) {
      document.body.removeChild(model);
      resolve(false);
    });

    // 加入到body末尾
    document.body.appendChild(model);
  });
}

// 设置界面
function settingsUI(show) {
  // 各种版本号
  let script = storage.get("captchaScripts");
  let scriptVersion = script ? script.version : 0;
  let charListVersion = storage.get("charListVersion");
  // 创建界面
  let settings = document.createElement("div");
  settings.id = "setting-model";
  settings.classList.add("model-mask");
  if (!show) {
    settings.style.display = "none";
  }
  // 设置界面
  settings.innerHTML = `
    <div class="model-container">
      <h3>验证码识别模块</h3>
      <ul class="tab-switcher">
        <li>设置</li>
        <li class="current">关于</li>
        <li>赞助</li>
      </ul>
      <div class="tabs">
        <div style="display: none;">
          <h4>设置</h4>
          <p>脚本服务器：<span>${window.captchaBaseURL}</span></p>
          <p>样本库版本：<span id="charListVer">${charListVersion}</span> <a class="update-chars" href="javascript:void(0);" style="float: right;">更新样本库</a></p>
          <p>脚本版本：<span id="scriptVer">${scriptVersion}</span> <a class="update-script" href="javascript:void(0);" style="float: right;">更新脚本</a></p>
          <p><button class="captcha-button clear-btn">清空本地缓存数据</button></p>
          <p>说明：样本库与脚本会定期向服务器请求更新，若需要立即更新，可以点击上方链接手动检查更新，若脚本的运行出现问题，可清除本地缓存数据重新加载脚本。</p>
        </div>
        <div>
          <h4>关于本模块</h4>
          <p>这是一个实验项目，功能是辅助填写正方教务系统 <s>辣眼睛</s> 的验证码，有一定的几率识别错误。</p>
          <p>由于 <s>作者太菜</s> 验证码的结构较为复杂，算法较为粗糙，需要大量的样本支撑识别操作，所以主程序和识别库均由远程服务器加载（识别算法位于浏览器端）。识别速度取决于您的电脑的CPU速度，主程序也在不断优化之中。</p>
          <p><b>使用前请确保脚本以及服务来源可信，否则可能有盗号风险，请谨慎使用。由于使用本程序产生的不良后果，作者概不负责。</b></p>
          <p>作者：<a href="https://blog.izgq.net/about-me.html" target="_blank">qing</p>
          <p><a href="https://i.scnu.edu.cn/" target="_blank">ISCNU网络协会</a> 技术部荣誉出品</p>
        </div>
        <div style="display: none;">
          <h4>支持作者</h4>
          <p>如果您觉得这个项目节约了您的宝贵时间，不妨考虑支持一下作者？</p>
          <p>给不给随意，金额也随意咯，扫个红包也可以哒</p>
          <p style="text-align: center;">
            <img src="https://blog.izgq.net/usr/uploads/2017/10/1524376771.png" style="max-width: 31%; margin: 0 3px;">
            <img src="https://blog.izgq.net/usr/uploads/2017/10/541269534.jpg" style="max-width: 31%; margin: 0 3px;">
            <img src="https://blog.izgq.net/usr/uploads/2018/02/3714364769.jpg" style="max-width: 31%; margin: 0 3px;">
          </p>
        </div>
      </div>
      <div class="close-button">
        <div class="bar" style="transform: rotateZ(45deg);"></div>
        <div class="bar" style="transform: rotateZ(-45deg);"></div>
      </div>
    </div>
  `;

  // 关闭按钮
  settings.getElementsByClassName("close-button")[0].addEventListener('click', function (e) {
    settings.style.display = "none";
  });

  // tabs的实现
  let tabs = settings.getElementsByClassName('tabs')[0].getElementsByTagName('div');
  let tabSwitcher = settings.getElementsByClassName('tab-switcher')[0].getElementsByTagName('li');
  for (let i = 0; i < tabSwitcher.length; i++) {
    tabSwitcher[i].addEventListener("mouseover", function (e) {
      // 先隐藏所有标签
      for (let j = 0; j < tabs.length; j++) {
        tabs[j].style.display = "none";
      }
      // 再把所有的current去掉
      for (let j = 0; j < tabSwitcher.length; j++) {
        tabSwitcher[j].classList.remove("current");
      }
      // 设置当前标签
      tabs[i].style.display = "block";
      tabSwitcher[i].classList.add("current");
    });
  }

  // 清空缓存数据
  settings.getElementsByClassName('clear-btn')[0].addEventListener('click', function (e) {
    console.log("clear button clicked");
    localStorage.removeItem("charList");
    localStorage.removeItem("charListVersion");
    localStorage.removeItem("captchaScripts");
    localStorage.removeItem("lastCheckTime");
    localStorage.removeItem("versionLastCheckTime");
    localStorage.removeItem("cancelScriptUpgrade");
    localStorage.removeItem("first-time-v1");
    showModel("清空本地缓存", "本地缓存清空成功！！").then(function (status) {
      if (status) {
        location.reload();
      }
    });
  });

  // 更新样本库的操作
  settings.getElementsByClassName('update-chars')[0].addEventListener('click', async function (e) {
    console.log("update-chars link clicked");
    try {
      e.target.innerText = "检查更新中...";
      let newVersion = await charList.checkVersion();
      e.target.innerText = "更新样本库";
      if (newVersion) {
        let newVer = await charList.download();
        showModel("更新样本库", "样本库已更新，当前版本：" + newVer);
      } else {
        showModel("更新样本库", "当前样本库已是最新版本，无须更新");
      }
      storage.set("lastCheckTime", Date.now());
    } catch (e) {
      showError(e);
    }
  });

  // 更新脚本的操作
  settings.getElementsByClassName('update-script')[0].addEventListener('click', async function (e) {
    console.log("update-script link clicked");
    try {
      e.target.innerText = "更新中...";
      let response = await fetch(window.captchaBaseURL + "/script/get");
      let { data, version } = await response.json();
      e.target.innerText = "更新脚本";
      console.log(data, version);
      script = {
        version,
        data
      };
      // 版本号
      document.getElementById("scriptVer").innerText = `${version}`;
      // 存入本地
      localStorage.setItem("captchaScripts", JSON.stringify(script));
      localStorage.setItem("versionLastCheckTime", JSON.stringify(Date.now()));
      localStorage.removeItem("cancelScriptUpgrade");
      showModel("更新脚本", "脚本已更新<br>当前版本：" + version + "<br>重新加载网页后生效")
      .then(function (status) {
        if (status) {
          location.reload();
        }
      });
    } catch (e) {
      showError(e);
    }
  });

  document.body.appendChild(settings);

  // 设置按钮
  let button = document.createElement("div");
  button.id = "setting-btn";
  button.style = `
    position: absolute;
    left: 207px;
    top: 42px;
    `;
  button.innerHTML = `<button class="captcha-button">识别脚本设置</button>`;
  document.getElementById('icode').parentNode.appendChild(button);

  button.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('setting-model').style.display = "block";
  });
}

// 调整原本输入框的UI
function adjustZFUI() {
  document.getElementById("icodems").style.display = "none";
  document.getElementById("icode").style.left = "125px";
  document.getElementById("txtSecretCode").style.width = "50px";
}

// 初始化脚本
// 在charList初始化以后再进行操作
let loaded = false;
// 防止同时多次init出事
let loading = false;
async function init() {
  try {
    if (loaded || loading) return;
    loading = true;
    // 插入CSS
    addCSS();
    adjustZFUI();
    // 初始化 charList
    await charList.init();
    // 初始化界面，第一次使用则弹出帮助
    settingsUI(!storage.get('first-time-v1'));
    storage.set('first-time-v1', true);
    loaded = true;
    loading = false;
    // 检查更新
    let version = 1;
    let lastCheckTime = storage.get("versionLastCheckTime");
    if (!version || !lastCheckTime || Date.now() - lastCheckTime > 7200000 && !storage.get("cancelScriptUpgrade")) {
      let obj = await fetchURL("/script/version");
      if (version !== obj.version) {
        // 更新操作
        let result = await showModel("发现新版本程序", "是否更新？", true);
        if (result) {
          let { data, version } = await fetchURL("/script/get");
          console.log(data, version);
          script = {
            version,
            data
          };
          // 版本号
          document.getElementById("scriptVer").innerText = `${version}`;
          // 存入本地
          localStorage.setItem("captchaScripts", JSON.stringify(script));
          localStorage.removeItem("cancelScriptUpgrade");
          showModel("更新脚本", "脚本已更新<br>当前版本：" + version + "<br>重新加载网页后生效")
          .then(function (status) {
            if (status) {
              location.reload();
            }
          });
        } else {
          // 取消更新
          storage.set("cancelScriptUpgrade", true);
        }
      }
      storage.set("versionLastCheckTime", Date.now());
    }
  } catch (e) {
    return Promise.reject(e);
  }
};
// 验证码图片元素
let icode = document.getElementById("icode");

// 写入Window对象
window.recognizeCaptha = async function () {
  try {
    if (!loaded) {
      await init();
    }
    await processCaptcha(icode);
  } catch (e) {
    showError(e);
  }
}

// 注册图片加载成功事件，开始验证码识别
icode.onload = function (e) {
  window.recognizeCaptha();
}
