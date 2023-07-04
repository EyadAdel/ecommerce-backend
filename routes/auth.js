const router = require("express").Router();
const CryptoJS = require("crypto-js");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

//REGISTER
router.post("/register", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.PASS_SEC
    ).toString(),
  });

  try {
    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (error) {
    res.status(500).json(error);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(403).json("Wrong email or password!");
    const savedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    ).toString(CryptoJS.enc.Utf8);
    req.body.password !== savedPassword &&
      res.status(403).json("Wrong email or password!");
    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SEC,
      {
        expiresIn: "10d",
      }
    );

    const { password, ...other } = user._doc;
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
      })
      .status(200)
      .json({ ...other, accessToken });
    res;
  } catch (error) {
    // res.status(500).json(error);
  }
});

//LOGOUT
router.post("/logout", async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logged out.");
});

module.exports = router;
