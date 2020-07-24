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
var pgp = require('pg-promise')();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//////////////////////////////////////////////---***Database Connection String***---/////////////////////////////////////////////
var conn = process.env.DATABASE_URL || "postgres://emvsgzoirewkxt:4553cd6f71d9235f18aca6f487215f0ecf3de517cb7e038c710e79678a2b16b7@ec2-54-217-236-206.eu-west-1.compute.amazonaws.com:5432/dddicparrqfs3s?ssl=true"

//////////////////////////////////////////////---***Database Connection***---////////////////////////////////////////////////////
var db = pgp(conn);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function (req, res) {
  res.redirect('/login/');
  console.log("Requested Main Menu, Opening \"login\" page by defaults.");
});

app.use(express.static(__dirname));







//////////////////////////////////////////////---***Login Handling Function***---/////////////////////////////////////////////


app.get('/login', function (req, res) {
  res.sendFile(process.cwd()+'/login.html');
  console.log("Redirected to login page");
});

app.post('/login', async function (req, res) {
  var obj = {
    email: req.body.userName.toLowerCase(),
    password: req.body.password
  }

  try {
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let result = await db.one(query);
    if (!result) {
      throw new Error("Login Failed");
    }
    var password_dec = decryptPassword(result.password);
    console.log(password_dec);
    if (password_dec !== obj.password) {
      throw new Error("Wrong password");
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  
  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
});



//////////////////////////////////////////////---***Login Facebook Handling Function***---///////////////////////////////////

app.post('/loginf', async function (req, res) {
  var obj = {
    email: req.body.email.toLowerCase(),
    name: req.body.firstname,
    familyname: req.body.lastname
  }

  try {
    await db.none('INSERT INTO users(${this:name}) VALUES(${this:csv})',obj);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify('ok'));
  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
});

//////////////////////////////////////////////---***Register Handling Function***---/////////////////////////////////////////////
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

  try {
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let results = await db.any(query);
    if (results.length > 0 ) {
      throw new Error("User already exits");
    }
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
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
});

app.get('/index', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
  console.log("Requested main view via get");
});



//////////////////////////////////////////////---***Forgeet-Password Handling Function***---/////////////////////////////////////////////

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
        text: hash ////////////////////////////////////////maybe
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


//Password encryption function 
function encryptPassword(password) {
  var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(password), 'secret key 123');
  var ciphertext = ciphertext.toString();
  return ciphertext;
}

//Password decryption function 
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