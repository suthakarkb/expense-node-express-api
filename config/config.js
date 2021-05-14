const mysql = require('mysql2')

const config = {};

config.port = 3000;

//Authentication
config.auth = false;

//Database //Production
// config.dbhost= 'suthakarkb.southeastasia.cloudapp.azure.com';
// config.dialect= 'mysql';
// config.database = 'expense';
// config.username = 'root';
// config.password = 'root1234';
// config.table_prefix = '';

//Database //Development
config.dbhost= '127.0.0.1';
config.dialect= 'mysql';
config.database = 'expense';
config.username = 'root';
config.password = 'root1234';
config.table_prefix = '';
config.secretKey = 'SecretSG50';
config.authKey = "key=AAAA3iU9_BI:APA91bEtxGrrpTp2q00B6Q9QjY5EWLW63PlRuPsC_CVkjXAej6c3uBYNpssnvscRslzX6sEEOKr5cBxQz0vNmVwd1xTPg2rco7dlqdzb2-zOsdoMfwDqHj3e8FgCEjLi4pMKtkqIEzVN";
config.salt = "F3229A0B371ED2D9441B830D21A390C3";
//Pagination
config.paginate = true;
config.page_limit = 10;

//smtp server
config.smtphost = 'mail.appseries.net';
config.smtpport = 465;
// not secured smtpport = 587, secured smtp port = 465
config.mailfrom = 'support@appseries.net';
config.authuser = 'support@appseries.net';
config.authpass = '5lm@,=cA#^Jl';
//Configuration of mysql connections
const pool = mysql.createPool({
	connectionLimit: 20,
	host: config.dbhost,
	user: config.username,
	password: config.password,
	database: config.database
});

exports.getConnection = function() {
      return pool
}

// return configuration properties
exports.getConfig =  function() {
      return config
}
