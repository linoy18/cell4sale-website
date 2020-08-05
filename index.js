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
const https = require('https');
const { verifyHash, generateVerificationHash } = require('dbless-email-verification');
var pgp = require('pg-promise')();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var convertUSDtoILSrate;
const MY_SECRET = 'linoyshirannofaruri';
var loginUser = { id: 0, email: '', confirmed: false, rememberMe: false };
//////////////////////////////////////////////---***our URL String***---/////////////////////////////////////////////

const API_URL = 'http://localhost:3000/'; // dev env
// const API_URL = 'https://desolate-inlet-43132.herokuapp.com/'; // prod env

//////////////////////////////////////////////---***Database Connection String***---/////////////////////////////////////////////
var conn = process.env.DATABASE_URL || "postgres://qypchyeekcsmxm:919fb6548d25956af6a1a8ae2aaeb9c6bdc25f0a6eb7f32e3e09201666dac2cd@ec2-52-48-65-240.eu-west-1.compute.amazonaws.com:5432/d6bdcco8hh45dq?ssl=true"
// var conn = process.env.DATABASE_URL || "postgres://emvsgzoirewkxt:4553cd6f71d9235f18aca6f487215f0ecf3de517cb7e038c710e79678a2b16b7@ec2-54-217-236-206.eu-west-1.compute.amazonaws.com:5432/dddicparrqfs3s?ssl=true"

//////////////////////////////////////////////---***Database Connection***---////////////////////////////////////////////////////
var db = pgp(conn);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function (req, res) {
  if (loginUser.id != 0) {
    if (loginUser.rememberMe == true) {
      res.redirect('/index');
      console.log("Requested Main Menu, Opening \"index\" page by defaults.");
    }
  } else {
    res.redirect('/login/');
    console.log("Requested Main Menu, Opening \"login\" page by defaults.");
  }
});

app.use(express.static(__dirname));


app.get('/email_varifi', function (req, res) {
  res.sendFile(process.cwd() + '/email_varifi.html');
  console.log("Redirected to login page");
});



//////////////////////////////////////////////---***Profile Handling Function***---/////////////////////////////////////////////
app.get('/profile', function (req, res) {
  res.sendFile(process.cwd() + '/profile.html');
  console.log("Redirected to profile page");
});

app.get('/profileupdate/mailconfirmation', async function (req,res) {
  // assuming the hash extracted from the verification url is stored in the verificationHash variable
  const emailToVerify = req.query.email;
  const emailToChange = req.query.toChange;
  const hash = req.query.verificationHash;
  const isEmailVerified = verifyHash(hash, emailToVerify, MY_SECRET);

  try {
    if (!isEmailVerified) {
      throw new Error('Validation Error');
    }

    var query = "UPDATE users SET email=$1 WHERE email=$2";
    await db.none(query, [emailToChange, emailToVerify]);


    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: emailToChange,
      subject: 'Your email changed successfully!',
      html: emailHasChangedMail(emailToChange)
    };

    let mailRes = await transporter.sendMail(mailOptions);
    res.redirect('/login');

  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
})

//Get the profile-details 
app.post('/profileupdate', async function (req, res) {
  var userToUpdate = req.body;
  try {

    var pass = encryptPassword(userToUpdate.password);
    var query = "UPDATE users SET name = $1 , familyname = $2 , phonenumber = $3 , country = $4 , city = $5 , street = $6 , zipcode = $7 ,password = $8 WHERE email = $9";
    await db.none(query, [userToUpdate.name, userToUpdate.familyname, userToUpdate.phonenumber, userToUpdate.country, userToUpdate.city, userToUpdate.street, userToUpdate.zipcode, pass, userToUpdate.email]);

    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    if (userToUpdate.newEmail) {
      const hash = generateVerificationHash(userToUpdate.email, MY_SECRET, 30);

      const url = `${API_URL}profileupdate/mailconfirmation?email=${userToUpdate.email}&verificationHash=${hash}&toChange=${userToUpdate.newEmail}`;
      var emailMailOptions = {
        from: 'cell4salecontact@gmail.com',
        to: userToUpdate.newEmail,
        subject: 'Change Your Email',
        html: changeEmailMail(url)
      };

      let emailMailRes = await transporter.sendMail(emailMailOptions);

    }


    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: userToUpdate.email,
      subject: 'Your Details Has Been Updated!',
      html: updateDetailsMail()
    };

    let mailRes = await transporter.sendMail(mailOptions);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(userToUpdate));
  }
  catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

