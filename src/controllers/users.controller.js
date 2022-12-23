const usersCtrl = {};

const passport = require('passport');

const User = require('../models/Usuario');

usersCtrl.renderSignUpForm = (req, res) => {
    res.render('usuarios/signup');
};

usersCtrl.signup =  async (req, res) => {
    const errors = [];
    const { name, email, password, confirm_password } = req.body;
    if (password != confirm_password) {
        errors.push({text: 'Las contraseñas no coinciden'});
    }
    if (password.length < 4){
        errors.push({text: 'La contraseña debe tener mas de 4 caracteres'})
    }
    if (errors.length > 0){
        res.render('usuarios/signup', {
            errors,
            name,
            email
        })
    } else {
        const emailUser = await User.findOne({email: email});
        if (emailUser) {
            req.flash('error_msg', 'El correo ya ha sido registrado');
            res.redirect('/usuarios/signup');
        } else {
            const newUser = new User({name, email, password});
            newUser.password =  await newUser.encryptPassword(password);
            await newUser.save();
            req.flash('success_msg', 'Haz sido registrado con éxito');
            res.redirect('/usuarios/signin');
        }
    }
};

usersCtrl.renderSigninForm = (req, res) => {
    res.render('usuarios/signin');
};

usersCtrl.signin = passport.authenticate('local', {
    failureRedirect: '/usuarios/signin',
    successRedirect: '/productos',
    failureFlash: true
});

usersCtrl.logout = (req, res) => {
    req.logout( (err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'Sesión cerrada');
        res.redirect('/');
    });
};


module.exports = usersCtrl;