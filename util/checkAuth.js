const jwt = require('jsonwebtoken');
require('dotenv').config();
const {AuthenticationError} = require('apollo-server');

module.exports = (context) => {
    //process.env.SECRET_KEY;
    const authHeader = context.headers.authorization;
    console.log(authHeader);
    if (authHeader) {
        const token = authHeader.split('Bearer ')[1]
        if (token) {
            try {
                const user = jwt.verify(token, process.env.SECRET_KEY);
                return user;
            } catch (err) {
                throw new AuthenticationError("Invalid/Expired token");
            }
        } else {
            throw new Error("Auth token was must be Bearer [token]");
        }
    } else {
        throw new Error("Auth header must be provided");
    }
}