//change the profile details
app.post('/profiledetails', async function (req, res) {
  userToUpdate = req.body.email;
  try {
    var query = "SELECT * FROM users WHERE email='" + userToUpdate + "'";
    let result = await db.oneOrNone(query);
    if (!result) {
      throw new Error("User does not exists");
    }
    var password_dec = decryptPassword(result.password);
    result.password = password_dec;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));


  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

//////////////////////////////////////////////---***Login Handling Function***---/////////////////////////////////////////////

app.get('/login', function (req, res) {
  res.sendFile(process.cwd() + '/login.html');
  console.log("Redirected to login page");
});

app.post('/login', async function (req, res) {
  var obj = {
    email: req.body.userName.toLowerCase(),
    password: req.body.password,
    rememberMe: req.body.rememberMe
  }

  try {
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let result = await db.oneOrNone(query);
    if (!result) {
      throw new Error("User does not exists");
    }
    if (!result.confirmed) {
      throw new Error("VERIFICATION");
    }

    var password_dec = decryptPassword(result.password);
    console.log(password_dec);
    if (password_dec !== obj.password) {
      throw new Error("Wrong password");
    }

    if (obj.rememberMe) {
      var userID = result.id;
      query = "UPDATE users SET remember_me=$1 WHERE email=$2";
      await db.none(query, [true, obj.email]);
      loginUser.id = userID;
      loginUser.email = obj.email;
      loginUser.confirmed = true;
      loginUser.rememberMe = true;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));

  } catch (err) {
    // res.writeHead(500, { 'Content-Type': 'application/json' });
    // res.end(JSON.stringify(err));
    res.status(500).send(err.message);
  }
});

//////////////////////////////////////////////---***Login Facebook Handling Function***---///////////////////////////////////

app.post('/loginf', async function (req, res) {
  var obj = {
    email: req.body.email.toLowerCase(),
    name: req.body.firstname,
    familyname: req.body.lastname,
    confirmed: true
  }
  try {
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let result = await db.oneOrNone(query);
    if (!result) {
    await db.none('INSERT INTO users(${this:name}) VALUES(${this:csv})', obj);
    result = await db.one(query);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
});

//////////////////////////////////////////////---***Register+Verification Email Handling Function***---/////////////////////////////////////////////

app.get('/resendVerfication', function (req, res) {
  res.sendFile(process.cwd() + '/email_verfication.html');
  console.log("Redirected to login page");
})

app.post('/resendVerfication', async function (req, res) {
  try {
    const email = req.body.email;
    var query = "SELECT * FROM users WHERE email='" + email + "'";
    let result = await db.oneOrNone(query);
    if (!result) {
      throw new Error("User does not exists");
    }


    const hash = generateVerificationHash(email, MY_SECRET, 30);
    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    const url = `${API_URL}register/confirmation/?email=${email}&verificationHash=${hash}`;
    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: email,
      subject: 'Welcome! Please activate your account',
      html: prepareMail(url)
    };

    let mailRes = await transporter.sendMail(mailOptions);
    res.writeHead(201);
    res.end();
  } catch (err) {
    // console.log(err);
    // res.writeHead(500, { 'Content-Type': 'application/json' });
    // res.end(JSON.stringify(err));
    res.status(500).send(err.message);
  }
});

app.get('/register/confirmation/', async function (req, res) {
  // assuming the hash extracted from the verification url is stored in the verificationHash variable
  const emailToVerify = req.query.email;
  const hash = req.query.verificationHash;
  const isEmailVerified = verifyHash(hash, emailToVerify, MY_SECRET);

  try {
    if (!isEmailVerified) {
      throw new Error('Not Found');
    }

    var query = "UPDATE users SET confirmed=$1 WHERE email=$2";
    await db.none(query, [true, emailToVerify]);


    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: emailToVerify,
      subject: 'Congratulations!',
      html: prepareCongratsMail()
    };

    let mailRes = await transporter.sendMail(mailOptions);
    res.redirect('/login');

  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
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
    promocode: req.body.promocode,
    confirmed: false,
    remember_me: false
  }

  try {
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let results = await db.any(query);
    if (results.length > 0) {
      throw new Error("User already exits");
    }
    await db.none('INSERT INTO users(${this:name}) VALUES(${this:csv})', obj)
    //new user add successfuly
    console.log("new user added successfuly");
    const hash = generateVerificationHash(obj.email, MY_SECRET, 30);

    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });



    const url = `${API_URL}register/confirmation/?email=${obj.email}&verificationHash=${hash}`;
    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: obj.email,
      subject: 'Welcome to Cell4Sale!',
      html: prepareMail(url)
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

//////////////////////////////////////////////---***Forget-Password Handling Function***---/////////////////////////////////////////////
app.get('/forget-password', function (req, res) {
  res.sendFile(process.cwd() + '/forget-password.html');
  console.log("Redirected to forget password page");
});

app.post('/forgetpassword', async function (req, res) {
  var obj = {
    email: req.body.email.toLowerCase(),
  }

  try {
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let result = await db.oneOrNone(query);
    if (!result) {
      throw new Error("User does not exists");
    }

    const hash = generateVerificationHash(obj.email, MY_SECRET, 30);

    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });


    const url = `${API_URL}resetpassword/?email=${obj.email}&verificationHash=${hash}`;
    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: obj.email,
      subject: 'Reset Password',
      html: preparePassMail(url)
    };

    let mailRes = await transporter.sendMail(mailOptions);
    res.writeHead(201);
    res.end();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/resetpassword', function (req, res) {
  res.sendFile(process.cwd() + '/activate_new_pass.html');
  console.log("Redirected to activate new pass page");
});

