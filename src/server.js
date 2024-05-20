const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const reporteAlergenoController = require('../src/controllers/reporteAlergenoController');
const fetch = require('node-fetch');

// Initializations
const app = express();
require('./config/passport');

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutDir: path.join(app.get('views'), 'layouts'),
    partialDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: {
        or: function(a, b, options) {
            return a || b ? options.fn(this) : options.inverse(this);
        }
    }
}));

app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(methodOverride('_method'));

// Session Middleware Configuration
app.use(session({
    secret: 'yourSecretKey', // Cambia 'yourSecretKey' por una clave secreta larga y compleja
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://root:1234@doneetdb.mqouaag.mongodb.net/test' // Cambia esto por tu cadena de conexión a MongoDB
    }),
    cookie: {
        secure: app.get('env') === 'production', // Asegura las cookies en producción
        httpOnly: true, // Evita el acceso a la cookie a través de JavaScript en el lado del cliente
        maxAge: 1000 * 60 * 60 * 24 // Configura la cookie para que expire en 24 horas
    }
}));

// Ajustes para producción
if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // Confía en el primer proxy
}

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global Variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// Routes
app.use(require('./routes/index.routes'));
app.use(require('./routes/productos.routes'));
app.use(require('./routes/users.routes'));


// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/proxy-image', async (req, res) => {
    const imageId = req.query.id; // Asume que el ID de la imagen se pasa como un parámetro de consulta
    const url = `https://drive.google.com/uc?export=view&id=${imageId}`;

    try {
        const response = await fetch(url);
        const buffer = await response.buffer();
        res.set('Content-Type', 'image/jpeg'); // Asegúrate de ajustar el tipo MIME según sea necesario
        res.send(buffer);
    } catch (error) {
        console.error('Failed to fetch image:', error);
        res.status(500).send('Error fetching image');
    }
});


module.exports = app;
