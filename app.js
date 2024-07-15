const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const nocache = require('nocache');
const bodyParser = require('body-parser');
const passport = require('./config/passport');
const Handlebars = require('./helper'); 

// Require the Routes
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');
const app = express();

// Configs
require('dotenv').config();
const PORT = process.env.APP_PORT || 8000; 
const MONGO_URL = process.env.MONGODB_URL;
require('./config/dbConnect');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: MONGO_URL })
}));
app.use(nocache());
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req,res,next)=>{
    res.locals.admin = req.session.admin || null
    next()
})

// Handlebars engine
app.engine('hbs', engine({
    layoutsDir: path.join(__dirname, 'views', 'layout'),
    extname: 'hbs',
    defaultLayout: 'layout',
    partialsDir: path.join(__dirname, 'views', 'partials'),
    handlebars: Handlebars,
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', authRouter);
app.use('/admin', adminRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server has started on Port ${PORT}`);
});
