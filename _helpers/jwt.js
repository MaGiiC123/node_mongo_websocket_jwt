const expressJwt = require('express-jwt');
const config = require('config.json');
const userService = require('../users/user.service');

module.exports = jwt;

function jwt() {
    return expressJwt({
        secret: config.secret,
        isRevoked: isRevoked_callback,
        credentialsRequired: false,
        getToken: function fromHeaderOrQuerystring (req) {
            console.log("req.headers cookie:");
            console.log(String(req.headers.cookie).split(';')[0].split('=')[1]);

            if (String(req.headers.cookie).split(';')[0].split('=')[1]) {
                return String(req.headers.cookie).split(';')[0].split('=')[1];
            }
            return null;
        },
    }).unless({ path: [
            // public routes that don't require authentication
            '/users/authenticate',
            '/users/register',
            '/public/index',
            '/public/index.html',
            '/public/jwtvanilla.js',
            '/public/jwtvanilla',
            '/'
        ]
    });
}

async function isRevoked_callback(req, payload, done) {
    console.log("payload:");
    console.log(payload);
    const user = await userService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
}; //does not even check the token