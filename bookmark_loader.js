(async () => {
  window.captchaBaseURL = "http://localhost:3000";
  const BASE_URL = window.captchaBaseURL;
  try {
    // 环境判断
    if (!document.getElementById("txtSecretCode")) {
      throw "脚本运行环境异常，请检查";
    }
    if (!window.recognizeCaptha) {
      // 先检查本地有没有
      let script = JSON.parse(localStorage.getItem("captchaScripts"));
      if (!script) {
        let response = await fetch(BASE_URL + "/script/get");
        let { data, version } = await response.json();
        // console.log(data, version);
        script = {
          version,
          data
        };
        // 存入本地
        localStorage.setItem("captchaScripts", JSON.stringify(script));
        localStorage.setItem("versionLastCheckTime", JSON.stringify(Date.now()));
      }
      // 运行脚本
      eval(script.data);
    }
    // 运行识别函数
    await window.recognizeCaptha();
    // 识别以后需要执行的任务可以写在下面
    // .......
  } catch(e) {
    console.log("Oops, error", e);
    if (window.showModel) {
      showModel("Oops, 出错了", `${e}`);
    } else {
      alert("出错了\n" + e);
    }
  }
})();
