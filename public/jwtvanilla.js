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

    //xhr.setRequestHeader({ Authorization: "Bearer " + localStorage.getItem("userSessionToken") });
    xhr.setRequestHeader("Authorization", localStorage.getItem("userSessionToken"));

    xhr.addEventListener('load', function() {
        console.log('auth server response' + "| status:" + this.response.status);

        var responseObject = JSON.parse(this.response);
        console.log(xhr.status);
        console.log(responseObject);
        saveSessionToken(responseObject);
        if (xhr.status == 200) {
            //startWebsocket();
            //window.location.href = "http://localhost:4000/public/shizzle/index.html";


            //stop
            //window.location.assign("http://localhost:4000/public/shizzle/index.html");
        }

        console.log('auth server response');
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
    //var sendObject = JSON.stringify({firstName: "test", lastName: "test", username: "test", password: "test"});
    var sendObject = JSON.stringify({firstName: _username.value, lastName: _username.value, username: _username.value, password: _pw.value});
    console.log(_username);
    console.log(sendObject);
    xhr.send(sendObject);
}

function saveSessionToken(responseObject) {
    console.log('saving token: "'+ responseObject.token +'"');
    localStorage.setItem('userSessionToken', responseObject.token);
    localStorage.setItem('userSessionToken_TimeStamp', responseObject.createdDate);

    //document.cookie = "userSessionToken;" + responseObject.token + ";";
    //document.cookie = "userSessionToken_TimeStamp;" + responseObject.createdDate + ";";
    document.cookie = "userSessionToken=" + responseObject.token + ";  path=/";
    document.cookie = "userSessionToken_TimeStamp=" + responseObject.createdDate + ";  path=/";
    document.cookie = "Authorization=Bearer " + responseObject.token + ";  path=/";
}

function getSessionToken() {
    
}
//document.cookie = 'X-Authorization=testCookie; path=/';
//-----------------------------------------------------------------------------------------------
function startWebsocket() {
    var content = document.getElementById("content");
    var input = document.getElementById("input");
    var status = document.getElementById("status");

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        /*content.html($('<p>', { text: 'Sorry, but your browser doesn\'t ' + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();*/
        alert('Sorry, but your browser doesn not support WebSockets!');
        return;
    }

    // open connection
    var connection = new WebSocket('ws://127.0.0.1:4000');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttribute('disabled');
        status.textContent = 'Choose name:';
    };

    connection.onerror = function (error) {
        //content.html($('<p>', { text: 'Sorry, but there\'s some problem with your ' + 'connection or the server is down.' } ));
        alert('Sorry, but there is a problem with your connection or the server is down.')
        console.log(error);
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'color') { // first response from the server with user's color
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
            input.removeAttribute('disabled').focus();
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text, json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message
            input.removeAttribute('disabled'); // let the user write another message
            addMessage(json.data.author, json.data.text, json.data.color, new Date(json.data.time));
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    //input.keydown(function(e) {
    input.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
            //var msg = $(this).val();
            var msg = input.value;
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
            connection.send(msg);
            //$(this).val('');
            input.value = '';
            // disable the input field to make the user wait until server
            // sends back response
            input.setAttribute('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.setAttribute('disabled', 'disabled').val('Unable to comminucate with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt) {
        content.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
                + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
                + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
                + ': ' + message + '</p>');
    }
}