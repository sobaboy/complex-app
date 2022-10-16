const bcrypt = require("bcryptjs");
const { resolve } = require("path");
const usersCollection = require("../db").db().collection("users");
const validator = require("validator");
const md5 = require("md5");

class User {
  constructor(data, getAvatar) {
    this.data = data;
    this.errors = [];
    if (getAvatar == undefined) {
      getAvatar = false;
    }
    if (getAvatar) {
      this.getAvatar();
    }
  }
  cleanUp() {
    if (typeof this.data.username != "string") {
      this.data.username = "";
    }
    if (typeof this.data.email != "string") {
      this.data.email = "";
    }
    if (typeof this.data.password != "string") {
      this.data.password = "";
    }

    // get rid of any bogus properties
    this.data = {
      username: this.data.username.trim().toLowerCase(),
      email: this.data.email.trim().toLowerCase(),
      password: this.data.password,
    };
  }
  validate() {
    return new Promise(async (resolve, reject) => {
      if (this.data.username == "") {
        this.errors.push("이름을 추가 해주세요");
      }
      if (
        this.data.username != "" &&
        !validator.isAlphanumeric(this.data.username)
      ) {
        this.errors.push("사용자이름은 문자와 숫자만 포함할 수 있습니다");
      }
      if (!validator.isEmail(this.data.email)) {
        this.errors.push("유효한 이메일을 추가 해주세요");
      }
      if (this.data.password == "") {
        this.errors.push("비밀번호를 추가 해주세요");
      }
      if (this.data.password.length > 0 && this.data.password.length < 8) {
        this.errors.push("비밀번호는 최소 8자 이상이어야 합니다.");
      }
      if (this.data.password.length > 30) {
        this.errors.push("비밀번호는 30자를 초과할 수 없습니다.");
      }
      if (this.data.username.length > 0 && this.data.username.length < 2) {
        this.errors.push("사용자이름은 최소 2글자 이상이어야 합니다.");
      }
      if (this.data.username.length > 30) {
        this.errors.push("사용자이름는 30글자를 초과할 수 없습니다.");
      }
      // username이 valid 할 경우에만 그 다음에 DB로 접근해서 이미 존재하는 name 인지 check하도록
      if (
        this.data.username.length > 2 &&
        this.data.username.length < 31 &&
        validator.isAlphanumeric(this.data.username)
      ) {
        let usernameExists = await usersCollection.findOne({
          username: this.data.username,
        });
        if (usernameExists) {
          this.errors.push("이미 사용 중인 사용자이름입니다");
        }
      }
      // email
      if (validator.isEmail(this.data.email)) {
        let emailExists = await usersCollection.findOne({
          email: this.data.email,
        });
        if (emailExists) {
          this.errors.push("이미 사용 중인 E-mail 입니다");
        }
      }
      resolve();
    });
  }

  login() {
    return new Promise((resolve, reject) => {
      this.cleanUp();
      usersCollection
        .findOne({ username: this.data.username })
        .then((attemptedUser) => {
          if (
            attemptedUser &&
            bcrypt.compareSync(this.data.password, attemptedUser.password)
          ) {
            this.data = attemptedUser;
            this.getAvatar();
            resolve("환영합니다!");
          } else {
            reject("유효하지 않은 사용자이름, 비밀번호입니다");
          }
        })
        .catch(() => {
          reject("다시 시도하세요");
        });
    });
  }

  register() {
    return new Promise(async (resolve, reject) => {
      // Step #1 : Validate user data
      this.cleanUp();
      await this.validate();
      // Step #2: Only if there are no validation errors then save the user data into database
      if (!this.errors.length) {
        // hash user password
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt);
        await usersCollection.insertOne(this.data);
        this.getAvatar();
        resolve();
      } else {
        reject(this.errors);
      }
    });
  }
  getAvatar() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
  }
}

User.findByUsername = function (username) {
  return new Promise(function (resolve, reject) {
    if (typeof username != "string") {
      reject();
      return;
    }
    usersCollection
      .findOne({ username: username })
      .then(function (userDoc) {
        if (userDoc) {
          userDoc = new User(userDoc, true);
          userDoc = {
            _id: userDoc.data._id,
            username: userDoc.data.username,
            avatar: userDoc.avatar,
          };
          resolve(userDoc);
        } else {
          reject();
        }
      })
      .catch(function () {
        reject();
      });
  });
};

module.exports = User;
