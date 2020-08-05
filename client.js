var email;
var password;
var password_confirmation;
var name;
var subject;
var themessage;
var indexFlag = -1;
var phoneType;
var phonePrice;
var discount = 0;
//Cell-phones images
const phonesImg = [
    { name: "Samsung Galaxy S10", img: "https://i.ibb.co/nMQ5SN4/Samsung-Galaxy-S10.png" },
    { name: "Huawei P40", img: "https://i.ibb.co/xsLQZfG/Huawei-P40.png" },
    { name: "iPhone 11 Pro Max", img: "https://i.ibb.co/4F1t4hK/iphone.png" },
    { name: "OnePlus 8", img: "https://i.ibb.co/xCRzySM/One-Plus-8.png" },
    { name: "Xiaomi Redmi 8", img: "https://i.ibb.co/f03Wkwd/Xiaomi-Redmi-Note-8.png" },
    { name: "Google pixel 4", img: "https://i.ibb.co/8cMHvzB/Google-pixel-4.png" }
];

const phonesImgSmall = [
    { name: "Samsung Galaxy S10", img: "https://i.ibb.co/QYCTsrL/galaxy10.png" },
    { name: "Huawei P40", img: "https://i.ibb.co/DKS6z8L/hwawi.png" },
    { name: "iPhone 11 Pro Max", img: "https://i.ibb.co/PDNNJG3/iphone11.png" },
    { name: "OnePlus 8", img: "https://i.ibb.co/jD3cjSx/1.png" },
    { name: "Xiaomi Redmi 8", img: "https://i.ibb.co/zNPTjqS/Xiamo.png" },
    { name: "Google pixel 4", img: "https://i.ibb.co/pKL9YP2/googlepixel.png" }
];


function forgetPassCaptcha() {
    var error_message = document.getElementById("errorMessage2");
    var response = grecaptcha.getResponse();
    if (response.length == 0) {
        error_message.innerHTML = "You must confirm that you are not a robot!";
    }
    else forget();
}
    function onSubmitForget(token) {
        document.getElementById("resetPassBtn").disabled = false;
    }


function registerCaptcha() {
    var error_message = document.getElementById("errorMessage");
    var response = grecaptcha.getResponse();
    if (response.length == 0) {
        error_message.innerHTML = "You must confirm that you are not a robot!";
    }
    else SignUp();
}


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
                    error_message.innerHTML = "Oops... can't login with facebook,<br/> Try login with your Cell4Sale account if you have one";
                }
            });
        }
    );
}


