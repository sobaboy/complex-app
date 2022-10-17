const { ObjectID } = require("bson");
const postsCollection = require("../db").db().collection("post");
const ObjectId = require("mongodb").ObjectId;
const User = require("./User");

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
        // save post into database
        postsCollection
          .insertOne(this.data)
          .then(() => {
            resolve();
          })
          .catch(() => {
            this.errors.push("Please try again later.");
            reject(this.errors);
          });
      } else {
        reject(this.errors);
      }
    });
  }
}

Post.reusablePostQuery = function (uniqueOperations, visitorId) {
  return new Promise(async function (resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDocument",
        },
      },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: "$author",
          author: { $arrayElemAt: ["$authorDocument", 0] },
        },
      },
    ]);
    let posts = await postsCollection.aggregate(aggOperations).toArray();

    // clean up author property in each post object
    posts = posts.map(function (post) {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };

      return post;
    });

    resolve(posts);
  });
};

Post.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != "string" || !ObjectId.isValid(id)) {
      reject();
      return;
    }
    let posts = await Post.reusablePostQuery(
      [{ $match: { _id: new ObjectID(id) } }],
      visitorId
    );

    if (posts.length) {
      console.log(posts[0]);
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

Post.findByAuthorId = function (authorId) {
  return Post.reusablePostQuery([
    { $match: { author: authorId } },
    { $sort: { createdDate: -1 } },
  ]);
};

module.exports = Post;
