const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { LoginValidator, RegisterValidator } = require('../middlewares/Validator');
AuthController = {};

AuthController.read = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login');
};
AuthController.register = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register');
};
AuthController.login = async (req, res) => {
  console.log(req.body.email)
  const { email, password } = req.body;
  const validator = LoginValidator({ email, password });
  if (validator.error) {
    req.flash('error', validator.error);
    return res.redirect('/');
  }
  console.log(validator.value)
  const user = await User.findOne({ email: validator.value.email });
  if (!user) {
    req.flash('error', "User doesn't exist with this email account.");
    return res.redirect('/');
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    req.flash('error', 'Invalid Password!');
    return res.redirect('/');
  }

  req.session.user = { name: user.name, role: user.role };
  res.locals.user = req.session.user;
  await req.session.save();
  res.redirect('/dashboard');
};

AuthController.logout = (req, res) => {
  req.session.destroy(function () {
    res.redirect('/');
  });
};

AuthController.signup = async (req, res)=>{
  console.log(req.body)
  const { name, email, password, role } = req.body;
  const validator = RegisterValidator({ name, email, password, role });
  if (validator.error) {
    req.flash('error', validator.error);
    return res.redirect('/register');
  }
  const old_user = await User.findOne({email: req.body.email})
  if(old_user){
    req.flash('error', 'Email already exists');
    return res.redirect('/register');
  }
  if(req.body.password != req.body.confirm_password){
    req.flash('error', 'Password does not match');
    return res.redirect('/register');} 
  //hashing password by bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);


  const user = new User({...req.body, password : hashedPassword});
  const savedUser = await user.save();
  return res.redirect('/')
  // res.status(200).json({messsage : "User created successfully", savedUser})
}

module.exports = AuthController;
