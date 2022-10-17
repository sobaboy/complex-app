const Post = require("../models/Post");
const { post } = require("../router");
exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(function () {
      res.send("새 포스트 생성");
    })
    .catch(function (errors) {
      res.send(errors);
    });
};
exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post: post });
  } catch {
    res.render("404");
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id);
    res.render("edit-post", { post: post });
  } catch {
    res.render("404");
  }
};