app.get('/setnewpassword', function (req, res) {
  res.send('success');
});


app.post('/setnewpassword', async function (req, res) {

  try {
    const emailToVerify = req.body.email;
    const hash = req.body.hash;
    const isEmailVerified = verifyHash(hash, emailToVerify, MY_SECRET);

    if (!isEmailVerified) {
      throw new Error('Validation Failed!');
    }
    var query = "SELECT * FROM users WHERE email='" + emailToVerify + "'";
    let result = await db.oneOrNone(query);
    if (!result) {
      throw new Error("User does not exists");
    }

    new_pass = encryptPassword(req.body.newPassword);
    var query = "UPDATE users SET password=$1 WHERE email=$2";
    await db.none(query, [new_pass, emailToVerify]);


    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    var mailOptions = {
      from: 'cell4salecontact@gmail.com',
      to: emailToVerify,
      subject: 'Your Details Has Been Updated!',
      html: passchangedMail()
    };

    let mailRes = await transporter.sendMail(mailOptions);

    res.writeHead(200);
    res.end();
  }
  catch (err) {
    res.status(500).send(err.message);
  }
});

//Get the cell-phones data from json file
app.get('/get-phones', async function (req, res) {
  try {
    let jsonPath = path.join(process.cwd(), 'vendor', 'cell_phone_data.json');
    let jsonFile = fs.readFileSync(jsonPath);
    let cellData = JSON.parse(jsonFile);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cellData));
  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
});

//Add product to 'userproducts' table
app.post('/add-to-cart', async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  var productName = req.body.productId;
  var productType = req.body.productType;
  var productPrice = req.body.productPrice;
  try {
    convertUSDtoILSrate = 0.0;
    getLocalPrice(); //get the ILS rate from USD
    //taking user ID by email from users table
    var query = "SELECT * FROM users WHERE email='" + userName + "'";
    let results = await db.oneOrNone(query);
    if (results) {
      var userID = results.id;
      var promocode = results.promocode;
      productPrice = parseFloat(productPrice);
      if (promocode == "1") { //10% discount
        productPrice = productPrice * 0.9;
      } else if (promocode == "2") { //20% discount 
        productPrice = productPrice * 0.8;
      } else if (promocode == "3") { //30% discount
        productPrice = productPrice * 0.7;
      }
      var localPrice = convertUSDtoILSrate * productPrice;
      var totalPrice = localPrice * 1.17; //calculating price includes VAT
      localPrice = localPrice.toFixed(2);
      totalPrice = totalPrice.toFixed(2);
      productPrice = productPrice.toFixed(2);
      localPrice = localPrice.toString() + 'ILS';
      totalPrice = totalPrice.toString() + 'ILS';
      productPrice = productPrice.toString() + '$';
    } else {
      res.writeHead(404);
      res.end();
    }
    //checking if item is already in cart- if true then count++, else add new row
    query = "SELECT * FROM userproducts WHERE user_id='" + userID + "'AND product_name='" + productName + "'AND product_type='" + productType + "'";
    results = await db.oneOrNone(query);
    if (!results)//insert new row in 'userproducts' table in DB
    {
      query = "INSERT INTO userproducts(user_id, product_name, product_type, product_price,count, product_local_price, product_total_price) VALUES('" + userID + "','" + productName + "','" + productType + "','" + productPrice + "','1','" + localPrice + "','" + totalPrice + "')";
      await db.none(query);
      res.writeHead(200);
      res.end();
    } else { //update the count column in product row 
      query = "UPDATE userproducts SET count=count+1 WHERE user_id='" + userID + "'AND product_name='" + productName + "'AND product_type='" + productType + "'";
      await db.none(query);
      res.writeHead(200);
      res.end();
    }
  } catch (err) {
    console.log(err.message);
  }
});

//Get user's products in cart
app.post('/get-cart', async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();

  try {
    //taking user ID by email from users table
    var query = "SELECT * FROM users WHERE email='" + userName + "'";
    let results = await db.oneOrNone(query);
    if (results) {
      var userID = results.id;
    } else {
      res.writeHead(404);
      res.end();
    }
    //getting all rows in userproducts table where user_id==userID
    query = "SELECT * FROM userproducts WHERE user_id='" + userID + "'";
    results = await db.any(query);

    if (!results) {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    }

  } catch (err) {
    console.log(err.message);
  }
});

