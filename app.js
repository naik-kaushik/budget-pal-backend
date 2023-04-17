const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const moment = require("moment");
require("dotenv").config();
const { userSchema } = require("./models/user");
const Expense = require("./models/expense");
const userDetail = require("./models/userDetails");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { json } = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect(process.env.MONGO_URI).then(console.log("DB CONNECTED"));

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json("Welcome");
  } else {
    res.status(401).json("Not Authorized");
  }
});

app.post("/signup", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.status(501).json("Some error occurred!");
      } else {
        const newUser = new userDetail({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          username: req.body.username,
          idealBudget: {
            transportaion: 0,
            groceries: 0,
            food: 0,
            utilitybills: 0,
            rent: 0,
            miscellaneous: 0,
          },
          actualBudget: {
            transportaion: 0,
            groceries: 0,
            food: 0,
            utilitybills: 0,
            rent: 0,
            miscellaneous: 0,
          },
          favStocks: [],
        });
        newUser.save();
        passport.authenticate("local")(req, res, function () {
          res.status(200).json("Sign Up successful!");
        });
      }
    }
  );
});

app.get("/login", function (req, res) {
  if (req.isAuthenticated()) {
    res.status(200).json("Authorized");
  } else {
    res.status(401).json("Unauthorized");
  }
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.status(401).json("Invalid Credentials");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.status(200).json("Log in successful!");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    res.send(err);
  });
  res.status(200).json("Logged out successfully!");
});

app.get("/actual-budget", function (req, res) {
  if (req.isAuthenticated()) {
    userDetail.findOne({ username: req.user.username }).then((result) => {
      console.log(result);
      res.status(200).json(result.actualBudget);
    });
  } else {
    res.status(401).json("Unauthorized");
  }
});

app.get("/get-average/:category", function (req, res) {
  const cat = req.params.category;
  Expense.find({ category: cat }).then((total) => {
    var sum = 0;
    var n = 0;
    total.forEach((el) => {
      sum += el.value;
      n += 1;
    });
    res.status(200).json(sum / n);
  });
});

app.get("/ideal-budget", function (req, res) {
  if (req.isAuthenticated()) {
    userDetail.findOne({ username: req.user.username }).then((result) => {
      // console.log(result);
      res.status(200).json(result.idealBudget);
    });
  } else {
    res.status(401).json("Unauthorized");
  }
});

app.post("/ideal-budget", function (req, res) {
  if (req.isAuthenticated()) {
    const idb = {
      groceries: req.body.groceries,
      food: req.body.food,
      utilitybills: req.body.utils,
      rent: req.body.rent,
      miscellaneous: req.body.misc,
      transportation: req.body.transportation,
    };
    userDetail
      .findOneAndUpdate({ username: req.user.username }, { idealBudget: idb })
      .then((result) => {
        console.log(result);
        res.status(400).json("Updated idealBudget successfully!");
      })
      .catch((err) => {
        res.status(501).json("some error occured while setting budget");
      });
  } else {
    res.status(401).json(false);
  }
});

app.post("/add-expense", function (req, res) {
  const val = req.body.val;
  const cat = req.body.category;
  const title = req.body.title;
  const cd = moment().format("DD/MM/YYYY");
  const newExpense = new Expense({
    title: title,
    category: cat,
    value: val,
    createdAt: cd,
    username: req.user.username,
  });
  newExpense.save();
  if (req.isAuthenticated()) {
    userDetail.findOne({ username: req.user.username }).then((user) => {
      var ab = user.actualBudget;
      ab[cat] = parseInt(ab[cat]) + parseInt(val);
      console.log(ab);
      userDetail
        .findOneAndUpdate({ username: req.user.username }, { actualBudget: ab })
        .then(res.status(200).json(true));
    });
  } else {
    res.status(401).json(false);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, console.log(`listening on ${port}`));
