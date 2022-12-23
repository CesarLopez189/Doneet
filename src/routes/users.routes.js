const { Router } = require('express');
const router = Router();

const { renderSignUpForm, renderSigninForm, signup, signin, logout  } = require('../controllers/users.controller');

router.get('/usuarios/signup', renderSignUpForm);

router.post('/usuarios/signup', signup);

router.get('/usuarios/signin', renderSigninForm);

router.post('/usuarios/signin', signin);

router.get('/usuarios/logout', logout);

module.exports = router;