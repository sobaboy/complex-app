const bcrypt = require("bcryptjs");
const usersCollection = require("../db").db().collection("users");
const validator = require("validator");
class User {
  constructor(data) {
    this.data = data;
    this.errors = [];
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
    // get rid of bogus properties
    this.data = {
      username: this.data.username.trim().toLowerCase(),
      email: this.data.email.trim().toLowerCase(),
      password: this.data.password,
    };
  }
  validate() {
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
    // Step #1 : Validate user data
    this.cleanUp();
    this.validate();
    // Step #2: Only if there are no validation errors then save the user data into database
    if (!this.errors.length) {
      // hash user password
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      usersCollection.insertOne(this.data);
    }
  }
}

module.exports = User;
