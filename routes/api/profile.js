const router = require('express').Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const config = require('config');
const request = require('request');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

/**
 *  @route  GET api/profile/me
 *  @desc   Get loggedin user
 *  @access private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile) {
      return res.status(401).json({ msg: 'No profile found for this user' });
    }

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server error');
  }
});

/**
 *  @route  POST api/profile/
 *  @desc   Create/update user profile
 *  @access private
 */

router.post(
  '/',
  [
    auth,
    [
      check('skills', 'Skills is required')
        .not()
        .isEmpty(),
      check('status', 'Status is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      user,
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    //Update if user exists

    //console.log(profileFields.status);
    try {
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );

      return res.json(profile);

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

/**
 *  @route  GET api/profile/
 *  @desc   Get all profiles
 *  @access public
 */

router.get('/', async (req, res) => {
  try {
    let profiles = await Profile.find().populate('user', ['name', 'avatar']);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 *  @route  GET api/profile/:user_id
 *  @desc   Get profile by id
 *  @access public
 */

router.get('/:user_id', async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.params.user_id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile) {
      return res.status(404).send('Profile not found');
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);

    if (err.kind == 'ObjectId') {
      return res.status(404).send('Profile not found');
    }
    res.status(500).send('Server error');
  }
});

/**
 *  @route  DELETE api/profile/
 *  @desc   Delete profile, user & posts
 *  @access Private
 */

router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove user posts

    //Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 *  @route  PUT api/profile/experience
 *  @desc   Add experience
 *  @access Private
 */

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExperience);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 *  @route  DELETE api/profile/experience/:exp_id
 *  @desc   Delete an experience
 *  @access Private
 */

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { experience: { _id: req.params.exp_id } } },
      { new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 *  @route  PUT api/profile/education
 *  @desc   Add education
 *  @access Private
 */

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEducation);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 *  @route  DELETE api/profile/experience/:exp_id
 *  @desc   Delete an experience
 *  @access Private
 */

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { education: { _id: req.params.edu_id } } },
      { new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

/**
 *  @route  GET api/profile/github/:username
 *  @desc   Get github repos
 *  @access Public
 */

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      method: 'GET',
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientID'
      )}&client_secret=${config.get('githubSecret')}`,
      headers: { 'user-agent': 'node.js' }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        //console.log(body);
        return res.status(404).json({ msg: 'Profile not found' });
      }

      return res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
