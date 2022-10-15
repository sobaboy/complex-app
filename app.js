const express = require("express");
const app = express();

app.get("/", function (req, res) {
  res.send("우리 앱에 오신 것을 환영합니다");
});

app.listen(3000);