app.post('/delete-from-cart', async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  var productName = req.body.productName;
  var productType = req.body.productType;
  try {
    //taking user ID by email from users table
    var query = "SELECT * FROM users WHERE email='" + userName + "'";
    let results = await db.oneOrNone(query);
    if (results) {
      var userID = results.id;
    } else {
      res.writeHead(404);
      res.end();
    }
    //getting all rows in userproducts table where user_id==userID
    query = "SELECT count FROM userproducts WHERE user_id='" + userID + "'AND product_name='" + productName + "'AND product_type='" + productType + "'";
    results = await db.oneOrNone(query);

    if (!results) //in case there is not such product in cart
    {
      res.writeHead(404);
      res.end();
    } else {
      if (results.count == 1) {
        query = "DELETE FROM userproducts WHERE user_id='" + userID + "'AND product_name='" + productName + "'AND product_type='" + productType + "'";
        await db.none(query);
        res.writeHead(200);
        res.end();
      } else {
        query = "UPDATE userproducts SET count=count-1 WHERE user_id='" + userID + "'AND product_name='" + productName + "'AND product_type='" + productType + "'";
        await db.none(query);
        res.writeHead(200);
        res.end();
      }
    }
  } catch (err) {
    console.log(err.message);
  }
});


app.post('/add-to-purchases', async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  //user details to update
  var userAddress = req.body.userAddress;
  var firstName = userAddress.firstName;
  var lastName = userAddress.lastName;
  var phoneNumber = userAddress.phoneNumber;
  var country = userAddress.country;
  var city = userAddress.city;
  var street = userAddress.street;
  var zipCode = userAddress.zipCode;
  //card detils to insert
  var userPayment = req.body.userPayment;
  var cardNumber = userPayment.cardNumber;
  var nameOnCard = userPayment.nameOnCard;
  var cardExp = userPayment.cardExp;
  var cardCvv = userPayment.cardCvv;
  var memo = userAddress.memo;
  //purchas date
  var date = req.body.date;
  try {
    //taking user ID by email from users table
    var query = "SELECT * FROM users WHERE email='" + userName + "'";
    let result = await db.oneOrNone(query);
    if (result) {
      var userID = result.id;
      //updating user feilds in 'users' table
      query = "UPDATE users SET name = $1 , familyname = $2 , phonenumber = $3 , country = $4 , city = $5 , street = $6 , zipcode = $7 WHERE email = $8";
      await db.none(query, [firstName, lastName, phoneNumber, country, city, street, zipCode, userName]);
      //getting all user products in cart
      query = "SELECT * FROM userproducts WHERE user_id='" + userID + "'";
      let results = await db.any(query);
      if (!results) {
        res.writeHead(404);
        res.end();
      } else {
        var productName;
        var productType;
        var productPrice;
        var productLocalPrice;
        var productTotalPrice;
        var count;
        for (var i = 0; i < results.length; i++) {
          var obj = results[i];
          productName = obj.product_name;
          productType = obj.product_type;
          productPrice = obj.product_price;
          productLocalPrice = obj.product_local_price;
          productTotalPrice = obj.product_total_price;
          count = obj.count;
          query = "INSERT INTO userpurchases(user_id, product_name, product_type, product_price,count,date, product_local_price, product_total_price, card_number, name_card, exp_date, cvv, memo) VALUES('" + userID + "','" + productName + "','" + productType + "','" + productPrice + "','" + count + "','" + date + "','" + productLocalPrice + "','" + productTotalPrice + "','" + cardNumber + "','" + nameOnCard + "','" + cardExp + "','" + cardCvv + "','" + memo + "')";
          await db.none(query);
          query = "DELETE FROM userproducts WHERE user_id='" + userID + "'";
          await db.none(query);
        } //end for

        // send mail 

        var transporter = await nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'cell4salecontact@gmail.com',
              pass: 'Aa123456!'
            }
          });
  
          var mailOptions = {
            from: 'cell4salecontact@gmail.com',
            to: userName,
            subject: 'Thank you for buying!',
            html: purchaseMail(results)
          };
  
          let mailRes = await transporter.sendMail(mailOptions);

        res.writeHead(200);
        res.end();
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (err) {
    console.log(err.message);
  }
});


app.post('/send-purchas-mail', async function (req, res) {
    var userName = req.body.email;
    userName = userName.toLowerCase();
    try{
      var query = "SELECT * FROM users WHERE email='" + userName + "'";
      let result = await db.oneOrNone(query);
      if (result) {
        var userID = result.id;
        query = "SELECT * FROM userpurchases WHERE user_id='" + userID + "'";
        let results = await db.any(query);
        if (!results) {
          res.writeHead(404);
          res.end();
        } else {
  
          var transporter = await nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'cell4salecontact@gmail.com',
              pass: 'Aa123456!'
            }
          });
  
          var mailOptions = {
            from: 'cell4salecontact@gmail.com',
            to: userName,
            subject: 'Thank you for buying!',
            html: purchaseMail(results)
          };
  
          let mailRes = await transporter.sendMail(mailOptions);
          res.writeHead(200);
          res.end();
        }
      }
    }catch(err) {
      console.log(err.message);
    }
  });








app.post('/get-purchases', async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  try {
    //taking user ID by email from users table
    var query = "SELECT * FROM users WHERE email='" + userName + "'";
    let result = await db.oneOrNone(query);
    if (result) {
      var userID = result.id;
      query = "SELECT * FROM userpurchases WHERE user_id='" + userID + "'";
      let results = await db.any(query);
      if (!results) {
        res.writeHead(404);
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results))
      }

    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (err) {
    console.log(err.message);
  }
});

