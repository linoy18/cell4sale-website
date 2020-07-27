// const { controllers } = require("chart.js");

var email;
var password;
var password_confirmation;
var name;
var subject;
var themessage;
var indexFlag = -1;
var phoneType;
var phonePrice;
//Cell-phones images
let phonesImg = [
    {  name: "Samsung Galaxy S10", img: "https://i.ibb.co/ZWPVwBS/galaxy10.jpg" },
    {  name: "Huawei P40",  img: "https://i.ibb.co/fXbn9bd/hwawi.jpg"  },
    {  name: "iPhone 11 Pro Max",   img: "https://i.ibb.co/1Ghn9GC/iphone11.jpg" },
    {  name: "OnePlus 8",   img: "https://i.ibb.co/d4w25nT/1.jpg" },
    {  name: "Xiaomi Redmi Note 8",  img: "https://i.ibb.co/jR4N7zs/Xiamo.jpg"  },
    {  name: "Google pixel 4",  img: "https://i.ibb.co/mS4PxHN/googlepixel.jpg"}
];

function loginCaptcha() {
    var error_message = document.getElementById("errorMessage");
    var response = grecaptcha.getResponse();
    if (response.length == 0) {
        error_message.innerHTML = "You must confirm that you are not a robot!";
    }
    else Login();
}

function loginWithFacebook() {
    var error_message = document.getElementById("errorMessage");
    FB.api('/me', 'GET', { "fields": "id,name,email,first_name,middle_name,last_name" },
        function (response) {
            console.log(response);
            const data = { email: response.email, firstname: response.first_name, lastname: response.last_name };
            $.ajax({
                type: 'POST',
                url: '/loginf',
                data: data,
                // Login Successful
                success: function (userData) {
                    sessionStorage.setItem('user', JSON.stringify(userData))
                    location.replace('/index');
                },
                error: function (res) {
                    error_message.innerHTML = "Oops... can't login with facebook";
                }
            });
        }
    );
}


function Login() {
    email_text_box = document.getElementById("emailLogin");
    password_text_box = document.getElementById("passwordLogin");
    error_message = document.getElementById("errorMessage");

    var credentials = {
        userName: email_text_box.value,
        password: password_text_box.value
    }
    if (credentials.userName === "" || credentials.password === "") {

        if (credentials.userName === "") {
            error_message.innerHTML = "Please insert your E-mail address";
        }

        if (credentials.password === "") {
            error_message.innerHTML = "Password must contain at least 6 characters, uppercase, lowercase, number, special character.";
        }
        return;
    }
    if (!validateEmail(email_text_box.value)) {
        error_message.innerHTML = "Invalid Email";
        return;
    }
    if (!validatePassword(password_text_box.value)) {
        error_message.innerHTML = "Password must contain at least 6 characters, uppercase, lowercase, number, special character.";
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/login',
        data: credentials,
        // Login Successful
        success: function (userData) {
            sessionStorage.setItem('user', JSON.stringify(userData))
            location.replace('/index');
        },
        error: function (err) {
            if (err.responseText === 'VERIFICATION') {
                location.replace('/resendVerfication');
            }
            else {
                error_message.innerHTML = "Oops... wrong email or password";
            }
        }
    });
}

function SignUp() {
    email_text_box = document.getElementById("emailSignUp");
    password_text_box = document.getElementById("passwordSignUp");
    password_confirmation_txt_box = document.getElementById("confirmation");
    first_text_box = document.getElementById("first");
    last_text_box = document.getElementById("last");
    error_message = document.getElementById("errorMessage");

    var signUp_details = {
        email: email_text_box.value,
        password: password_text_box.value,
        firstname: first_text_box.value,
        familyname: last_text_box.value
    }

    email = email_text_box.value;
    password = password_text_box.value;
    password_confirmation = password_confirmation_txt_box.value;

    if (email == "" || password == "" || password_confirmation == "") {
        if (email == "") {
            error_message.innerHTML = "Please insert your E-mail address";
        }
        if (password == "") {
            error_message.innerHTML = "Password must contain at least 6 characters,<br>uppercase, lowercase, number, special character";
        }
        if (password_confirmation == "") {
            error_message.innerHTML = "Please insert your password again for confirmation";
        }
        return;
    }

    if (validateEmail(email)) {

        if (validatePassword(password)) {
            if (password != password_confirmation) {
                error_message.innerHTML = "Password and confirm password does not match";
                return;
            }
        }
        else {
            error_message.innerHTML = "Password must contain at least 6 characters,<br>uppercase, lowercase, number, special character";
            return;
        }
    }
    else {
        error_message.innerHTML = "Invalid Email ";
        return;
    }


    $.ajax({
        type: 'POST',
        url: '/register',
        data: signUp_details,
        // Sign up Successful
        success: function (userData) {
            error_message.innerHTML = "Congratulations! You registered successfully! ";
            sessionStorage.setItem('user', JSON.stringify(userData))
            location.replace('/email_varifi');
        },
        error: function (err) {
            // console.log(err);
            error_message.innerHTML = err.message;
        }
    });

}

