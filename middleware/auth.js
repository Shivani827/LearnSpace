const jwt = require('jsonwebtoken');
const User = require('../db/register').User;

const auth = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.jwt;

        if (!token) {
            console.log('⚠️ No token found in cookies');
            // Check if it's an AJAX/API request or a direct page visit
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).send('Unauthorized: No token provided');
            }
            return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
        }

        // Verify token
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);

        // Find user
        const user = await User.findOne({
            _id: verifyUser._id,
            'tokens.token': token
        });

        if (!user) {
            console.log('⚠️ User not found or token invalid');
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).send('Unauthorized: Invalid token');
            }
            return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
        }

        // Attach user to request
        req.token = token;
        req.user = user;

        console.log('✅ Auth successful for:', user.name);
        next();

    } catch (error) {
        console.error('❌ Auth error:', error.message);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).send('Unauthorized: ' + error.message);
        }
        return res.redirect(`/login?returnTo=${encodeURIComponent(req.originalUrl)}`);
    }
};

module.exports = auth;
