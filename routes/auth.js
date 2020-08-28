const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { regUserValid, logUserValid } = require("../validation");

//Register
router.post("/register", async (req, res) => {
  const { name, email, password, passwordConfirm } = req.body;

  if (password !== passwordConfirm)
    return res.status(400).send('"password" does not match');
  //Validates users
  const { error } = regUserValid({ name, email, password });
  if (error) return res.status(400).send(error.details[0].message);
  //Unique User?
  const emailExist = await User.findOne({ email });
  if (emailExist) return res.status(400).send('"email" already exists');

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashPass = await bcrypt.hash(password, salt);
  //Creates User
  const user = new User({
    name,
    email,
    password: hashPass,
  });
  try {
    const savedUser = await user.save();
    res.json({ user: user._id });
  } catch (err) {
    req.status(400).send(err);
  }
});

//Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  //Validates users
  const { error } = logUserValid(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Check if email exists
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Email or Password is incorrect");

  //Check if password is valid
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send("Email or Password is incorrect");

  const token = jwt.sign(
    { _id: user._id},
    process.env.TOKEN_SECRET
  );
  res.header("auth-token", token).send(token);
  res.json({ user: req.body });
});

module.exports = router;
