const express = require('express'); 

const {engine} = require('express-handlebars');
const path = require('path');
const createError = require('http-errors');
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session');
const nocache = require('nocache');
const bodyParser = require('body-parser');

//Require the Routes
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');
const app = express();

//Configs
require('dotenv').config();
const PORT = process.env.PORT || 8000 
require('./config/dbConnect')  

app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({extended:true}));



app.use(cookieParser());
app.use(session({
    secret: 'key',
    saveUninitialized:true,
    cookie: {maxAge:72 * 60 * 60 * 10000, httpOnly: true },
    resave: false
}));
app.use(nocache());


app.set('view engine','hbs');
app.set('views',path.join(__dirname,'views'));

app.engine('hbs',engine({layoutsDir:__dirname+'/views/layout/',extname:'hbs',defaultLayout:'layout',partialsDir:__dirname+'/views/partials/'}))


//Body parser 
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());





 

app.use('/',authRouter);
app.use('/admin',adminRouter);
app.use(express.static('public'))
app.get('*', function (req, res) {
    res.redirect("/404 page");
});

app.listen(PORT, ()=>{
    console.log('Server has started on Port 8000');
})


















// app.use(function(req,res,next){
//     next(createError(404))
// })


// app.use(function(err,req,res,next){
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development'? err:{};


//     //render the error page
//     res.status(err.status || 500);
//     res.render('404 page');
// })