app.get('*', (req, res) => {
  
  res.sendfile(process.cwd() + '/pageNotFound.html'); 
})


function getLocalPrice() {
  https.get(' https://api.exchangeratesapi.io/latest?base=USD', (resp) => {
    let data = '';
    let ils;

    resp.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      ils = JSON.parse(data);
      ils = ils.rates;
      ils = ils.ILS;
      ils = parseFloat(ils);
      convertUSDtoILSrate = ils;
      convertUSDtoILSrate = convertUSDtoILSrate.toFixed(2);
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });
}

//Password encryption function 
function encryptPassword(password) {
  console.log("start encrypt");
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


var server = app.listen(port, function () {
  console.log('Server is running on port ' + port + '..');
});

/////////////////////////////////////////////////---***functions that prepare the emails to send***---///////////////////////////////////////////
function preparePurchaseMail(products) {
  var dataRow=``;
  var subTotal =0.0;
  for(var i=0; i<products.length; i++) {
    var obj = products[i];
    dataRow += `<tr>
    <td bgcolor="#ffffff" align="left" style="padding: 0px 10px 5px 40px;"> ${obj.product_name}</td>
    <td bgcolor="#ffffff" align="left" style="padding: 0px 10px 5px 10px;" class="text-xs-center">${obj.count}</td>
    <td bgcolor="#ffffff" align="left" style="padding: 0px 10px 5px 10px;" class="text-xs-center">${obj.product_price}</td>
</tr>`;
    var price = obj.product_price;
    price = parseFloat(price);
    subTotal += price;
  }
  total = subTotal+10.0;
  subTotal = subTotal.toFixed(2);
  subTotal = subTotal.toString()+'$';
  total = total.toFixed(2);
  total = total.toString()+'$';
  dataRow += `<tr>
  <td class="highrow" bgcolor="#ffffff"  style="padding: 40px  10px 0px 10px;"></td>
  <td bgcolor="#ffffff"  style="padding: 40px 10px 0px 10px;"><strong>Subtotal</strong></td>
  <td bgcolor="#ffffff" style="padding: 40px 10px 0px 10px;">${subTotal}</td>
</tr>
<tr>
 <td class="emptyrow" bgcolor="#ffffff"style="padding: 0px 10px 0px 10px;"></td>
 
<td class="emptyrow text-xs-center" bgcolor="#ffffff" style="padding: 0px 10px 0px 10px;"><strong>Shipping</strong></td>
<td class="emptyrow text-xs-right" bgcolor="#ffffff"  style="padding: 0px 10px 0px 10px;">$10</td>
</tr>
 <tr>
  <td class="emptyrow" bgcolor="#ffffff" style="padding: 0px 10px 0px 10px;"><i class="fa fa-barcode iconbig"></i></td>
                                        
  <td class="emptyrow text-xs-center" bgcolor="#ffffff"  style="padding: 20px 10px 0px 10px;"><strong>Total</strong></td>
   <td class="emptyrow text-xs-right" bgcolor="#ffffff" style="padding: 20px 10px 0px 10px;">${total}</td>
   </tr>`;
   return dataRow;
  //$(dataRow).appendTo('#mail-item');
}

function purchaseMail(products) {
  var data = preparePurchaseMail(products);
  return `<!DOCTYPE html>
  <html dir="ltr">
  
  <head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
          @media screen {
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 700;
                  src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 400;
                  src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 700;
                  src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
              }
          }
  
          /* CLIENT-SPECIFIC STYLES */
          body,
          table,
          td,
          a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
          }
  
          img {
              -ms-interpolation-mode: bicubic;
          }
  
          /* RESET STYLES */
          img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
          }
  
          table {
              border-collapse: collapse !important;
          }
  
          body {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
          }
  
          /* iOS BLUE LINKS */
          a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
              font-family: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
          }
  
          /* MOBILE STYLES */
          @media screen and (max-width:600px) {
              h1 {
                  font-size: 32px !important;
                  line-height: 32px !important;
              }
          }
  
          /* ANDROID CENTER FIX */
          div[style*="margin: 16px 0;"] {
              margin: 0 !important;
          }
      </style>
  </head>
  
  <body  dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <!-- LOGO -->
          <tr>
              <td bgcolor="#3f3d56" align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 48px;">
                         <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" /> <h1 style="font-size: 30px; font-weight: 400; margin: 2;">Invoice For Purchase</h1> 
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">Thank you very much for your purchase! Enjoy your new phones! </p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#f4f4f4" align="center" >
                              <table class="table table-sm" border="0" cellpadding="0" cellspacing="0" width="100%" style="  max-width: 600px ;font-family:'Lato', Helvetica, Arial, sans-serif;">
                                  <thead>
                                      <tr>
                                          <td bgcolor="#ffffff" align="left" style="padding: 0px 10px 20px 40px;"><strong>Name</strong></td>
                                          <td bgcolor="#ffffff" align="left" style="padding: 0px 10px 20px 10px;"><strong>Quantity</strong></td>
                                          <td bgcolor="#ffffff" align="left" style="padding: 0px 10px 20px 10px;"><strong>Price</strong></td> 
                                      </tr>
                                  </thead>
                                  <tbody>
                                     <div class="all-products">${data}</div> 
                                     
                                  </tbody>
                              </table>
                          </td>
                   </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;"> <br> <br> If it wasn't you, just reply to this email—we're always happy to help out.</p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                         <img src="https://i.ibb.co/vHQ2HPF/undraw-receipt-ecdd.png" width="350px" style="display: block; border: 0px;" />  
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr> 
      </table>
  </body>
  
  </html>`;
}



function passchangedMail() {
  return `<!DOCTYPE html>
  <html dir="ltr">
  
  <head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
          @media screen {
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 700;
                  src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 400;
                  src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 700;
                  src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
              }
          }
  
          /* CLIENT-SPECIFIC STYLES */
          body,
          table,
          td,
          a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
          }
  
          img {
              -ms-interpolation-mode: bicubic;
          }
  
          /* RESET STYLES */
          img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
          }
  
          table {
              border-collapse: collapse !important;
          }
  
          body {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
          }
  
          /* iOS BLUE LINKS */
          a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
              font-family: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
          }
  
          /* MOBILE STYLES */
          @media screen and (max-width:600px) {
              h1 {
                  font-size: 32px !important;
                  line-height: 32px !important;
              }
          }
  
          /* ANDROID CENTER FIX */
          div[style*="margin: 16px 0;"] {
              margin: 0 !important;
          }
      </style>
  </head>
  
  <body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <!-- LOGO -->
          <tr>
              <td bgcolor="#3f3d56" align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 48px;">
                         <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" /> <h1 style="font-size: 30px; font-weight: 400; margin: 2;">Your Password Has Been Changed</h1> 
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">We just wanted to let you know your password has been changed and saved in our system!</p>
                          </td>
                      </tr>
                     
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">If it wasn't you, just reply to this email—we're always happy to help out.</p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                         <img src="https://i.ibb.co/wQcTqTj/undraw-authentication-fsn5.png" width="350px" style="display: block; border: 0px;" />  
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr> 
      </table>
  </body>
  
  </html>`
}

function emailHasChangedMail(newMail){
return `<!DOCTYPE html>
<html dir="ltr">

<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style type="text/css">
        @media screen {
            @font-face {
                font-family: 'Lato';
                font-style: normal;
                font-weight: 400;
                src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: normal;
                font-weight: 700;
                src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: italic;
                font-weight: 400;
                src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: italic;
                font-weight: 700;
                src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
            }
        }

        /* CLIENT-SPECIFIC STYLES */
        body,
        table,
        td,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        img {
            -ms-interpolation-mode: bicubic;
        }

        /* RESET STYLES */
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        table {
            border-collapse: collapse !important;
        }

        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }

        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        /* MOBILE STYLES */
        @media screen and (max-width:600px) {
            h1 {
                font-size: 32px !important;
                line-height: 32px !important;
            }
        }

        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] {
            margin: 0 !important;
        }
    </style>
</head>

<body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
    <!-- HIDDEN PREHEADER TEXT -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- LOGO -->
        <tr>
            <td bgcolor="#3f3d56" align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="left" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 48px;">
                       <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" /> <h1 style="font-size: 30px; font-weight: 400; margin: 2;">Your Email Has Been Changed</h1> 
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">We just wanted to let you know your email has been changed and saved in our system! </br> Remember, your email address is your user name. Your new mail is: ${newMail} </p>
                        </td>
                    </tr>
                   
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">If it wasn't you, just reply to this email—we're always happy to help out.</p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                       <img src="https://i.ibb.co/frD8Wyj/undraw-mention-6k5d.png" width="350px" style="display: block; border: 0px;" />  
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr> 
    </table>
</body>

</html>`



}


function preparePassMail(url) {
  return `<!DOCTYPE html>
  <html dir="ltr">
  
  <head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
          @media screen {
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 700;
                  src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 400;
                  src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 700;
                  src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
              }
          }
  
          /* CLIENT-SPECIFIC STYLES */
          body,
          table,
          td,
          a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
          }
  
          img {
              -ms-interpolation-mode: bicubic;
          }
  
          /* RESET STYLES */
          img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
          }
  
          table {
              border-collapse: collapse !important;
          }
  
          body {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
          }
  
          /* iOS BLUE LINKS */
          a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
              font-family: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
          }
  
          /* MOBILE STYLES */
          @media screen and (max-width:600px) {
              h1 {
                  font-size: 32px !important;
                  line-height: 32px !important;
              }
          }
  
          /* ANDROID CENTER FIX */
          div[style*="margin: 16px 0;"] {
              margin: 0 !important;
          }
      </style>
  </head>
  
  <body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <!-- LOGO -->
          <tr>
              <td bgcolor="#3f3d56" align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 48px;">
                         <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" /> <h1 style="font-size: 30px; font-weight: 400; margin: 2;">Reset Password</h1> 
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">In order to change your password address , just press the button below. Don't forget, your email address is your user name.</p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left">
                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;">
                                          <table border="0" cellspacing="0" cellpadding="0">
                                              <tr>
                                                  <td align="center" style="border-radius: 3px;" bgcolor="#3f3d56"><a href="${url}" target="_blank" style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #3f3d56; display: inline-block;">Reset Password</a></td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr> <!-- COPY -->
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                          </td>
                      </tr> <!-- COPY -->
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;"><a href="#" target="_blank" style="color: #3f3d56;" id="encrypted_link">${url}</a></p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">If it wasn't you, just reply to this email—we're always happy to help out.</p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                         <img src="https://i.ibb.co/4YHstvX/undraw-mobile-login-ikmv.png" width="350px" style="display: block; border: 0px;" />  
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr> 
      </table>
  </body>
  
  </html>`
}

function changeEmailMail(url){
return `<!DOCTYPE html>
<html dir="ltr">

<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <style type="text/css">
        @media screen {
            @font-face {
                font-family: 'Lato';
                font-style: normal;
                font-weight: 400;
                src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: normal;
                font-weight: 700;
                src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: italic;
                font-weight: 400;
                src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
            }

            @font-face {
                font-family: 'Lato';
                font-style: italic;
                font-weight: 700;
                src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
            }
        }

        /* CLIENT-SPECIFIC STYLES */
        body,
        table,
        td,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        img {
            -ms-interpolation-mode: bicubic;
        }

        /* RESET STYLES */
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        table {
            border-collapse: collapse !important;
        }

        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }

        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        /* MOBILE STYLES */
        @media screen and (max-width:600px) {
            h1 {
                font-size: 32px !important;
                line-height: 32px !important;
            }
        }

        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] {
            margin: 0 !important;
        }
    </style>
</head>

<body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
    <!-- HIDDEN PREHEADER TEXT -->
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- LOGO -->
        <tr>
            <td bgcolor="#3f3d56" align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="left" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 48px;">
                       <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" /> <h1 style="font-size: 30px; font-weight: 400; margin: 2;">Your Details Has Been Changed</h1> 
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">In order to change your email address , just press the button below. Don't forget, your email address is your user name.</p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="left">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;">
                                        <table border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center" style="border-radius: 3px;" bgcolor="#3f3d56"><a href="${url}" target="_blank" style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #3f3d56; display: inline-block;">Confirm New Email</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr> <!-- COPY -->
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                        </td>
                    </tr> <!-- COPY -->
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;"><a href="#" target="_blank" style="color: #3f3d56;" id="encrypted_link">${url}</a></p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">If it wasn't you, just reply to this email—we're always happy to help out.</p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                       <img src="https://i.ibb.co/19Kz75v/undraw-envelope-n8lc.png" width="350px" style="display: block; border: 0px;" />  
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr> 
    </table>
</body>

</html>`
}


function prepareMail(url) {
  return `<head>
  <title></title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <style type="text/css">
      @media screen {
          @font-face {
              font-family: 'Lato';
              font-style: normal;
              font-weight: 400;
              src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
          }

          @font-face {
              font-family: 'Lato';
              font-style: normal;
              font-weight: 700;
              src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
          }

          @font-face {
              font-family: 'Lato';
              font-style: italic;
              font-weight: 400;
              src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
          }

          @font-face {
              font-family: 'Lato';
              font-style: italic;
              font-weight: 700;
              src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
          }
      }

      /* CLIENT-SPECIFIC STYLES */
      body,
      table,
      td,
      a {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
      }

      table,
      td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
      }

      img {
          -ms-interpolation-mode: bicubic;
      }

      /* RESET STYLES */
      img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
      }

      table {
          border-collapse: collapse !important;
      }

      body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
      }

      /* iOS BLUE LINKS */
      a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
      }

      /* MOBILE STYLES */
      @media screen and (max-width:600px) {
          h1 {
              font-size: 32px !important;
              line-height: 32px !important;
          }
      }

      /* ANDROID CENTER FIX */
      div[style*="margin: 16px 0;"] {
          margin: 0 !important;
      }
  </style>
</head>

<body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
  <!-- HIDDEN PREHEADER TEXT -->
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <!-- LOGO -->
      <tr>
          <td bgcolor="#3f3d56" align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                      <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                  </tr>
              </table>
          </td>
      </tr>
      <tr>
          <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                      <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                     <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" />     <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Welcome!</h1> 
                      </td>
                  </tr>
              </table>
          </td>
      </tr>
      <tr>
          <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                      <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                          <p style="margin: 0;">We're excited to have you get started. First, you need to confirm your account. Just press the button below.</p>
                      </td>
                  </tr>
                  <tr>
                      <td bgcolor="#ffffff" align="left">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                  <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;">
                                      <table border="0" cellspacing="0" cellpadding="0">
                                          <tr>
                                              <td align="center" style="border-radius: 3px;" bgcolor="#3f3d56"><a href="${url}" target="_blank" style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #3f3d56; display: inline-block;">Confirm Account</a></td>
                                          </tr>
                                      </table>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr> <!-- COPY -->
                  <tr>
                      <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                          <p style="margin: 0;">If that doesn't work, copy and paste the following link in your browser:</p>
                      </td>
                  </tr> <!-- COPY -->
                  <tr>
                      <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                          <p style="margin: 0;"><a href="#" target="_blank" style="color: #3f3d56;" id="encrypted_link">${url}</a></p>
                      </td>
                  </tr>
                  <tr>
                      <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                          <p style="margin: 0;">If you have any questions, just reply to this email—we're always happy to help out.</p>
                      </td>
                  </tr>
                  <tr>
                      <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                          <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                      </td>
                  </tr>
              </table>
          </td>
      </tr> 
  </table>
</body>`
}

function updateDetailsMail() {
  return `<!DOCTYPE html>
  <html dir="ltr">
  
  <head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
          @media screen {
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 700;
                  src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 400;
                  src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 700;
                  src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
              }
          }
  
          /* CLIENT-SPECIFIC STYLES */
          body,
          table,
          td,
          a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
          }
  
          img {
              -ms-interpolation-mode: bicubic;
          }
  
          /* RESET STYLES */
          img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
          }
  
          table {
              border-collapse: collapse !important;
          }
  
          body {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
          }
  
          /* iOS BLUE LINKS */
          a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
              font-family: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
          }
  
          /* MOBILE STYLES */
          @media screen and (max-width:600px) {
              h1 {
                  font-size: 32px !important;
                  line-height: 32px !important;
              }
          }
  
          /* ANDROID CENTER FIX */
          div[style*="margin: 16px 0;"] {
              margin: 0 !important;
          }
      </style>
  </head>
  
  <body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <!-- LOGO -->
          <tr>
              <td bgcolor="#3f3d56" align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 30px; font-weight: 400; line-height: 48px;">
                         <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" /> <h1 style="font-size: 30px; font-weight: 400; margin: 2;">Your Details Has Been Changed</h1> 
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">We just wanted to let you know your new personal details has been changed and saved in our system! </p>
                          </td>
                      </tr>
   
      
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">If it wasn't you, just reply to this email—we're always happy to help out.</p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                         <img src="https://i.ibb.co/93tfPyX/undraw-personal-info-0okl.png" width="300px" style="display: block; border: 0px;" />  
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr> 
      </table>
  </body>
  
  </html>`


}

function prepareCongratsMail() {

  return `<!DOCTYPE html>
  <html dir="ltr">
  
  <head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
          @media screen {
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: normal;
                  font-weight: 700;
                  src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 400;
                  src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
              }
  
              @font-face {
                  font-family: 'Lato';
                  font-style: italic;
                  font-weight: 700;
                  src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
              }
          }
  
          /* CLIENT-SPECIFIC STYLES */
          body,
          table,
          td,
          a {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
          }
  
          table,
          td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
          }
  
          img {
              -ms-interpolation-mode: bicubic;
          }
  
          /* RESET STYLES */
          img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
          }
  
          table {
              border-collapse: collapse !important;
          }
  
          body {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
          }
  
          /* iOS BLUE LINKS */
          a[x-apple-data-detectors] {
              color: inherit !important;
              text-decoration: none !important;
              font-size: inherit !important;
              font-family: inherit !important;
              font-weight: inherit !important;
              line-height: inherit !important;
          }
  
          /* MOBILE STYLES */
          @media screen and (max-width:600px) {
              h1 {
                  font-size: 32px !important;
                  line-height: 32px !important;
              }
          }
  
          /* ANDROID CENTER FIX */
          div[style*="margin: 16px 0;"] {
              margin: 0 !important;
          }
      </style>
  </head>
  
  <body dir="ltr" style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"> We're thrilled to have you here! Get ready to dive into your new account. </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <!-- LOGO -->
          <tr>
              <td bgcolor="#3f3d56" align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td align="center" valign="top" style="padding: 40px 10px 40px 10px;"> </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#3f3d56" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                         <img src="https://i.ibb.co/0qTd1BG/logo.png" width="250px" style="display: block; border: 0px;" />     <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Congarulations!</h1> 
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
          <tr>
              <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">We're excited to have you in our team!</p>
                          </td>
                      </tr>
                  
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">If you have any questions, just reply to this email—we're always happy to help out.</p>
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
                         <img src="https://i.ibb.co/xDb1XNT/undraw-celebration-0jvk.png" width="550px" style="display: block; border: 0px;" />  
                          </td>
                      </tr>
                      <tr>
                          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                              <p style="margin: 0;">Thank You,<br>Cell4Sale Team</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr> 
      </table>
  </body>
  
  </html>`





}