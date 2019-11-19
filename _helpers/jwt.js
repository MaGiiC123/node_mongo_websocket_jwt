const expressJwt = require('express-jwt');
const config = require('config.json');
const userService = require('../users/user.service');

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ 
        secret,
        isRevoked,
        getToken: function fromHeaderOrQuerystring (req) {
            console.log(req.headers);
            if (String(req.headers.cookie).split(';')[0].split('=')[1]) {
                return String(req.headers.cookie).split(';')[0].split('=')[1];
            }
            return null;
        }, 
        credentialsRequired: false
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

async function isRevoked(req, payload, done) {
    const user = await userService.getById(payload.sub);

    // revoke token if user no longer exists
    if (!user) {
        return done(null, true);
    }

    done();
};
