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
