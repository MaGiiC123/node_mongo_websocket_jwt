const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')

const config = require('config.json');
const userService = require('users/user.service');

router.all('*', general);
router.post('/signin', signIn);
router.post('/refresh', refresh);
router.get('/welcome', welcome);

const jwtKey = config.secret;
const jwtExpirySeconds = 300

const users = {
    user1: 'password1',
    user2: 'password2'
}

function signIn(req, res) {
    /*// Get credentials from JSON body
    const { username, password } = req.body
    if (!username || !password || users[username] !== password) {
        // return 401 error is username or password doesn't exist, or if password does
        // not match the password in our records
        return res.status(401).end()
    }*/

    userService.authenticate(req.body)
        .then(user => user ? res.status(200).json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));

    // Create a new token with the username in the payload
    // and which expires 300 seconds after issue
    const token = jwt.sign({ username }, jwtKey, { algorithm: 'HS256', expiresIn: jwtExpirySeconds });
    console.log('token:', token)

    // set the cookie as the token string, with a similar max age as the token
    // here, the max age is in milliseconds, so we multiply by 1000
    res.cookie('token', token, { maxAge: jwtExpirySeconds * 1000 })
    res.end()
}

function welcome(req, res) {
    // We can obtain the session token from the requests cookies, which come with every request
    const token = req.cookies.token

    // if the cookie is not set, return an unauthorized error
    if (!token) {
        return res.status(401).end()
    }

    var payload
    try {
        // Parse the JWT string and store the result in `payload`.
        // Note that we are passing the key in this method as well. This method will throw an error
        // if the token is invalid (if it has expired according to the expiry time we set on sign in),
        // or if the signature does not match
        payload = jwt.verify(token, jwtKey)
    } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
            // if the error thrown is because the JWT is unauthorized, return a 401 error
            return res.status(401).end()
        }
        // otherwise, return a bad request error
        return res.status(400).end()
    }

    // Finally, return the welcome message to the user, along with their
    // username given in the token
    res.send(`Welcome ${payload.username}!`)
}

function refresh(req, res) {
    // (BEGIN) The code uptil this point is the same as the first part of the `welcome` route
    const token = req.cookies.token

    if (!token) {
        return res.status(401).end()
    }

    var payload
    try {
        payload = jwt.verify(token, jwtKey)
    } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
            return res.status(401).end()
        }
        return res.status(400).end()
    }
    // (END) The code uptil this point is the same as the first part of the `welcome` route

    // We ensure that a new token is not issued until enough time has elapsed
    // In this case, a new token will only be issued if the old token is within
    // 30 seconds of expiry. Otherwise, return a bad request status
    const nowUnixSeconds = Math.round(Number(new Date()) / 1000)
    if (payload.exp - nowUnixSeconds > 30) {
        return res.status(400).end()
    }

    // Now, create a new token for the current user, with a renewed expiration time
    const newToken = jwt.sign({ username: payload.username }, jwtKey, {
        algorithm: 'HS256',
        expiresIn: jwtExpirySeconds
    })

    // Set the new token as the users `token` cookie
    res.cookie('token', newToken, { maxAge: jwtExpirySeconds * 1000 })
    res.end()
}

function general(req, res, next) {
    console.log(req.url);
    if (req.url.includes(config.unauthenticatedRoutes[0]) || req.url.includes("authenticate") ) {
        /*if (req.user != undefined) {
            console.log("unauth route but authenticated");
            next();
            return; 
        }*/
        console.log("unauth route but not logged in");
        next();
        return;
    }

    console.log("general jwt auth start");
    var xxx = String(req.headers.cookie).split(';')[0].split('=')[1];
    console.log("Authorization header: ", req.header("Authorization"));
    console.log("Authorization cookie: ", xxx);

    var tokenToVerify = (req.header("Authorization") == undefined 
                        || req.header("Authorization") == null)
                        ? req.header("Authorization")
                        : xxx;
    
    if (req.header("Authorization") != undefined || req.header("Authorization") != null) {
        tokenToVerify = req.header("Authorization");
    } else {
        tokenToVerify = xxx;
    }
    console.log("token found: ", tokenToVerify);
    console.log(req.header);
    if (tokenToVerify != null && tokenToVerify != undefined) {
        jwt.verify(tokenToVerify, config.secret, function(err, decodedToken) {
            if (err) {
                console.log("token verify error: ", err);
                return res.status(401).json({ message: 'Invalid Token' });
            } else if (decodedToken) {
                console.log("decodedToken: ", decodedToken);
            }
        });
    }

    console.log("general jwt auth end");
    next();
}

module.exports = router;