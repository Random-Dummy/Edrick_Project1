const express = require('express');
const router = express.Router();
const db = require('./service/dbservice.js');
const user = require('./service/userService.js');

db.connect().then(function (response) {
  console.log(response);
}).catch(function (error) {
  console.log(error.message);
})
router.use(express.urlencoded({
  extended: true
}));
router.use(express.json());

router.use('/api', authenticate);

async function authenticate(req, res, next) {
  let token = req.query.token || req.body.token || req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ "message": "Authentication failed: Token not provided" });
  }

  try {
    const foundUser = await user.checkToken(token);
    if (foundUser) {
      res.locals.userId = foundUser._id; // Store user ID for subsequent handlers
      next();
    } else {
      res.status(401).json({ "message": "Authentication failed: Invalid token" });
    }
  } catch (error) {
    console.error('Error in authenticate middleware:', error.message);
    res.status(500).json({ "message": "Authentication error: " + error.message });
  }
};

router.post('/users/login', async function (req, res) {
  let { email, password } = req.body;

  try {
    const foundUser = await user.userlogin(email, password);

    if (!foundUser) {
      return res.status(401).json({ "message": "Invalid email or password" });
    }

    // Generate a new token
    let strToHash = foundUser.email + Date.now();
    let token = crypto.createHash('sha512').update(strToHash).digest('hex');

    await user.updateToken(foundUser._id, token);

    res.status(200).json({
      message: 'Login Successful',
      token: token,

    });

  } catch (error) {
    console.error('Error in user login route:', error.message);
    res.status(500).json({ "message": "Login failed: " + error.message });
  }
});

// Logout
router.get('/users/logout', authenticate, async function (req, res) {
  let userId = res.locals.userId;

  try {
    await user.removeToken(userId);
    res.status(200).json({ "message": 'Logout Successful' });
  } catch (error) {
    console.error('Error in user logout route:', error.message);
    res.status(500).json({ "message": "Logout failed: " + error.message });
  }
});

// Create User
router.post('/users/register', function (req, res) {
  let { email, password, username } = req.body;

  user.createUser(email, password, username).then(function (result) {
    res.status(200).json({ "message": "User created successfully" });
  }).catch(function (error) {
    console.error('Error in user creation route:', error.message);
    res.status(500).json({ "message": "User creation failed: " + error.message });
  });
});