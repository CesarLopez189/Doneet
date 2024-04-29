const usersCtrl = {};

const passport = require('passport');

const User = require('../models/Usuario');
const nodemailer = require('nodemailer');

usersCtrl.renderSignUpForm = (req, res) => {
    res.render('usuarios/signup');
};

usersCtrl.signup =  async (req, res) => {
    const errors = [];
    const { name, last_names, age, elements, email, password, confirm_password, admin } = req.body;
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
            last_names,
            age,
            email
        })
    } else {
        const emailUser = await User.findOne({email: email});
        if (emailUser) {
            req.flash('error_msg', 'El correo ya ha sido registrado');
            res.redirect('/usuarios/signup');
        } else {
            const newUser = new User({name, last_names, age, elements, email, password, admin});
            newUser.password =  await newUser.encryptPassword(password);
            await newUser.save();

            // Configurar el transportador de nodemailer
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true para 465, false para otros puertos como 587
                auth: {
                    user: 'raseclopz18@gmail.com', // Cambiar a tu correo
                    pass: 'pbvk glkw peuh bgpg' // Cambiar a tu contraseña
                },
                tls: {
                    // No rechazar conexiones no autorizadas (omitir la validación de certificados)
                    rejectUnauthorized: false
                }
            });

            // Configuración de opciones de email
            let mailOptions = {
                from: 'Doneet <tuemail@gmail.com>',
                to: newUser.email,
                subject: 'Bienvenido a Doneet',
                html: `<h1>Hola ${newUser.name},</h1>
                       <p>¡Bienvenido a Doneet, donde cada aporte cuenta hacia un futuro más brillante!</p>
                       <p>Estamos emocionados de tenerte a bordo y ansiosos por verte participar en nuestra comunidad. Aquí, cada contribución es una semilla que crece y se expande, ayudando a proyectos y personas que hacen la diferencia.</p>
                       <p><b>Tu cuenta ha sido creada con éxito.</b> Ahora puedes iniciar sesión y explorar todos los proyectos emocionantes que esperan tu apoyo. Si tienes alguna pregunta o necesitas asistencia, nuestro equipo de soporte está aquí para ayudarte.</p>
                       <p>Gracias por unirte a nuestra misión de hacer del mundo un lugar mejor, un doneet a la vez.</p>
                       <p>Con aprecio,</p>
                       <p>El Equipo de Doneet</p>
                       <img src="cid:doneetwelcome">`, // Ensure the src matches the cid below
                attachments: [{
                    filename: '000Logo.png',
                    path: __dirname + '/000Logo.png', // Change to the path of your image
                    cid: 'doneetwelcome' // should be the same cid used in the img src
                }]
            };

            // Enviar el correo electrónico
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Correo enviado: ' + info.response);
                }
            });

            req.flash('success_msg', 'Haz sido registrado con éxito');
            res.redirect('/usuarios/signin');
        }
    }
};

usersCtrl.renderSigninForm = (req, res) => {
    res.render('usuarios/signin');
    
};

/*usersCtrl.signin = passport.authenticate('local', {
    failureRedirect: '/usuarios/signin',
    successRedirect: '/',
    failureFlash: true
});*/

usersCtrl.signin = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('error_msg', 'Usuario o contraseña incorrectos');
        return res.redirect('/usuarios/signin');
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        req.flash('success_msg', '¡Bienvenido!');
        res.redirect('/');
      });
    })(req, res, next);
  };

usersCtrl.logout = (req, res) => {
    req.logout( (err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'Sesión cerrada');
        res.redirect('/');
    });
};

usersCtrl.chatbot = (req, res) => {
    res.render('usuarios/chatbot');
}



module.exports = usersCtrl;