const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res, next) => {
    const { email, password, name } = req.body;
    try {
        if (!email || !password) {
            res.status(400);
            throw new Error('Please add all fields');
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            passwordHash: password,
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+passwordHash');

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const userResponse = user.toObject();
            delete userResponse.passwordHash;

            res.json({
                user: userResponse,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        // req.user is populated by the 'protect' middleware
        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        
        res.status(200).json({ user });

    } catch(error) {
        next(error);
    }
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
}; 