function open_login() {

    $.ajax({
        type: 'GET',
        url: '/login',
        success: function () {
            // sessionStorage.setItem('user', JSON.stringify())
            location.replace('/login');
        },
        error: function (err) {
            error_message.innerHTML = err.message;
        }
    });

}

function resendEmail() {
    var email = document.getElementById('emailInput').value
    error_message = document.getElementById("errorMessage");

    if (!validateEmail(email)) {
        error_message.innerHTML = "Invalid Email ";
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/resendVerfication',
        data: { email: email },
        // Sign up Successful
        success: function (userData) {
            location.replace('/login');
        },
        error: function (err) {
            error_message.innerHTML = err.responseText;
        }
    });
}



function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


function validatePassword(password) {
    var reg;
    if (password.length < 6) {
        console.log(1);
        return false;
    }

    reg = /[A-Z]/;
    if (!reg.test(password)) {
        console.log(2);
        return false;
    }

    reg = /[a-z]/;
    if (!reg.test(password)) {
        console.log(3);
        return false;
    }

    reg = /\d/;
    if (!reg.test(password)) {
        console.log(4);
        return false;
    }

    reg = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (!reg.test(password)) {
        console.log(5);
        return false;
    }

    return true;
}


function forget() {
    error_message = document.getElementById("errorMessage2").value;
    var forget_details = {
        email: document.getElementById("emailforget").value,
    }

    if (forget_details.email == "") {
        error_message.innerHTML = "Please insert your E-mail address";
        return;
    }


    $.ajax({
        type: 'POST',
        url: '/forget-password',
        data: forget_details,

        success: function (userData) {
            error_message.innerHTML = "Email with a verification link is sent to your email!";
        },
        error: function (res) {
            error_message.innerHTML = "Oops... Somting wrong happend. Enter your email again!";
        }
    });
}


function logOut() {
    sessionStorage.removeItem("user");
    location.replace('/login');
}



function getProfileDetails() {
    //Get request from server - get all profile details from DB
    var userName = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
    }
    $.ajax({
        type: 'POST',
        url: '/profiledetails',
        data: userName,
        success: function (profile_details) {
            updateUserProfileFields(profile_details);
        },
        error: function (err) { console.log(err); }
    });
}

function updateDetails() {
    //update profile fields after change
    var userToUpdate = {
        email: $('#email_profile').val(),
        password: $('#password_profile').val(),
        name: $('#firstName_profile').val(),
        familyname: $('#lastName_profile').val(),
        street: $('#street_profile').val(),
        city: $('#city_profile').val(),
        country: $('#country_profile').val(),
        phonenumber: $('#number_profile').val(),
        zipcode: $('#zipcode_profile').val()
    }
    $.ajax({
        type: 'POST',
        url: '/profileupdate',
        data: userToUpdate,
        success: function (user_updated) {
            console.log(user_updated);
            updateUserProfileFields(user_updated);
        },
        error: function (err) { console.log(err); }
    });
}
function updateUserProfileFields(userDetails) {
    $('#email_profile').val(userDetails.email);
    $('#password_profile').val(userDetails.password);
    $('#firstName_profile').val(userDetails.name);
    $('#lastName_profile').val(userDetails.familyname);
    $('#street_profile').val(userDetails.street);
    $('#city_profile').val(userDetails.city);
    $('#country_profile').val(userDetails.country);
    $('#number_profile').val(userDetails.phonenumber);
    $('#zipcode_profile').val(userDetails.zipcode);
}

function showPassConfirmation() {

    $("#password2div").show();

}


function showPassword() {

    $(".toggle-password").click(function () {

        $(this).toggleClass("fa-eye fa-eye-slash");
        var input = $($(this).attr("toggle"));
        if (input.attr("type") == "password") {
            input.attr("type", "text");
        } else {
            input.attr("type", "password");
        }
    });

}