function Login() {
    email_text_box = document.getElementById("emailLogin");
    password_text_box = document.getElementById("passwordLogin");
    error_message = document.getElementById("errorMessage");
    if (document.getElementById("customCheck").value == 'on') {
        remember_me = true;
    } else {
        remember_me = false;
    }

    var credentials = {
        userName: email_text_box.value,
        password: password_text_box.value,
        rememberMe: remember_me
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
        url: '/login/',
        data: credentials,
        // Login Successful
        success: function (userData) {
            sessionStorage.setItem('user', JSON.stringify(userData));
            getCart();
            location.replace('/index');
        },
        error: function (err) {
            if (err.responseText === 'VERIFICATION') {
                location.replace('/resendVerfication');
            }
            else {
                console.log(err);
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
    promo_code = document.getElementById("promocode").value;

    console.log(promo_code);

    if (promo_code == "3XCRt") {
        promo_code = "1";
    }
    else if (promo_code == "4DFG") {
        promo_code = "2";
    }
    else if (promo_code == "6DSQW") {
        promo_code = "3";
    }
    else {
        promo_code = "0";
    }

    var signUp_details = {
        email: email_text_box.value,
        password: password_text_box.value,
        firstname: first_text_box.value,
        familyname: last_text_box.value,
        promocode: promo_code
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
    document.getElementById("resetPassBtn").disabled = false;
    error_message = document.getElementById("errorMessage2");
    var forget_details = {
        email: document.getElementById("emailforget").value,
    }

    if (forget_details.email == "") {
        error_message.innerHTML = "Please insert your E-mail address";
        return;
    }
    $.ajax({
        type: 'POST',
        url: '/forgetpassword',
        data: forget_details,

        success: function (userData) {
            $('#forgetPassModal').modal('show');
        },
        error: function (res) {
            error_message.innerHTML = "Oops... Somting wrong happend. Enter your email again!";
        }
    });
}

function updatePassword() {
    var error_message = document.getElementById("errorMessage2");
    var passwordInput = document.getElementById("passforget");
    var passwordInput2 = document.getElementById("pass2forget");
    if (passwordInput.value === "") {
        error_message.innerHTML = "Please insert your password for confirmation";
        return;
    }

    if (passwordInput2.value === "") {
        error_message.innerHTML = "Please insert your password again for confirmation";
        return;
    }

    if (passwordInput.value != passwordInput2.value) {
        error_message.innerHTML = "Password and confirm password does not match";
        return;
    }
    if (!validatePassword(passwordInput.value)) {
        error_message.innerHTML = "Password must contain at least 6 characters, uppercase, lowercase, number, special character.";
        return;
    }

    var urlParams = new URLSearchParams(window.location.search);
    var newPasswordBody = {
        newPassword: passwordInput.value,
        email: urlParams.get('email'),
        hash: urlParams.get('verificationHash')
    }

    $.ajax({
        type: 'POST',
        url: '/setnewpassword',
        data: newPasswordBody,

        success: function (userData) {
            $('#activatePassModal').modal('show');
        },
        error: function (res) {
            console.log("hi3");
            error_message.innerHTML = "Oops... Somting wrong happend. Try again please.";
        }
    });
}

function updateMainUserName() {

    var userName = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
    }
    $.ajax({
        type: 'POST',
        url: '/profiledetails',
        data: userName,
        success: function (profile_details) {
            var user_name = profile_details.name + ' ' + profile_details.familyname;
            $('#user-name-main').append(user_name);
        },
        error: function (err) { console.log(err); }
    });

}

function logout() {
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
    var userName = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
    }
    $.ajax({
        type: 'POST',
        url: '/profiledetails',
        data: userName,
        success: function (profile_details) {
            updateDetails2(profile_details);
        },
        error: function (err) { console.log(err); }
    });

}


function updateDetails2(prev_profile_details) {
    var error_message = document.getElementById("errorMessageProfile");
    var userToUpdate = {
        email: prev_profile_details.email,
        password: $('#password_profile').val(),
        passwordConfirm: $('#password2_profile').val(),
        name: $('#firstName_profile').val(),
        familyname: $('#lastName_profile').val(),
        street: $('#street_profile').val(),
        city: $('#city_profile').val(),
        country: $('#country_profile').val(),
        phonenumber: $('#number_profile').val(),
        zipcode: $('#zipcode_profile').val()
    }


    
    if (userToUpdate.name == "") {
        userToUpdate.name = prev_profile_details.name;
    }
    if (userToUpdate.familyname == "") {
        userToUpdate.familyname = prev_profile_details.familyname;
    }
    if (userToUpdate.street == "") {

        userToUpdate.street = prev_profile_details.street;
    }
    if (userToUpdate.city == "") {
        userToUpdate.city = prev_profile_details.city;
    }
    if (userToUpdate.country == "") {
        userToUpdate.country = prev_profile_details.country;
    }
    if (userToUpdate.phonenumber == "") {
        userToUpdate.phonenumber = prev_profile_details.phonenumber;
    }
    if (userToUpdate.zipcode == "") {
        userToUpdate.zipcode = prev_profile_details.zipcode;
    }

    if (userToUpdate.password == "") {
        userToUpdate.password = prev_profile_details.password;
    }


    if (userToUpdate.password != prev_profile_details.password) {
        if (userToUpdate.password != "" && userToUpdate.passwordConfirm == "") {
            error_message.innerHTML = "Please insert your password again for confirmation";
            return;
        }
        if (userToUpdate.password != userToUpdate.passwordConfirm) {
            error_message.innerHTML = "Password and confirm password does not match";
            return;
        }
        if (userToUpdate.password == "" && userToUpdate.passwordConfirm != "") {
            error_message.innerHTML = "Please insert your password for confirmation";
            return;
        }
        if (!validatePassword(userToUpdate.password)) {
            error_message.innerHTML = "Password must contain at least 6 characters, uppercase, lowercase, number, special character";
            return;
        }
    }

    var emailInput = $('#email_profile').val();

    if (emailInput == "") {
        userToUpdate.newEmail = prev_profile_details.email;
    }
    else if (emailInput !== prev_profile_details.email) {
        if(!validateEmail(emailInput)) {
            error_message.innerHTML = "Please insert a valid email address";
            return;
        }
        else{
        userToUpdate.newEmail = emailInput;
        }
    }
    

    $.ajax({
        type: 'POST',
        url: '/profileupdate',
        data: userToUpdate,
        success: function (user_updated) {
            updateUserProfileFields(user_updated);
            if(userToUpdate.newEmail)
            {
              $('#emailUpdateModal').modal('show');
            }
            else {
            $('#updateModal').modal('show');
            }
        },
        error: function (err) { console.log(err); }
    });
}

/*updateUserProfileFields:
input: userDetails-user updated information from db
output: displayed updated input fields in 'profile.html' page */
function updateUserProfileFields(userDetails) {
    showCartNumber();
    var user_name = userDetails.name + ' ' + userDetails.familyname;
    $('#user-name-main').append(user_name);
    $('#user-name-label').append(user_name);
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
function showAddressTabFields(userDetails) {
    showCartNumber();
    var user_name = userDetails.name + ' ' + userDetails.familyname;
    $('#user-name-main').append(user_name);
    $('#check-first-name').val(userDetails.name);
    $('#check-last-name').val(userDetails.familyname);
    $('#check-street').val(userDetails.street);
    $('#check-city').val(userDetails.city);
    $('#check-country').val(userDetails.country);
    $('#check-phone-number').val(userDetails.phonenumber);
    $('#check-zip').val(userDetails.zipcode);
    checkAddressFields();
}

function showPassConfirmation() {
    $("#password2div").show();
    $('#email_profile_div').addClass('col-sm-3').removeClass('col-sm-4');
    $('#password_profile_div').addClass('col-sm-3').removeClass('col-sm-5');
}


/*showPassword: 
trigger: user click on 'eye_pass' element
output: password diaplayed to the user */
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

/*getPhones:
trigger: user click on 'Mobile Phones' tab in side menu
output: displayed all phones from json file getting from server side*/
function getPhones() {
    updateMainTab();
    $.ajax({
        type: 'GET',
        url: '/get-phones',
        dataType: 'json',
        success: function (phonesData) {
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
                    <img class="img_product" src=`+ phoneImg + ` />
                  </div>
                  <div class="col-6">
                    <div class="product">
                      <h1>`+ obj.id + `</h1>
                      <div id="price-${i}" class="price1"></div>
                      <p class="desc">`+ obj.description + `</p>
                      <div id="text-${i}"></div>
                    </div>
                  </div>
                </div>
              
                <div class="row">
                  <div class="col-8">
                    <p class="pick">Choose Memory Size</p>
                    <div class="sizes">`+ innerTypes + `</div>
                  </div>
                  <div class="col">
                    <div class="buttons"><button id="addToCart-${i}" class="add" onclick="addToCart('${obj.id}','${i}')">Add to
                        Cart</button></div>
                  </div>
                </div>
              </div> `;
                $(dataRow).appendTo('#wrapper1');
            } //end inserting all phones
        },
        error: function (err) {
            alert(err.responseText);
            console.error(err);
        }
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
function addToCart(productId, index) {
    if (index == indexFlag) {
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
                $('#addToCart').modal('show');
            },
            error: function (err) {
                alert(err);
            }
        });
    } else {
        $('#phoneCapacityModal').modal('show');
    }
}

/*getCart:
trigger: user click on 'cart' span in the top of the window (topbar)
output: get all user products from 'userproducts' table, store them and replace to 'cart.html' page*/
function getCart() {
    var userName = { email: JSON.parse(sessionStorage.getItem('user')).email };

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

function updateMainTab(){
    showCartNumber();
    updateMainUserName();
}

function showCartNumber(){
    var cartData = JSON.parse(sessionStorage.getItem('cart-data'));
    if(cartData==null){
        return;
    }
    var cart_num =0;
    if (cartData.length == 0) {
    }
    else{
        for (var i = 0; i < cartData.length; i++) {
            var obj = cartData[i];
            cart_num = obj.count+cart_num ;
        }
        $('#cart-number').html("+"+cart_num );
    }
}

/*showCart:
trigger: loading 'cart.html' page
output: get items stored by "getCart()" and displayed in page
 */
function showCart() {
    updateMainTab();
    var cartData = JSON.parse(sessionStorage.getItem('cart-data'));
    var cartTotPrice = 0;
    if (cartData.length == 0) {
        $('#discount-message').html("</br> Your cart is empty");
        $('#cart-subtotal').html("");
        $('#total-price-text').html("");
       
    } else {
        for (var i = 0; i < cartData.length; i++) {
            var obj = cartData[i];
            var totPrice = parseFloat(obj.product_price);
            var priceCount = parseFloat(obj.product_price) * obj.count;
            priceCount = priceCount.toFixed(0);
            priceCount = priceCount.toString() + '$';
            totPrice = 1.17 * totPrice * obj.count;
            cartTotPrice += totPrice;
            totPrice = totPrice.toFixed(0);
            totPrice = totPrice.toString()+'$';
            var phoneImg = ``;

            for (var k = 0; k < phonesImgSmall.length; k++) {  //selecting phone image
                if (phonesImgSmall[k].name == obj.product_name) {
                    phoneImg = phonesImgSmall[k].img;
                }
            } //end picking phone image



            var dataRow = `<div class="product">

            <div class="product-image">
              <img src=`+phoneImg+`>
            </div>
            <div class="product-details">
              <div class="product-title">`+obj.product_name+`</div>
              <p class="product-description">`+obj.product_type+`</p>
            </div>
            <div class="product-price">`+obj.product_price+`</div>
            <div class="product-quantity">
              <input type="text" readonly value="${obj.count}">
            </div>
            <div class="product-removal">
              <button class="remove-product" onclick="deleteProductFromCart('${obj.product_name}','${obj.product_type}')">
                Remove Item
              </button>
            </div>
            <div class="product-line-price">`+totPrice+`</div>
          </div>`;
          $(dataRow).appendTo('#cart-item');

        }

        cartTotPrice = parseFloat(cartTotPrice);
        cartTotPrice = cartTotPrice.toFixed(0);
        cartTotPrice = cartTotPrice.toString() + '$';
        $('#total-price-text').html("Total: ");
        $('#cart-subtotal').html(cartTotPrice);

        var promocode = { promocode: JSON.parse(sessionStorage.getItem('user')).promocode }
        if (promocode.promocode == "1") {
            $('#discount-message').html("You received a 10% discount!");
        } else if (promocode.promocode == "2") {
            $('#discount-message').html("You received a 20% discount!");
        } else if (promocode.promocode == "3") {
            $('#discount-message').html("You received a 30% discount!");
        } else {
            $('#discount-message').html("");
        }

        dataRow= `<button class="checkout" onclick="checkOut()">Checkout</button>`;
        $(dataRow).appendTo('#cart-checkout-button');
    }
       
}

/*deleteProductFromCart:
input: productName-phone name (id), productType-phone size (model id)
trigger: user click on 'X' button next to product details
output: if count=1 - remove entiry row, else - sub count by one */
function deleteProductFromCart(productName, productType) {
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

/*checkOut:
trigger: user click on 'check-out' button in 'cart.html' page
output: 'payment.html' page
 */
function checkOut() {
    $('#check-address-next').prop('disabled', true);
    location.replace('/payment.html');
}

/*checkAddressFields:
trigger: eventHendler on input fields in 'Address' tab
output: if all fields have values - enable 'Next' button*/
function checkAddressFields() {
    var userDetails = {
        firstName: $('#check-first-name').val(),
        lastName: $('#check-last-name').val(),
        phoneNumber: $('#check-phone-number').val(),
        country: $('#check-country').val(),
        city: $('#check-city').val(),
        street: $('#check-street').val(),
        zipCode: $('#check-zip').val(),
        memo: $('#special-request').val()
    };
    if ((userDetails.firstName == "") || (userDetails.lastName == "") || (userDetails.phoneNumber == "")
        || (userDetails.country == "") || (userDetails.city == "") || (userDetails.street == "") || (userDetails.zipCode == "")) {
        $('#check-address-next').prop('disabled', true);
    }
    else {
        $('#check-address-next').prop('disabled', false);
        sessionStorage.setItem('user-address', JSON.stringify(userDetails));
    }
}

/*checkPaymentFields:
trigger: eventHendler on input fields in 'Payment' tab
output: if all fields have values - enable 'Submit' button*/
function checkPaymentFields() {
    var payDetails = {
        cardNumber: $('#check-card-number').val(),
        nameOnCard: $('#check-name-on-card').val(),
        cardExp: $('#check-exp-card').val(),
        cardCvv: $('#check-cvv-card').val()
    };
    if ((payDetails.cardNumber == "") || (payDetails.nameOnCard == "") || (payDetails.cardExp == "")
        || (payDetails.cardCvv == "")) {
        $('#check-payment-submit').prop('disabled', true);
        $('#check-pay-next').prop('disabled', true);
    } else {
        $('#check-payment-submit').prop('disabled', false);
        $('#check-pay-next').prop('disabled', false);
        sessionStorage.setItem('user-payment', JSON.stringify(payDetails));
    }
}

/*fillCart:
trigger: user click on 'Next' button from 'Address' tab in 'payment.html' page
output: displayed user cart in container */
function fillCart() {
    var userName = { email: JSON.parse(sessionStorage.getItem('user')).email };
    //Get request from server - all products in user cart
    $.ajax({
        type: 'POST',
        url: '/get-cart',
        data: userName,
        dataType: 'json',
        success: function (cartData) {
            var totalPrice = 0.0;
            //before showing the cart need to clean cart form
            $('#enter-product').each(function () {
                $(".pToEmpty").empty();
            });
            for (var i = 0; i < cartData.length; i++) {
                var obj = cartData[i];
                var dataRow = `<p class="pToEmpty">` + obj.count + `X ` + obj.product_name + `<span class="price">` + obj.product_price + `</span>
                </p>`;
                $(dataRow).appendTo('#enter-product');
                totalPrice += parseFloat(obj.product_price) * obj.count;
            } //end for
            totalPriceVat = totalPrice * 1.17;
            cartToPrice = totalPriceVat;
            totalPrice = totalPrice.toFixed(0);
            totalPriceVat = totalPriceVat.toFixed(0);
            totalPrice = totalPrice.toString() + '$';
            totalPriceVat = totalPriceVat.toString() + '$';
            $('#total-price-payment').html(totalPrice);
            $('#total-price-vat').html(totalPriceVat);
        },
        error: function (err) {
            alert(err);
        }
    });
}

/*addToPurchases:
trigger: user click on 'purchas' button in 'Payment' tab*/
function addToPurchases() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;
    var userAddress = JSON.parse(sessionStorage.getItem('user-address'));
    var userPayment = JSON.parse(sessionStorage.getItem('user-payment'));
    console.log(userAddress);
    var userAddressAndPayment = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
        userAddress: userAddress,
        userPayment: userPayment,
        date: today
    };
    $.ajax({
        type: 'POST',
        url: '/add-to-purchases',
        data: userAddressAndPayment,
        success: function (res) {
            getCart();
            location.replace('/profile.html');
        },
        error: function (err) {
            alert(err.message);
        }
    });
}

function sendPurchasMail() {
    var userName = {  email: JSON.parse(sessionStorage.getItem('user')).email}
    $.ajax({
    type: 'POST',
    url: '/send-purchas-mail',
    data: userName,
    success: function (data) {
        alert("ok!");
    },
    error: function (err) {
        alert(err.message);
    }
});
}

function getPurchases() {
    var userName = { email: JSON.parse(sessionStorage.getItem('user')).email };
    $.ajax({
        type: 'POST',
        url: '/get-purchases',
        data: userName,
        success: function (purchasesData) {
            sessionStorage.setItem('purchases-data', JSON.stringify(purchasesData));
            showPurchases();
        },
        error: function (err) {
            alert(err);
        }
    });
}


function formatDate(date1){
    date = new Date(date1);
    var year= date.getFullYear();
    var month= date.getMonth()+1;
    var day= date.getDate();
    var date_result= day+"."+month+"."+year; 
    return date_result;
}

function showPurchases() {
    var purchasesData = JSON.parse(sessionStorage.getItem('purchases-data'));

    $('#purchas-item').each(function () {
        $(".pToEmpty").empty();
    });

    for (var i = 0; i < purchasesData.length; i++) {
        var obj = purchasesData[i];
        var phoneImg = ``;
        for (var k = 0; k < phonesImgSmall.length; k++) {  //selecting phone image
            if (phonesImgSmall[k].name == obj.product_name) {
                phoneImg = phonesImgSmall[k].img;
            }
        } //end picking phone image

        var date_result= formatDate(obj.date);

        var dataRow = `<div class="product pToEmpty">
        <div class="product-image">
          <img src=`+phoneImg+`>
        </div>
        <div class="product-details">
          <div class="product-title">`+obj.product_name+`</div>
          <p class="product-description">`+obj.product_type+`</p>
        </div>
        <div class="product-price">`+obj.product_price+`</div>
  
        <div class="product-quantity">
          <input type="text" readonly value="${obj.count}">
        </div>
        <div class="product-removal">`+date_result+`</div>
        <div class="product-line-price ">`+obj.product_price+`</div>
      </div>`;
      $(dataRow).appendTo('#purchas-item');




    //     var dataRow = `<div class="item">
    //     <div class="price"></div>
    //     <div class="image"><img src=`+phoneImg+` alt="" />
    //     </div>
    //     <div class="price-pur">
    //         <div class="description">
    //             <span>`+ obj.product_name + `</span>
    //             <span>`+ obj.product_type + `</span>
    //         </div>
    //         <div>
    //             <div style="display: inline-flex;">Date of purchase:
    //             </div>
    //             <div style="display: inline-flex;">`+ obj.date + `</div>
    //         </div>
    //         <div>
    //             <div style="display: inline-flex;">Total Amount:
    //             </div>
    //             <div style="display: inline-flex;">`+ obj.product_price + `</div>
    //         </div>
    //         <div>
    //             <div>Quantity:</div>
    //             <div>`+ obj.count + `</div>
    //         </div>
    //     </div>
    // </div>`;
    //     $(dataRow).appendTo('#wrapper2');
    }//end for
}


