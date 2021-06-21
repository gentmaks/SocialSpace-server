const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError } = require('apollo-server-errors');
const validateRegisterInput = require('../../util/validators').validateRegisterInput;
const validateLoginInput = require('../../util/validators').validateLoginInput;
require('dotenv').config();

function generateToken (user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username
    }, process.env.SECRET_KEY, {expiresIn:'1h'});
}

module.exports = {
    Mutation : {
        async login (parent, {username, password}) {
            const {errors, valid} = validateLoginInput(username, password);

            if (!valid) {
                throw new UserInputError("Errors", {errors});
            }

            const user = await User.findOne({username});
            if (!user) {
                errors.general = 'User not found';
                throw new UserInputError('User not found', {errors});
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                errors.general = 'Wrong credentials';
                throw new UserInputError('Wrong credentials', {errors});
            }
            const token = generateToken(user);
            return {
                ...user._doc,
                id: user._id,
                token
            };
        },
        async register(parent, {registerInput : {username, email, password, confirmPassword}}, context, info) {
            // TODO validate user data
            // TODO make sure user doesn't already exist
            // TODO hash the password and create an auth token
            const {valid, errors} = validateRegisterInput(username, email, password, confirmPassword);
            if (!valid) {
                return new UserInputError("Errors", {errors});
            }
            const user = await User.findOne({username});
            if (user) {
                throw new UserInputError("Username is already taken", {
                    errors: {
                        username: "Username is already taken"
                    }
                });
            }


            password = await bcrypt.hash(password, 12);
            const newUser = new User({
                email,
                password,
                username,
                createdAt: new Date().toISOString()
            });

            const res = await newUser.save();
            const token = generateToken(res);
            return {
                ...res._doc,
                id: res._id,
                token
            };
        }
    }
}