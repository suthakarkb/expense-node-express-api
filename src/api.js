const axios = require('axios')
const express = require("express");
const randomize = require('randomatic');
//const nodemailer = require('nodemailer');
const {OAuth2Client} = require('google-auth-library');
const jwtconfig = require("../config/jwtconfig");
const config = require('../config/config');
//const verifyAppToken = require('verify-apple-id-token').default;
//const FacebookTokenStrategy = require('passport-facebook-token');
const oAuth2Client = new OAuth2Client(jwtconfig.clientID);

async function verify(idToken, authType) {
   let jwtResult;
   if(authType === 'google') {
     jwtResult = await verifyGoogleToken(idToken).catch(console.error);
     return jwtResult;
   } else if(authType === 'apple') {
        jwtResult = await verifyAppleToken(idToken).catch(console.error);
        return jwtResult;
   } else if(authType === 'facebook') {
        jwtResult = await verifyFacebookToken(idToken).catch(console.error);
        return jwtResult;
   } else {
     return null;
   }


}

async function verifyGoogleToken(idToken) {
   console.log('verifyGoogleToken');
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: idToken,
      audience: jwtconfig.gaudience
    });
    console.log(ticket);
    if(ticket.payload) {
      console.log('email', ticket.payload.email);
      let jwtResult = { 'email': ticket.payload.email, 'email_verified': ticket.payload.email_verified, 'name': ticket.payload.name };
      return jwtResult; }
    else
      return null;
  }

  async function verifyAppleToken(idToken) {
      console.log('verifyAppleToken');
      //nonce: jwtconfig.nonce, // optional
      const jwtClaims = await verifyAppToken({
          idToken: idToken,
          clientId: jwtconfig.appClient,
          //nonce: nonce,
      });
      console.log('jwtClaims',jwtClaims);
      const myname = jwtClaims.email.split("@").slice(0, -1);
      let jwtResult =  { 'email': jwtClaims.email, 'email_verified': jwtClaims.email_verified, 'name': myname[0] };
      return jwtResult;
  }

  async function verifyFacebookToken(idToken) {
      console.log('verifyFacebookToken');
      //nonce: jwtconfig.nonce, // optional
	  // passport.use(new FacebookTokenStrategy({
			// clientID: FACEBOOK_APP_ID,
			// clientSecret: FACEBOOK_APP_SECRET,
			// fbGraphVersion: 'v3.0'
		  // }, function(accessToken, refreshToken, profile, done) {
			// User.findOrCreate({facebookId: profile.id}, function (error, user) {
			  // return done(error, user);
			// });
		  // }
	  // ));
      // console.log('jwtClaims',jwtClaims);
      // const myname = jwtClaims.email.split("@").slice(0, -1);
      // let jwtResult =  { 'email': jwtClaims.email, 'email_verified': jwtClaims.email_verified, 'name': myname[0] };
      // return jwtResult;
	  return null;
  }


  async function getUserByEmail(email) {
    const connection = config.getConnection();
    const selectUser = 'SELECT * from users where email = ?';
    console.log(selectUser+':'+email);
    const result = await connection.promise().query(selectUser, [email]);
    return result;
  }


//API scope validation
const router  = module.exports = express.Router();


/**
* @api {post} /user This API creats a user in the system.
* @apiName UserCreate
* @apiGroup api
*
* @apiParam {String} [name]  First name of user
* @apiParam {String} [email]  EmailID of user
* @apiParam {String} [picture] picture of user
* @apiParam {String} [authType] auth type of the user
* @apiParam {String} [locale] language of the user
*
*/
router.post('/user', (req, res) => {
console.log("Create a new user...")
var validInput = true;
var message = "";
if (req.body.name == undefined || req.body.name.trim() == ""){
  validInput = false;
  message = "Name of the user is not provided";
}
else if (req.body.email === undefined || req.body.email.trim() == "") {
  validInput = false;
  message = "Email id of the user is not provided";
}
else if (req.body.locale != undefined && req.body.locale.trim().length > 2) {
  validInput = false;
  message = "Locale code should be in 2 characters";
}
if (!validInput){
  console.log("Input params not valid");
  res.status(400).json({success: false,"message": message});
  return;
}

//Validation Passed. Inserting new user to the system
const name = req.body.name;
const email = req.body.email;
const picture = req.body.picture?req.body.picture:'';
const authType = 'google';
const locale = req.body.locale?req.body.locale:'';
console.log(name,email,authType, picture, locale);
const queryString = "INSERT INTO users (name, email, picture, authtype, locale, created_date) VALUES (?, ?, ?, ?, ?, ?)";
console.log('createUserSql:', queryString);
const connection = config.getConnection();
connection.query(queryString, [name, email, picture, authType, locale, new Date()], (err, results, fields) => {
    if (err) {
        console.log('err',err);
        if (err.code == "ER_DUP_ENTRY") {
          res.status(409).json({success: false,"message": "This email id already exists in the system : "+email})
		  return;
        } else {
			console.log(err);
            res.status(500).json({success: false,"message": err.sqlMessage});
            return;
		}
    }
    console.log("Inserted a new user with emailId: ", email);
    res.status(200).json({success: true,"message": "User created with email : "+email})
  })
});


