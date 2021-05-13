/*Author: Suthakar Kumar Bose
Date Created: 03/08/20
Description: unit test for expense nodejs api
Modified By:
Modified Date:
*/
var supertest = require("supertest");
var should = require("should");

// This agent refers to PORT where program is running.
var server = supertest.agent("http://localhost:3000");

// Home page URL Access
// calling home page api
describe("Homepage access test",function(){
  describe('Homepage access', () => {
	it("Return Homepage",function(done){
    server
    .get("/")
    .expect(200)
    .end(function(err,res){
      res.status.should.equal(200);
      done();
		});
	  });
   });
});



//test for create user API - Positive
//status 200 for success, status 500 for duplicate user
describe('Create a new user test', function() {
    describe('Create a new user', () => {
        it('Create a new user', (done) => {
        server.post('/api/user')
		.send({
			"name":"suthakar",
			"email":"suthakarkb@gmail.com",
			"locale":"en"})
		.expect(500)
        .end(function(err, res) {
            res.status.should.equal(500);
            done();
         });
      });
   });
});



//test for create user without first name - Negative
//status 400 for invalid input - bad parameter / parameter missing
describe('Create a new user without name test', function() {
    describe('Create a new user without name', () => {
        it('Create a new user without name', (done) => {
        server.post('/api/user')
    .send({
          "name":"",
          "email":"",
          "locale":"en"})
		.expect(400)
        .end(function(err, res) {
            res.status.should.equal(400);
            done();
         });
      });
   });
});
