const router = require('express').Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('config');

/**
 *  @route GET api/auth
 *  @desc Test route
 *  @access Public
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

/**
 *  @route  POST api/auth
 *  @desc   Authenticate user & get token
 *  @access Public
 */
router.post(
  '/',
  [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    //check if user already exists

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(401)
          .json({ errors: [{ msg: 'Invalid username/password' }] });
      }

      //If passwords match
      const isMatched = await bcrypt.compare(password, user.password);

      if (!isMatched) {
        return res
          .status(401)
          .json({ errors: [{ msg: 'Invalid username/password' }] });
      }

      const payLoad = {
        user: {
          id: user.id
        }
      };

      //Return jwt
      jwt.sign(
        payLoad,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
