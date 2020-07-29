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
    {  name: "Samsung Galaxy S10", img: "https://i.ibb.co/nMQ5SN4/Samsung-Galaxy-S10.png" },
    {  name: "Huawei P40",  img: "https://i.ibb.co/xsLQZfG/Huawei-P40.png"  },
    {  name: "iPhone 11 Pro Max",   img: "https://i.ibb.co/4F1t4hK/iphone.png" },
    {  name: "OnePlus 8",   img: "https://i.ibb.co/xCRzySM/One-Plus-8.png" },
    {  name: "Xiaomi Redmi 8",  img: "https://i.ibb.co/f03Wkwd/Xiaomi-Redmi-Note-8.png"  },
    {  name: "Google pixel 4",  img: "https://i.ibb.co/8cMHvzB/Google-pixel-4.png"}
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

/*getProfileDetails:
trigger: loading 'profile.html' page
output: get user information from db*/
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

/*getAddressDetails:
trigger: user click on 'address' tab on 'payment.html' page (need to change)
output: get user information from db */
function getAddressDetails() {
    //Get request from server - get all profile details from DB
    var userName = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
    }
    $.ajax({
        type: 'POST',
        url: '/profiledetails',
        data: userName,
        success: function (profile_details) {
            showAddressTabFields(profile_details);
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

/*updateUserProfileFields:
input: userDetails-user updated information from db
output: displayed updated input fields in 'profile.html' page */
function updateUserProfileFields(userDetails) 
{
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

/*showAddressTabFields:
input: userDetails-user information from db
output: displayed input fields in address tab on 'payment.html' page */
function showAddressTabFields(userDetails) 
{
    $('#check-first-name').val(userDetails.name);
    $('#check-last-name').val(userDetails.familyname);
    $('#check-street').val(userDetails.street);
    $('#check-city').val(userDetails.city);
    $('#check-country').val(userDetails.country);
    $('#check-phone-number').val(userDetails.phonenumber);
    $('#check-zip').val(userDetails.zipcode);
}

function showPassConfirmation() {
    $("#password2div").show();
}

/*showPassword: 
trigger: user click on 'eye_pass' element
output: password diaplayed to the user */ 
function showPassword()
{
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

/*getPhones:
trigger: user click on 'Mobile Phones' tab in side menu
output: displayed all phones from json file getting from server side*/
function getPhones() {
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
                    innerTypes += `<Button class="size" onclick="showPriceAndText('${objModel.price}','${objModel.text}','${i}','${objModel.type}')">` + objModel.type + `</Button>`;
                } //end inserting type models
                var dataRow = `<div class="container1">
                <div class="row">
                <div class="col-6">
                <img class="img_product" src="https://i.ibb.co/pr3j1f3/galaxy10.png"/>
                </div>
                <div class="col-6"> 
                <div class="product"> 
                <p>Phone for sale</p><h1>`+ obj.id + `</h1>
                <div id="price-${i}" class="price1"></div>
                <p class="desc">`+ obj.description + `</p>
                <div id="text-${i}"></div> 
                </div> 
                </div>
                <div class="row">
                <div class="col-6">
                <p class="pick">Choose Memory Size</p>
                <div class="sizes">`+ innerTypes + `</div>
                </div>
                <div class="col-6">
                <div class="buttons"><button id="addToCart-${i}" class="add" onclick="addToCart('${obj.id}','${i}')">Add to Cart</button></div>
                </div>
                </div>
                </div> `;
                $(dataRow).appendTo('#wrapper1');
            } //end inserting all phones
        },
        error: function (err) { alert(err); }
    });
}

/*showPriceAndText:
input: price-phone price (global variable), text-type description (waranty),
index-index of phone name (id), type-phone size (global variable)
trigger: user click on 'size' button
output: price and text displayed in item 'container1'*/
function showPriceAndText(price, text, index, type) {
    var dataRowPrice = "<h2>" + price + "</h2>";
    var dataRowText = "<p>" + text + "<p>";
    $(`#price-${index}`).html(dataRowPrice);
    $(`#text-${index}`).html(dataRowText);
    indexFlag = index;
    phoneType = type;
    phonePrice = price;
}

/*addToCart:
input: productId-phone name (id), index-index of phone name (id)
trigger: user click on 'add to cart' button in item container
output: if an item is selected- add the item to 'userproducts' table in db
else- show error pop-up*/
function addToCart(productId, index)
{
   if(index == indexFlag){
    var productData = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
        productId: productId,
        productType: phoneType,
        productPrice: phonePrice
    };
    //Post request from server - add choosing product to cart in db
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

/*getCart:
trigger: user click on 'cart' span in the top of the window (topbar)
output: get all user products from 'userproducts' table, store them and replace to 'cart.html' page*/
function getCart()
{
    var userName = { email: JSON.parse(sessionStorage.getItem('user')).email };
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

/*showCart:
trigger: loading 'cart.html' page
output: get items stored by "getCart()" and displayed in page
 */
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
       <div class="buttons"><span class="delete-btn" onclick="deleteProductFromCart('${obj.product_name}','${obj.product_type}')"></span>
       </div>
     <div class="image">
       <img src="https://i.ibb.co/pr3j1f3/galaxy10.png" alt="" />
     </div>
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

/*deleteProductFromCart:
input: productName-phone name (id), productType-phone size (model id)
trigger: user click on 'X' button next to product details
output: if count=1 - remove entiry row, else - sub count by one */
function deleteProductFromCart(productName, productType)
{
    var productData = { 
        email: JSON.parse(sessionStorage.getItem('user')).email,
        productName: productName,
        productType: productType 
    };
    $.ajax({
        type: 'POST',
        url: '/delete-from-cart',
        data: productData,
        success: function (res) {
            getCart();
        },
        error: function (err) {
            alert(err);
        }
    });  
}

function checkOut()
{
    location.replace('/payment.html');
}

/*checkAddressFields:
trigger: user click on 'Next' button on 'Address' tab in 'payment.html' page
output: if all fields have values - move to 'Payment' tab, else- show error pop-up */
function checkAddressFields()
{
    var userDetails = {
        firstName: $('#check-first-name').val(),
        lastName: $('#check-last-name').val(),
        phoneNumber: $('#check-phone-number').val(),
        country: $('#check-country').val(),
        city: $('#check-city').val(),
        street: $('#check-street').val(),
        zipCode: $('#check-zip').val()
    };
    if((userDetails.firstName=="")||(userDetails.lastName=="")||(userDetails.phoneNumber=="")
    ||(userDetails.country=="")||(userDetails.city=="")||(userDetails.street=="")||(userDetails.zipCode==""))
    {
        alert("Plase fill all fields before payment");
    }
    else{
        //document.getElementById('#check-address-next').disabled = false;
        //display payment tab
    }
}








