const express = require('express');
const cors = require('cors');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const api = require('./src/api');
const useraccess = require('./config/user-access');
const config = require('./config/config');

// Authentication module.
var auth = require('http-auth');
var basic = auth.basic({
	realm: "Node JS API",
    file: "./config/keys.htpasswd"
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

if(config.auth == true) {
	app.use(auth.connect(basic));
}

// app.all('/*', function(req, res, next) {
//   // CORS headers
//   res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-type,Accept,Authorization,X-Access-Token,X-Key');
//   next();
// });

app.get('/', function(req, res) {
	res.json({ message: 'Node MySQL APIs for Captain11!' });
});

//our url will always start with api
//can add api version here, version from config.js
app.use('/api', api);
app.use('/', router);

//Invalid URL
app.use(function(req, res, next) {
	res.status(404);
	res.send({
		"success" : false,
		"message" : 'Invalid URL'
	});
});

//error handling
app.use((err, req, res, next) => {
    res.status(err.status).json({
				"success" : false,
				"name" : err.name,
				"message": err.message,
				"code": err.code
			});
});
var server = app.listen(config.getConfig().port, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('listening in http://localhost:' + port);
});
