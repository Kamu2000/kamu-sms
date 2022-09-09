const router = require('express').Router();
const AuthController = require('../controllers/AuthController');

router.get('/', AuthController.read);
router.get('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/logout', AuthController.logout);
router.post('/signup' , AuthController.signup);

module.exports = router;
