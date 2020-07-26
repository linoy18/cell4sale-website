var email;
var password;
var password_confirmation;
var name;
var subject;
var themessage;
var indexFlag = -1;
var phoneType;

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
            location.replace('/login');
        },
        error: function (err) {
            // console.log(err);
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


function getPhones()
{
    //Get request from server - get all phones data from json file
    $.ajax({
        type: 'GET',
        url: '/get-phones',
        dataType: 'json',
        success: function(phonesData){
            //Cell-phones images
            let phonesImg = [
                {  name: "Samsung Galaxy S10", img: "https://i.ibb.co/ZWPVwBS/galaxy10.jpg" },
                {  name: "Huawei P40",  img: "https://i.ibb.co/fXbn9bd/hwawi.jpg"  },
                {  name: "iPhone 11 Pro Max",   img: "https://i.ibb.co/1Ghn9GC/iphone11.jpg" },
                {  name: "OnePlus 8",   img: "https://i.ibb.co/d4w25nT/1.jpg" },
                {  name: "Xiaomi Redmi Note 8",  img: "https://i.ibb.co/jR4N7zs/Xiamo.jpg"  },
                {  name: "Google pixel 4",  img: "https://i.ibb.co/mS4PxHN/googlepixel.jpg"}
            ];
        
            data = JSON.parse(JSON.stringify(phonesData));

            for (var i = 0; i < data.length; i++) { //foreach cell-phone type
                var obj = data[i]; 
                var innerTypes =``;
                var phoneImg = ``;
                
                for(var k = 0; k < phonesImg.length; k++){  //selecting phone image
                    if(phonesImg[k].name == obj.id){
                        phoneImg = phonesImg[k].img;
                        console.log(phoneImg);
                    }
                } //end picking phone image

                for(var j=0; j < obj.models.length; j++){ //foreach type model (size) 
                    var objModel = obj.models[j];
                    innerTypes += `<div class="size" onclick="showPriceAndText('${objModel.price}','${objModel.text}','${i}','${objModel.type}')">`+ objModel.type+`</div>`;
                } //end inserting type models

                var dataRow =  `<div class="container1">
                <div class="images"><img class="img_product" src=`+phoneImg+`/></div> 
                <p class="pick">Choose Memory Size</p>
                <div class="sizes">`+innerTypes +`</div>
                <div class="product"> <p>Phone for sale</p><h1>`+obj.id+`</h1><div id="price-${i}" class="price1"></div>
                  <p class="desc">`+obj.description+`</p>
                  <div id="text-${i}"></div>
                  <div class="buttons"><button id="addToCart-${i}" class="add" onclick="addToCart('${obj.id}','${i}')">Add to Cart</button></div>
                </div></div>`;
                $(dataRow).appendTo('#wrapper1');
            } //end inserting all phones
        },
        error: function(err){   alert(err); }
    });
}

function showPriceAndText(price, text, index, type)
{
    var dataRowPrice= "<h2>"+price+"</h2>";
    var dataRowText = "<p>"+text+"<p>";
    $(`#price-${index}`).html(dataRowPrice);
    $(`#text-${index}`).html(dataRowText);
    indexFlag = index;
    phoneType = type;
}

function updateDetails()
{
    console.log("im here in updateDetails function:)!");
}

function addToCart(productId, index)
{
   if(index == indexFlag){
    var productData = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
        productId: productId,
        productType: phoneType
    }

    $.ajax({
        type: 'POST',
        url: '/add-to-cart',
        data: productData,
        success: function (data) {
            
        },
        error: function (err) {
            alert(err);
        }
    });
   } else{
       alert("Please choose model first");
   }

 
        //alert("Choose a product first");
    

}

function getCart()
{
    var userName = {
        email: JSON.parse(sessionStorage.getItem('user')).email,
    }
    location.replace('/cart.html');

    //Get request from server - all products in user cart
    $.ajax({
        type: 'POST',
        url: '/get-cart',
        data: userName,

        success: function (cartData) {
           
        },
        error: function (err) {
            alert(err);
        }
    });

}



