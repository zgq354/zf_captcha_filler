const images = require('../proxy/images');

images.addImage("images Test")
  .then(function ({ lastID }) {
    console.log("Insert successful! lastID=", lastID);
  })
