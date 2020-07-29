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
const { verifyHash, generateVerificationHash } = require('dbless-email-verification');
var pgp = require('pg-promise')();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const MY_SECRET = 'linoyshirannofaruri';

//////////////////////////////////////////////---***our URL String***---/////////////////////////////////////////////

const API_URL = 'http://localhost:3000/';

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


app.get('/email_varifi', function (req, res) {
  res.sendFile(process.cwd() + '/email_varifi.html');
  console.log("Redirected to login page");
});

//////////////////////////////////////////////---***Profile Handling Function***---/////////////////////////////////////////////

//Get the profile-details 
app.post('/profileupdate', async function (req, res) {
  var userToUpdate = req.body;
  try {

    var query = "UPDATE users SET name = $1 , familyname = $2 , phonenumber = $3 , country = $4 , city = $5 , street = $6 , zipcode = $7 WHERE email = $8";
    await db.none(query, [userToUpdate.name, userToUpdate.familyname, userToUpdate.phonenumber, userToUpdate.country, userToUpdate.city, userToUpdate.street, userToUpdate.zipcode, userToUpdate.email]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(userToUpdate));
  }
  catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});


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
    password: req.body.password
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
    await db.none('INSERT INTO users(${this:name}) VALUES(${this:csv})', obj);
    var query = "SELECT * FROM users WHERE email='" + obj.email + "'";
    let result = await db.one(query);
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
      from: 'testForBraude@gmail.com',
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

  if (!isEmailVerified) {
    throw new Error('Not Found');
  }

  var query = "UPDATE users SET confirmed=$1 WHERE email=$2";
  await db.none(query, [true, emailToVerify]);

  try {

    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cell4salecontact@gmail.com',
        pass: 'Aa123456!'
      }
    });

    var mailOptions = {
      from: 'testForBraude@gmail.com',
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
    confirmed: false
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
      from: 'testForBraude@gmail.com',
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
    else {
      ////////////////////////////////////////send link to the mail to insert new password
    }

  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Get the cell-phones data from json file
app.get('/get-phones', async function (req, res) {
  try {
    let jsonFile = fs.readFileSync('cell_phone_data.json');
    let cellData = JSON.parse(jsonFile);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cellData));
  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(err));
  }
});

app.post('/add-to-cart',async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  var productName = req.body.productId;
  var productType = req.body.productType;
  var productPrice = req.body.productPrice;

  try{
    //taking user ID by email from users table
    var query = "SELECT * FROM users WHERE email='" + userName + "'";
    let results = await db.oneOrNone(query);
    if(results)
    {
      var userID = results.id;
    } else{
      res.writeHead(404);
      res.end();
    }
    //checking if item is already in cart- if true the count++, else add new row
    query = "SELECT * FROM userproducts WHERE user_id='" + userID + "'AND product_name='"+productName+"'AND product_type='"+productType+"'";
    results = await db.oneOrNone(query);
    if(!results)//insert new row in 'userproducts' table in DB
    {
      query = "INSERT INTO userproducts(user_id, product_name, product_type, product_price,count) VALUES('"+userID+"','"+productName+"','"+productType+"','"+productPrice+"','1')";
      await db.none(query);
      res.writeHead(200);
      res.end();
    } else{ 
    query = "UPDATE userproducts SET count=count+1 WHERE user_id='" + userID + "'AND product_name='"+productName+"'AND product_type='"+productType+"'";
    await db.none(query);
    res.writeHead(200);
    res.end();
    }
} catch (err) {
  console.log(err.message);
}
});

//Get user's products in cart
app.post('/get-cart',async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  
  try{
   //taking user ID by email from users table
   var query = "SELECT * FROM users WHERE email='" + userName + "'";
   let results = await db.oneOrNone(query);
   if(results)
   {
     var userID = results.id;
   } else{
     res.writeHead(404);
     res.end();
   }
   //getting all rows in userproducts table where user_id==userID
   query = "SELECT * FROM userproducts WHERE user_id='" + userID + "'";
   results = await db.any(query);

   if(!results)
   {
    res.writeHead(404);
    res.end();
   }else{
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
   }
 
} catch (err) {
  console.log(err.message);
}
});

app.post('/delete-from-cart',async function (req, res) {
  var userName = req.body.email;
  userName = userName.toLowerCase();
  var productName = req.body.productName;
  var productType = req.body.productType;
  try{
   //taking user ID by email from users table
   var query = "SELECT * FROM users WHERE email='" + userName + "'";
   let results = await db.oneOrNone(query);
   if(results)
   {
     var userID = results.id;
   } else{
     res.writeHead(404);
     res.end();
   }
   //getting all rows in userproducts table where user_id==userID
   query = "SELECT count FROM userproducts WHERE user_id='" + userID +"'AND product_name='"+productName+"'AND product_type='"+productType+"'";
   results = await db.oneOrNone(query);
  
   if(!results) //in case there is not such product in cart
   {
    res.writeHead(404);
    res.end();
   }else{
     console.log(results);
     if(results.count == 1)
     {
      query = "DELETE FROM userproducts WHERE user_id='"+userID+"'AND product_name='"+productName+"'AND product_type='"+productType+"'";
      await db.none(query);
      res.writeHead(200);
      res.end();
     } else{
      query = "UPDATE userproducts SET count=count-1 WHERE user_id='" + userID + "'AND product_name='"+productName+"'AND product_type='"+productType+"'";
      await db.none(query);
      res.writeHead(200);
      res.end();
     }
   }
} catch (err) {
  console.log(err.message);
}
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
var server = app.listen(port, function () {
  console.log('Server is running on port ' + port + '..');
});








//////////////////////////////////////////////---***Forgeet-Password Handling Function***---/////////////////////////////////////////////


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

<body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
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


function prepareCongratsMail() {

  return `<!DOCTYPE html>
  <html>
  
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
  
  <body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
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