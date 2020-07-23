var http = require('http');
var url = require('url');
var fs = require('fs');
var CryptoJS = require("crypto-js");
var nodemailer = require("nodemailer");
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var port = process.env.PORT || 3000;
var fs = require('fs');
const path = require('path');
// const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var conn = process.env.DATABASE_URL || "postgres://emvsgzoirewkxt:4553cd6f71d9235f18aca6f487215f0ecf3de517cb7e038c710e79678a2b16b7@ec2-54-217-236-206.eu-west-1.compute.amazonaws.com:5432/dddicparrqfs3s?ssl=true"

var pgp = require('pg-promise')();
var db = pgp(conn);

// const db = new Client(
//   {
//     connectionString: conn,
//     ssl: true
//   });
// db.connect((err, res) => {
//   if (err)
//     console.log('failed to connect\n' + err);
//   else
//     console.log("Connected!");
// });

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function (req, res) {
  res.redirect('/login/');
  console.log("Requested Main Menu, Opening \"login\" page by defaults.");
});

app.use(express.static(__dirname));

app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname + '/login.html'));
  console.log("Requested login via get");
});

app.post('/login', function (req, res) {
  console.log(req.body);
  var userName = req.body.userName.toLowerCase();
  console.log(userName);
  var password = req.body.password;
  var query = "SELECT * FROM users WHERE email='" + userName + "'";
  console.log(query);
  db.query(query).then(results => {
    var resultsFound = results.rowCount;
    if (resultsFound == 1) {
      var data = results.rows[0];
      psw = data.password;
      var password_dec = decryptPassword(psw);
      if (password_dec == password) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      }
      else {
        console.log("wrong password")
        res.writeHead(400);
        res.end();
      }

    }
    else {
      console.log("login failed")
      res.writeHead(400);
      res.end();
    }
  }).catch(() => {
    console.error("DB failed in Login attempt");
  });
});


app.get('/register', function (req, res) {
  res.sendFile(path.join(__dirname + '/register.html'));
  console.log("Requested register via get");
});

app.post('/register', async function (req, res) {
  console.log(req.body);
  var obj = {
    name: req.body.firstname.toLowerCase(),
    familyname: req.body.familyname.toLowerCase(),
    email: req.body.email.toLowerCase(),
    password: encryptPassword(req.body.password),

  }
  // var email = req.body.email.toLowerCase();
  // var name = req.body.firstname.toLowerCase();
  // var familyName = req.body.familyname.toLowerCase();
  // var password = req.body.password;
  // var encrype_password = encryptPassword(password);

  try {


    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let results = await db.any(query);
    if (results.length > 0 ) {
      throw new Error("User already exits");
    }

    // result = await db.any("INSERT INTO users(email, password, name, familyname) VALUES ('" + userName + "', '" + encrype_password + "', '" + firstName + "', '" + familyName + "');");
    await db.none('INSERT INTO users(${this:name}) VALUES(${this:csv})',obj)
    //new user add successfuly
    console.log("new user added successfuly");
    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    var mailOptions = {
      from: 'testForBraude@gmail.com',
      to: obj.email,
      subject: 'Welcome to Cell4Sale!',
      text: 'Congratulations you are a new member in our site !'
    };

    let mailRes = await transporter.sendMail(mailOptions);
    res.writeHead(201);
    res.end();
  } catch (err) {
    console.log(err);
    res.writeHead(500);
    res.end();
  }
});

app.get('/index', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
  console.log("Requested main view via get");
});

app.post('/forget-password', function (req, res) {
  var userName = req.body.email
  userName = userName.toLowerCase();
  console.log(userName);
  var query = "SELECT * FROM users WHERE email='" + userName + "'";
  db.query(query).then(results => {
    var resultsFound = results.rowCount;
    if (resultsFound == 1) {
      var data = results.rows[0];
      psw = data.password;
      var password_dec = decryptPassword(psw);

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'testForBraude@gmail.com',
          pass: 'Aa123456!'
        }
      });

      //////////////////////////////////////////////////////////////////////////////////////////////////////
      const { generateVerificationHash } = require('dbless-email-verification');
      const hash = generateVerificationHash(userName, 'NSLU', 60);
      // add the email and generated hash to the verification link
      /////////////////////////////////////////////////////////////////////////////////////////////////////

      var mailOptions = {
        from: 'testForBraude@gmail.com',
        to: userName,
        subject: 'Cell4Sale Password verification',
        text: hash //////////////////////////////////////////////////////////////////////////////
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          res.writeHead(404);
          res.end();
          console.log(error);
        } else {
          res.writeHead(200);
          res.end();
          console.log('Email sent: ' + info.response);
        }
      });
    }
    else {
      console.log("user not exists")
      res.writeHead(404);
      res.end();
    }
  }).catch(() => {
    console.error("DB failed in Login attempt");
  });

});


function encryptPassword(password) {
  var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(password), 'secret key 123');
  var ciphertext = ciphertext.toString();
  return ciphertext;
}


function decryptPassword(ciphertext) {
  console.log("start decrypt")
  var bytes = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
  var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  return decryptedData;
}






// app.listen(port);
// console.log('Server started! At http://localhost:' + port );  
var server = app.listen(port, function () {
  console.log('Server is running on port ' + port + '..');
});