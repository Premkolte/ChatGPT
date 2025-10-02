const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  try {
    const { email, fullName: { firstName, lastName }, password } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      email,
      fullName: { firstName, lastName },
      password: hashedPassword,
    });

    console.log('New user created:', newUser);

    //token generation can be added here
    const token = jwt.sign({ userId: newUser._id },process.env.JWT_SECRET,{ expiresIn: '1h' });

    res.cookie("token", token);

    res.status(201).json({ 
        message: 'User registered successfully',
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName
    }); 
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ 
        message: 'Server error'
    });
  }
};




//login
async function login (req, res){
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

        // Set token in HTTP-only cookie
        res.cookie('token', token);

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { register, login };