function getPhones() {
    //Get request from server - get all phones data from json file
    $.ajax({
        type: 'GET',
        url: '/get-phones',
        dataType: 'json',
        success: function(phonesData){
            data = JSON.parse(JSON.stringify(phonesData));

            for (var i = 0; i < data.length; i++) { //foreach cell-phone type
                var obj = data[i];
                var innerTypes = ``;
                var phoneImg = ``;

                for (var k = 0; k < phonesImg.length; k++) {  //selecting phone image
                    if (phonesImg[k].name == obj.id) {
                        phoneImg = phonesImg[k].img;
                        console.log(phoneImg);
                    }
                } //end picking phone image

                for (var j = 0; j < obj.models.length; j++) { //foreach type model (size) 
                    var objModel = obj.models[j];
                    innerTypes += `<div class="size" onclick="showPriceAndText('${objModel.price}','${objModel.text}','${i}','${objModel.type}')">` + objModel.type + `</div>`;
                } //end inserting type models

                var dataRow = `<div class="container1">
                <div class="images"><img class="img_product" src=`+ phoneImg + `/></div> 
                <p class="pick">Choose Memory Size</p>
                <div class="sizes">`+ innerTypes + `</div>
                <div class="product"> <p>Phone for sale</p><h1>`+ obj.id + `</h1><div id="price-${i}" class="price1"></div>
                  <p class="desc">`+ obj.description + `</p>
                  <div id="text-${i}"></div>
                  <div class="buttons"><button id="addToCart-${i}" class="add" onclick="addToCart('${obj.id}','${i}')">Add to Cart</button></div>
                </div></div>`;
                $(dataRow).appendTo('#wrapper1');
            } //end inserting all phones
        },
        error: function (err) { alert(err); }
    });
}

function showPriceAndText(price, text, index, type) {
    var dataRowPrice = "<h2>" + price + "</h2>";
    var dataRowText = "<p>" + text + "<p>";
    $(`#price-${index}`).html(dataRowPrice);
    $(`#text-${index}`).html(dataRowText);
    indexFlag = index;
    phoneType = type;
    phonePrice = price;
}

function addToCart(productId, index)
{
   if(index == indexFlag){
    var productData = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
        productId: productId,
        productType: phoneType,
        productPrice: phonePrice
    }
    //Post request from server - add choosing product to cart in DB
    $.ajax({
        type: 'POST',
        url: '/add-to-cart',
        data: productData,
        success: function (res) {
            //here I need to add +1 to cart counter after getting cart items from server
            alert("Product added to cart successfully!:)");
        },
        error: function (err) {
            alert(err);
        }
    });
   } else{

       alert("Please choose model first");
   }
}


function getCart()
{
    var userName = { email: JSON.parse(sessionStorage.getItem('user')).email }
    //Get request from server - all products in user cart
    $.ajax({
        type: 'POST',
        url: '/get-cart',
        data: userName,
        dataType: 'json',
        success: function (cartData) {
           sessionStorage.setItem('cart-data', JSON.stringify(cartData));
           location.replace('/cart.html');
        },
        error: function (err) {
            alert(err);
        }
    });
}


function showCart()
{
    var cartData = JSON.parse(sessionStorage.getItem('cart-data'));
    var cartTotPrice = 0 ;
    for(var i = 0; i < cartData.length; i++)
    {
        var obj = cartData[i];
        var totPrice = parseFloat(obj.product_price);
        var priceCount = parseFloat(obj.product_price)*obj.count;
        priceCount = priceCount.toFixed(0);
        priceCount = priceCount.toString()+'$';
        totPrice = 1.17*totPrice*obj.count;
        cartTotPrice +=totPrice;
        totPrice = totPrice.toFixed(0);
        totPrice = totPrice.toString();
        var phoneImg = ``;

        for(var k = 0; k < phonesImg.length; k++){  //selecting phone image
            if(phonesImg[k].name == obj.product_name){
                phoneImg = phonesImg[k].img;
            }
        } //end picking phone image
       var dataRow = `<div class="item">
       <div class="buttons"><span class="delete-btn"></span></div>
     <div class="image">
       <img src="https://i.ibb.co/pr3j1f3/galaxy10.png" alt="" /></div>
     <div class="description">
       <span>`+obj.product_name+`</span>
       <span>`+obj.product_type+`</span>
       <span></span>
     </div>
     <div class="quantity">
       <button class="plus-btn" type="button" name="button">
         <!-- <img src="plus.svg" alt="" /> -->
         <i class="fa fa-plus" aria-hidden="true"></i>
       </button>
       <input type="text" name="name" value="${obj.count}">
       <button class="minus-btn" type="button" name="button">
         <!-- <img src="minus.svg" alt="" /> -->
         <i class="fa fa-minus" aria-hidden="true"></i>
       </button>
     </div>
     <div class="total-price">Price: `+priceCount+`</div>
     <div class="total-price">Total Price (including 17% VAT):`+totPrice+`$</div></div>` ;
        $(dataRow).appendTo('#cart-item');
    }
    cartTotPrice = parseFloat(cartTotPrice);
    cartTotPrice =cartTotPrice.toFixed(0);
    cartTotPrice = cartTotPrice.toString() +'$';
    $('#cart-total-price').html(cartTotPrice);

}


