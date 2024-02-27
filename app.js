const express = require('express');
const app = express();
const connectDb = require('./models/database');
const loggger = require('morgan');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

// Database Connection
connectDb.databaseConnect();

//Express FileUpload
const fileupload = require('express-fileupload');
app.use(fileupload());

//cors setup
app.use(
	cors({
		credentials: true,
		origin: "*",
		methods: ['GET', 'POST, PUT', 'DELETE'],
	})
);

//logger
app.use(loggger('tiny'));

//bodyParser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Express-Session , Cookie-parser
const cookieparser = require('cookie-parser');
const session = require('express-session');
app.use(
	session({
		resave: true,
		saveUninitialized: true,
		secret: process.env.EXPRESS_SESSION_SECRET,
	})
);
app.use(cookieparser());

//Routes
app.use('/user', require('./routes/indexRoutes'));
app.use('/resume', require('./routes/resumeRoutes.js'));
app.use('/employer', require('./routes/employerRoutes.js'));

//Error Handling
const ErrorHandler = require('./utils/ErrorHandlers');
const { generatedErrors } = require('./middlewares/error');
app.all('*', (req, res, next) => {
	next(new ErrorHandler(`Requested URL NOT FOUND ${req.url}`, 404));
});
app.use(generatedErrors);

app.listen(
	process.env.PORT,
	console.log(`Server is RunninG on Port ${process.env.PORT}`)
);

module.exports = app;
