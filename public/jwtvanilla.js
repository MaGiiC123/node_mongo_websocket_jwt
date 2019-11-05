// make the request to the login endpoint
function getToken() {
    var loginUrl = "http://localhost:4000/login"
    var xhr = new XMLHttpRequest();
    var userElement = document.getElementById('username');
    var passwordElement = document.getElementById('password');
    var tokenElement = document.getElementById('token');
    var user = userElement.value;
    var password = passwordElement.value;
  
    xhr.open('POST', loginUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.addEventListener('load', function() {
        var responseObject = JSON.parse(this.response);
        console.log(responseObject);
        if (responseObject.token) {
            tokenElement.innerHTML = responseObject.token;
        } else {
            tokenElement.innerHTML = "No token received";
      }
    });
  
    var sendObject = JSON.stringify({name: user, password: password});  
    console.log('going to send', sendObject);  
    xhr.send(sendObject);
}

// make the request to the secret API endpoint
function getSecret() {
    var url = "http://localhost:4000/secret";
    var xhr = new XMLHttpRequest();
    var tokenElement = document.getElementById('token');
    var resultElement = document.getElementById('result');
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization", "JWT " + tokenElement.innerHTML);
    xhr.addEventListener('load', function() {
        var responseObject = JSON.parse(this.response);
        console.log(responseObject);
        resultElement.innerHTML = this.responseText;
    });
  
    xhr.send(null);
}

//replace angular calls with vanilla js here
function authenticateUser(_username, _pw) {
    console.log('trying to authenticate!');

    _username = document.getElementById('username');
    _pw = document.getElementById('password');

    var url = "http://localhost:4000/users/authenticate";
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.addEventListener('load', function() {
        var responseObject = JSON.parse(this.response);
        console.log(responseObject);
        saveSessionToken(responseObject);
    });
    
    var sendObject = JSON.stringify({username: _username.value, password: _pw.value});
    console.log(sendObject);
    xhr.send(sendObject);
}

function registerUser(_username, _pw) {
    console.log('trying to authenticate!');

    _username = document.getElementById('username');
    _pw = document.getElementById('password');

    var url = "http://localhost:4000/users/register";
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.addEventListener('load', function() {
        var responseObject = JSON.parse(this.response);
        console.log(responseObject);
    });
    
    //var sendObject = JSON.stringify({username: _username.value, password: _pw.value});
    var sendObject = JSON.stringify({firstName: "test", lastName: "test", username: "test", password: "test"});
    console.log(sendObject);
    xhr.send(sendObject);
}

function saveSessionToken(responseObject) {
    console.log('saving token: "'+ responseObject.token +'"');
    localStorage.setItem('userSessionToken', responseObject.token);
    localStorage.setItem('userSessionToken_TimeStamp', responseObject.createdDate);
}

function getSessionToken() {
    
}