//express instead of html
var express = require('express');
//library that helps in parsing body of the request to json
var bp = require('body-parser');

//mysql
//express 
var app = express();
//we chose port 3000
var PORT = 3000;
//improve access to the server from all resources
var mysql = require('mysql');
var cors = require('cors');

//use- first do this function before all function
app.use(cors());
app.use(bp.json());


//connection configurations
const mc = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Aa123456',
    database: 'mydb'
});
 
// connect to database
mc.connect();

//creating table
mc.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("CREATE TABLE users (ID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(255), FamilyName VARCHAR(255), Email VARCHAR(255),PromoCode VARCHAR(255), PhoneNumber VARCHAR(255), Country VARCHAR(255), City VARCHAR(255), Street VARCHAR(255), ZipCode VARCHAR(255), Password VARCHAR(255))", function (err, result) {
      if (err) throw err;
      console.log("Table created");
    });
  });






var username = "linoy18@gmail.com"
var password = "123456Aa!"
var username1 = "nofar1@gmail.com"
var password1 = "654321Aa!"
var dummyDB = [
    {
        name: "linoy",
        age: "27"
    },
    {
        name: "linoy",
        age: "23"
    },
    {
        name: "nofar",
        age: "25"
    }];
//app.get with '/ping' return response with 'pong'
app.get('/api/ping', (req, res) => {
    res.send('pong');
});

app.get('/api/table', (req, res) => {
    res.sendfile("table_data.html");
});

app.get('/api/users', (req, res) => {
    var dataToSend = dummyDB;
    if (req.query.name) {
        dataToSend = dummyDB.filter(x => x.name == req.query.name);
    }
    if (req.query.age) {
        dataToSend = dummyDB.filter(x => x.age == req.query.age);
    }
    res.send(dataToSend);
});


app.post('/api/contactus', (req, res) => {

    var mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: process.env.MAIL_USERNAME,
        subject: 'Contact Us',
        text: req.body.mailContent
    };
    mailer.sendMail(mailOptions);

    return res.json({
        result: 'success',
        error: null
    });
});


app.post('/api/login', (req, res) => {

    if (req.body.username == username && req.body.password == password) {
        return res.json({
            result: 'success',
            error: null
        });
    }
    else {
        return res.json({
            result: null,
            error: "Username not found, please sign up first"
        });
    }

});


//app.listen = listening to port + callback function(in this case - arrow function , error - variable to the arrow function)
app.listen(PORT, (err) => {
    if (err) {
        console.log(err);
    }
    console.log('Server is listening on port: ' + PORT);
})