/**
 * @api {post} /expense This API create a expense in the system.
 * @apiName expense
 * @apiGroup api/expense
 *
 * @apiParam {String} [email]  user email
 * @apiParam {Number} [amount] amount paid
 * @apiParam {String} [payee]  payee name
 * @apiParam {String} [Category] Category of the payment
 * @apiParam {String} [paymentMethod] payment method
 * @apiParam {String} [status] status of the payment
 * @apiParam {String} [description] Description of the payment
 * @apiParam {String} [paymentTime] Payment Date Time
 *
 */
  router.post("/expense", async function(req, res) {
    console.log("Create a new club...");
    //console.log(JSON.stringify(req.headers));
    var validInput = true;
    var message = "";
    var user = {};
    //Validations for create new club
    if(req.headers.authorization == undefined || req.headers.authorization.trim() == ""){
      validInput = false;
      message = "Authorization Token ID is required in headers";
    }
    else if (req.body.amount == undefined || req.body.amount < 0){
      validInput = false;
      message = "Payment Amount is not provided";
    }
    else if (req.body.payee === undefined || req.body.payee.trim() == "") {
      validInput = false;
      message = "Payee is not provided";
    }
    else if (req.body.status === undefined || req.body.status.trim() == "") {
      validInput = false;
      message = "Category is not provided";
    }
    else if (req.body.paymentdate === undefined || req.body.paymentdate.trim() == "") {
      validInput = false;
      message = "Payment Date Time is not provided";
    }
    if (!validInput){
      console.log("Input params not valid");
      res.status(400).json({success: false,"message": message});
      return;
    }
    const idToken = req.headers.authorization;
    console.log(idToken);

    //let jwtResult = await verifyGoogleToken(idToken).catch(console.error);
    let jwtResult =  { 'email': 'suthakarkb@gmail.com', 'email_verified': true, 'name': 'suthakar' };

    console.log('jwtResult:',jwtResult);
    if(!jwtResult || !jwtResult.email_verified){
        message = "Invalid JWT token (or) token expired";
        res.status(500).json({success: false,"message": message});
        return;
    }
    console.log('after JWT verification',jwtResult.email);

	const email = jwtResult.email;
  const amount = req.body.amount;
  const payee = req.body.payee;
  const category = req.body.category?req.body.category:'';
  const paymethod = req.body.paymethod?req.body.paymethod:'';
  const status = req.body.status;
	const description = req.body.description?req.body.description:'';
	const paymentdate = req.body.paymentdate;

    let queryString = "INSERT INTO expense (email, amount, payee, category, pay_method, status, description, payment_date)";
    queryString = queryString + " VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const connection = config.getConnection();
    connection.query(queryString, [email, amount, payee, category, paymethod, status, description, paymentdate], (err, result, fields) => {
      if (err) {
			res.status(500).json({success: false,"message": "Error while creating new expense"});
      		return;
      }
      if (result) {
        console.log('expense inserted : ', result.insertId);
      }
      console.log("Added a new expense for ", email);
      res.status(200).json({success: true,"message": "Added a new expense for user "+email})
    })
  });



  /**
   * @api {put} /expense This API used to update an existing expense.
   * @apiName PUT: /api/expense
   * @apiGroup /api
   *
   * @apiParam {number} [id]  id key that required to update
   * @apiParam {number} [amount]  amount paid to payee
   * @apiParam {string} [payee]  Name of the payee
   * @apiParam {string} [paymethod]  payment method
   * @apiParam {String} [status]  status of the payment when paid with credit card, cheque
   * @apiParam {String} [description]  Description of the payment
   * @apiParam {Date} [paymentdate]  Date and Time of the Payment
   */
   router.put("/expense", async function(req, res) {
     console.log("Update an existing expense");
     var validInput = true;
     var message = "";

     if(req.headers.authorization == undefined || req.headers.authorization.trim() == ""){
       validInput = false;
       message = "Authorization Token ID is required in headers";
     }
     if (req.body.id == undefined || req.body.id < 0){
       validInput = false;
       message = "Id required or Invalid Id";
     }
     if (!validInput){
       console.log("Input params not valid");
       res.status(400).json({success: false,"message": message});
       return;
     }

     const idToken = req.headers.authorization;
     console.log(idToken);
     //let jwtResult = await verifyGoogleToken(idToken).catch(console.error);
     let jwtResult =  { 'email': 'suthakarkb@gmail.com', 'email_verified': true, 'name': 'suthakar' };
     if(!jwtResult || !jwtResult.email_verified){
         message = "Invalid JWT token (or) token expired";
         res.status(500).json({success: false,"message": message});
         return;
     }
     console.log('after JWT verification');
     let expenseQuery = "UPDATE expense SET id = ?, ";
     if (req.body.amount != undefined) {
       expenseQuery =  expenseQuery + " amount = "+req.body.amount+", ";
     }
     if (req.body.payee != undefined && req.body.payee.trim() != "") {
       expenseQuery =  expenseQuery + " payee = '"+req.body.payee+"', ";
     }
     if (req.body.paymethod != undefined && req.body.paymethod.trim() != "") {
       expenseQuery =  expenseQuery + " pay_method = '"+req.body.paymethod+"', ";
     }
     if (req.body.status != undefined && req.body.status.trim() != "") {
       expenseQuery =  expenseQuery + " status = '"+req.body.status+"', ";
     }
     if (req.body.description != undefined && req.body.description.trim() != "") {
       expenseQuery =  expenseQuery + " description = '"+req.body.description+"', ";
     }
     if (req.body.paymentdate != undefined && req.body.paymentdate.trim() != "") {
       expenseQuery =  expenseQuery + " payment_date = '"+req.body.paymentdate+"', ";
     }
     //Validation Passed. Update expense in the system
     let expenseUpdate = expenseQuery.substring(0, expenseQuery.length-2)
     expenseUpdate = expenseUpdate + " WHERE id = ? "
     console.log('Query: ',expenseUpdate);
     const connection = config.getConnection();


     connection.query(expenseUpdate, [req.body.id, req.body.id], (err, result, fields) => {
             if (err) {
               console.log(err);
                 res.status(500).json({success: false,"message": "Error while updating the expense"})
                 return
             }
             if (result) {
               console.log('Updated expense for id '+req.body.id);
               res.status(200).json({success: true,"message": "Updated details of expense : "+req.body.id});
             }
        });
     });




     /**
      * @api {get} /expenses This API returns all expenses for logged in user
      * @apiName GET: /api/expenses
      * @apiGroup api
      *
      */
      router.get("/expenses", async function(req, res) {
        console.log("GET: /expenses ");

        var validInput = true;
        var message = "";

        if(req.headers.authorization == undefined || req.headers.authorization.trim() == ""){
          validInput = false;
          message = "Authorization Token ID is required in headers";
        }

        if (!validInput){
          console.log("Input params not valid");
          res.status(400).json({"message": message});
          return;
        }

        const idToken = req.headers.authorization;
        console.log(idToken);
        //let jwtResult = await verifyGoogleToken(idToken).catch(console.error);
        let jwtResult =  { 'email': 'suthakarkb@gmail.com', 'email_verified': true, 'name': 'suthakar' };
        if(!jwtResult || !jwtResult.email_verified){
            message = "Invalid JWT token (or) token expired";
            res.status(500).json({success: false,"message": message});
            return;
        }
        console.log('after JWT verification');
        //Validation Passed. Query club in the system
        const connection = config.getConnection();
        const email = jwtResult.email;
        //Line 4 : JOIN player p ON (p.club_code = c1.club_code OR p.club_code = c2.club_code)
        let queryString = "select id, email, amount, payee, category, pay_method, status, description, ";
        queryString += "payment_date from expense where email = ? ";
        console.log("query: " + queryString)
        connection.query(queryString, [email], (err, rows, fields) => {
          if (err) {
            console.log("Failed to query for fixtures: " + err)
            res.status(500).json({success: false,"message": "Failed to get list of the expenses"})
            return
          }
         //mapping the result
          const expenses = rows.map((row) => {
              return {  id: row.id, email: row.email, amount: row.amount, payee: row.payee,
                        category: row.category,  paymethod: row.pay_method, status: row.status,
                        description: row.description, paymentdate: row.payment_date }
          })
          res.status(200).json({success: true, data: expenses});
          //res.status(200).json(rows)
        })
      });



      /**
       * @api {get} /expense This API returns expense for given id
       * @apiName GET: /api/expense/id
       * @apiGroup api
       *
       */
       router.get("/expense/:id", async function(req, res) {
         console.log("GET: /expense/id ");

         var validInput = true;
         var message = "";

         if(req.headers.authorization == undefined || req.headers.authorization.trim() == ""){
           validInput = false;
           message = "Authorization Token ID is required in headers";
         }

         let id = 0;
         if (req.params.id == undefined || req.params.id.trim() == ""){
           validInput = false;
           message = "ID required in parameters";
         } else {
           id = req.params.id;
         }

         if (!validInput){
           console.log("Input params not valid");
           res.status(400).json({success: false,"message": message});
           return;
         }

         const idToken = req.headers.authorization;
         console.log(idToken);
         //let jwtResult = await verifyGoogleToken(idToken).catch(console.error);
         let jwtResult =  { 'email': 'suthakarkb@gmail.com', 'email_verified': true, 'name': 'suthakar' };
         if(!jwtResult || !jwtResult.email_verified){
             message = "Invalid JWT token (or) token expired";
             res.status(500).json({success: false,"message": message});
             return;
         }
         console.log('after JWT verification');
         //Validation Passed. Query club in the system
         const connection = config.getConnection();
         //Line 4 : JOIN player p ON (p.club_code = c1.club_code OR p.club_code = c2.club_code)
         let queryString = "select id, email, amount, payee, category, pay_method, status, description, ";
         queryString += "payment_date from expense where id = ? ";
         console.log("query: " + queryString);
         console.log('id: ', id);
         connection.query(queryString, [id], (err, rows, fields) => {
           if (err) {
             console.log("Failed to query for fixtures: " + err)
             res.status(500).json({success: false,"message": "Failed to get list of the expenses"})
             return
           }
          //mapping the result
           const expenses = rows.map((row) => {
               return {  id: row.id, email: row.email, amount: row.amount, payee: row.payee,
                         category: row.category,  paymethod: row.pay_method, status: row.status,
                         description: row.description, paymentdate: row.payment_date }
           })
           res.status(200).json({success: true, data: expenses});
           //res.status(200).json(rows)
         })
       });



       /**
        * @api {delete} /expense This API delete the expense for given id
        * @apiName DELETE: /api/expense/id
        * @apiGroup api
        *
        */
        router.delete("/expense/:id", async function(req, res) {
          console.log("DELETE: /expense/id ");

          var validInput = true;
          var message = "";

          if(req.headers.authorization == undefined || req.headers.authorization.trim() == ""){
            validInput = false;
            message = "Authorization Token ID is required in headers";
          }

          let id = 0;
          if (req.params.id == undefined || req.params.id.trim() == ""){
            validInput = false;
            message = "ID required in parameters";
          } else {
            id = req.params.id;
          }

          if (!validInput){
            console.log("Input params not valid");
            res.status(400).json({success: false,"message": message});
            return;
          }

          const idToken = req.headers.authorization;
          console.log(idToken);
          //let jwtResult = await verifyGoogleToken(idToken).catch(console.error);
          let jwtResult =  { 'email': 'suthakarkb@gmail.com', 'email_verified': true, 'name': 'suthakar' };
          if(!jwtResult || !jwtResult.email_verified){
              message = "Invalid JWT token (or) token expired";
              res.status(500).json({success: false,"message": message});
              return;
          }
          console.log('after JWT verification');
          //Validation Passed. Query club in the system
          const connection = config.getConnection();
          //Line 4 : JOIN player p ON (p.club_code = c1.club_code OR p.club_code = c2.club_code)
          let queryString = "delete from expense where id = ? ";
          console.log("query: " + queryString);
          console.log('id: ', id);
          connection.query(queryString, [id], (err, rows, fields) => {
            if (err) {
              console.log("Failed to query for fixtures: " + err)
              res.status(500).json({success: false,"message": "Failed to get list of the expenses"})
              return
            }
            res.status(200).json({success: true, "message": "Deleted the expense with id "+id});
            //res.status(200).json(rows)
          })
        });



        /**
         * @api {get} /data/:dataType This API returns possible dataList for the given dataType.
         * @apiName GET: /api/data/:dataType
         * @apiGroup api
         *
         */
         router.get("/data/:dataType", async function(req, res) {
           console.log("constant data structure for cricket11 app...");
           //Validation Passed. Query club in the system
           let dataType = '';
           if (req.params.dataType != undefined && req.params.dataType.trim() != ""){
             dataType = req.params.dataType;
           }
           const connection = config.getConnection();
           let queryString = "Select id, data_type, data_value from datadictionary where data_type = ?  order by id asc ";
           console.log("query: " + queryString);
           console.log("dataType: " + dataType);
           connection.query(queryString, [dataType], (err, rows, fields) => {
             if (err) {
               console.log("Failed to query for data values: " + err)
               res.status(500).json({success: false,"message": "Failed to get data list"})
               return
             }
            //mapping the result
            const datalist = rows.map((row) => {
                return {
                       id: row.id,
                       value : row.data_value
                       }
            });
             res.status(200).json({success: true, data: datalist});
             //res.status(200).json(datalist)
           })
         });
