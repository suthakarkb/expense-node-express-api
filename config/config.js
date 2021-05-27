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
config.username = '';
config.password = '';
config.table_prefix = '';
config.secretKey = '';
config.authKey = "";
config.salt = "";
//Pagination
config.paginate = true;
config.page_limit = 10;

//smtp server
config.smtphost = '';
config.smtpport = 465;
// not secured smtpport = 587, secured smtp port = 465
config.mailfrom = '';
config.authuser = '';
config.authpass = '';
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
