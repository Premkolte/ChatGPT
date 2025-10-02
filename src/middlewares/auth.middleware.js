const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");


async function authUser(req, res, next) {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(verified.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(403).json({ message: 'Invalid token.' });
    }
}

module.exports = {authUser}
