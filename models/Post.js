const { ObjectID } = require("bson");

const postsCollection = require("../db").db().collection("post");
const ObjectId = require("mongodb").ObjectId;

class Post {
  constructor(data, userId) {
    this.data = data;
    this.errors = [];
    this.userId = userId;
  }
  cleanUp() {
    if (typeof this.data.title != "string") {
      this.data.title = "";
    }
    if (typeof this.data.body != "string") {
      this.data.body = "";
    }
    // get rid of any bogus properties
    this.data = {
      title: this.data.title,
      body: this.data.body,
      createdDate: new Date(),
      author: ObjectId(this.userId),
    };
  }

  validate() {
    if (this.data.title == "") {
      this.errors.push("제목을 작성해야합니다");
    }
    if (this.data.body == "") {
      this.errors.push("본문에 내용이 없습니다");
    }
  }
  create() {
    return new Promise((resolve, reject) => {
      this.cleanUp();
      this.validate();
      if (!this.errors.length) {
        // save
        postsCollection
          .insertOne(this.data)
          .then(() => {
            resolve();
          })
          .catch(() => {
            this.errors.push("나중에 다시 시도해주세요");
            reject(this.errors);
          });
      } else {
        reject(this.errors);
      }
    });
  }
}

Post.findSingleById = function (id) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != "string" || !ObjectID.isValid(id)) {
      reject();
      return;
    }
    let post = await postsCollection.findOne({ _id: new ObjectID(id) });
    if (post) {
      resolve(post);
    } else {
      reject();
    }
  });
};
module.exports = Post;
