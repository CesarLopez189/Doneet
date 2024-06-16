const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const { engine } = require('express-handlebars');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const axios = require('axios');

// Initializations
const app = express();
require('./config/passport');

// Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));

const hbs = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
        or: function(a, b, options) {
            return a || b ? options.fn(this) : options.inverse(this);
        },
        ifContains: function(array, value, options) {
            if (Array.isArray(array)) {
                if (array.includes(value)) {
                    return options.fn(this);
                }
            } else if (typeof array === 'string') {
                if (array.split(',').includes(value)) {
                    return options.fn(this);
                }
            }
            return options.inverse(this);
        },
        ifCond: function (v1, operator, v2, options) {
            switch (operator) {
              case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
              case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
              case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
              case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
              case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
              case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
              case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
              case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
              default:
                return options.inverse(this);
            }
          },
          json: function (context) {
            return JSON.stringify(context);
          },
    }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
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
    const imageId = req.query.id;
    const url = `https://drive.google.com/uc?export=view&id=${imageId}`;

    try {
        console.log(`Fetching image from URL: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        res.set('Content-Type', response.headers['content-type']); // Ajusta el tipo MIME dinámicamente
        res.send(response.data);
    } catch (error) {
        console.error('Failed to fetch image:', error);
        res.status(500).send('Error fetching imageADS');
    }
});
module.exports = app;
