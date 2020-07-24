var email;
var password;
var password_confirmation;
var name;
var subject;
var themessage;
var status;


function clearfiledLogin()
{
    document.getElementById("validemail").innerHTML= "";
    document.getElementById("validpassword").innerHTML ="";
    document.getElementById("errorMessage").innerHTML="";
}

function clearfiledSignup()
{
    document.getElementById("validemail").innerHTML= "";
    document.getElementById("validpassword1").innerHTML ="";
    document.getElementById("validpassword2").innerHTML="";
    document.getElementById("errorMessage").innerHTML="";
}

function clearfiledforgetpass()
{
    document.getElementById("errorMessage2").innerHTML="";
}


function loginCaptcha(){
    var error_message = document.getElementById("errorMessage");
    var response = grecaptcha.getResponse();
    if(response.length==0){
      error_message.innerHTML="You must confirm that you are not a robot!";
    }
    else Login();
  }


function loginWithFacebook(){
    var error_message = document.getElementById("errorMessage");
	FB.api('/me','GET',{"fields":"id,name,email,first_name,middle_name,last_name"},
    function(response) {
    console.log(response);
	 const data = {email: response.email , firstname : response.first_name , lastname : response.last_name};
    $.ajax({
        type: 'POST',
        url: '/loginf',
        data: data,
        // Login Successful
        success: function(userData){
            console.log(userData);
            sessionStorage.setItem('user', JSON.stringify(userData))
            location.replace('/index');
        },
        error: function(res){
            error_message.innerHTML="Oops... can't login with facebook";
        }
    });
 }
);
}


function Login()
{   
    email_text_box = document.getElementById("emailLogin");
    password_text_box = document.getElementById("passwordLogin");
    error_message = document.getElementById("errorMessage");

    var credentials={
        userName: email_text_box.value,
        password: password_text_box.value
    }
    if(credentials.userName==="" || credentials.password==="")
    {
        
        if(credentials.userName==="")
        {
            error_message.innerHTML= "Please insert your E-mail address";
        }
       
        if(credentials.password==="")
        {
            error_message.innerHTML ="Password must contain at least 6 characters, uppercase, lowercase, number, special character.";
        }
        return;
    }
    if (!validateEmail(email_text_box.value)){
        error_message.innerHTML= "Invalid Email";
        return;
    }
    if(!validatePassword(password_text_box.value)){
        error_message.innerHTML ="Password must contain at least 6 characters, uppercase, lowercase, number, special character.";
        return;
    }

    $.ajax({
        type: 'POST',
        url: '/login',
        data: credentials,
        // Login Successful
        success: function(userData){
            console.log(userData);
            sessionStorage.setItem('user', JSON.stringify(userData))
            location.replace('/index');
        },
        error: function(res){
            error_message.innerHTML="Oops... wrong email or password";
        }
    });
}

function SignUp()
{
    email_text_box = document.getElementById("emailSignUp");
    password_text_box = document.getElementById("passwordSignUp");
    password_confirmation_txt_box = document.getElementById("confirmation");
    first_text_box = document.getElementById("first");
    last_text_box = document.getElementById("last");
    error_message = document.getElementById("errorMessage");

    var signUp_details={
        email: email_text_box.value,
        password: password_text_box.value,
        firstname: first_text_box.value,
        familyname: last_text_box.value
    }

    email=email_text_box.value;
    password=password_text_box.value;
    password_confirmation=password_confirmation_txt_box.value;

    if(email==""||password==""||password_confirmation=="")
    {
        if(email=="")
        {
            error_message.innerHTML= "Please insert your E-mail address";
        }
        if(password=="")
        {
            error_message.innerHTML= "Password must contain at least 6 characters,<br>uppercase, lowercase, number, special character";
        }
        if(password_confirmation=="")
        {
            error_message.innerHTML= "Please insert your password again for confirmation";
        }
        return;
    }

    if(validateEmail(email))
    {
    
        if(validatePassword(password))
        {  
            if(password != password_confirmation)
            {
            error_message.innerHTML= "Password and confirm password does not match";
            return;
            } 
        }
        else{
            error_message.innerHTML= "Password must contain at least 6 characters,<br>uppercase, lowercase, number, special character";
            return;
        }
    }
    else
    {
        error_message.innerHTML= "Invalid Email ";
        return;
    }


    $.ajax({
        type: 'POST',
        url: '/register',
        data: signUp_details,
        // Sign up Successful
        success: function(userData){
            error_message.innerHTML="Congratulations! You registered successfully! ";
            sessionStorage.setItem('user', JSON.stringify(userData))
            location.replace('/index');
        },
        error: function(err){
            console.log(err);
            error_message.innerHTML="Oops... User already exists, please choose different email address";
        }
    });

}


function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}


function validatePassword(password)
{
    var reg;
    if(password.length < 6)
    {
        console.log(1);
        return false;
    }

    reg=/[A-Z]/;
    if(!reg.test(password))
    {
        console.log(2);
        return false;
    }

    reg=/[a-z]/;
    if(!reg.test(password))
    {
        console.log(3);
        return false;
    }

    reg=/\d/;
    if(!reg.test(password))
    {
        console.log(4);
        return false;
    }

    reg=/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if(!reg.test(password))
    {
        console.log(5);
        return false;
    }

    return true;
}


function forget(){
    error_message= document.getElementById("errorMessage2").value;
    var forget_details={
        email: document.getElementById("emailforget").value,
    }
  
    if(forget_details.email=="")
    {
        error_message.innerHTML= "Please insert your E-mail address";
        return;
    }


    $.ajax({
        type: 'POST',
        url: '/forget-password',
        data: forget_details,
 
        success: function(userData){
            error_message.innerHTML="Email with a verification link is sent to your email!";
        },
        error: function(res){
            error_message.innerHTML="Oops... Somting wrong happend. Enter your email again!";
        }
    });
}

// function update_table(){
//     var userDetails = JSON.parse(sessionStorage.getItem('user'));
//     console.log(userDetails);

//     console.log("update");
//     $.ajax({
//         type: 'POST',
//         url: '/getUserData',
//         data: userDetails,
//         success: function(table_data){
//             console.log("yayyy!!!");
//             insert_to_table(table_data);
//         },
//         error: function(res){
//             console.log("shiiitt!!")
//         }
//     });
// }


function logOut()
{
    sessionStorage.removeItem("user");
    location.replace('/login');
}

