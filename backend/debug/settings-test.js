const settings = require('../proxy/settings');

settings.get("test")
  .then(function () {
    settings.set("test", "Just Do IT").then(function ({ lastID }) {
      console.log(lastID);
      settings.get("test").then(function (data) {
        console.log("get", data);
      })
    });
  });
