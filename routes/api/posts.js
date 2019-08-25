const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

/**
 *  @route  POST api/posts
 *  @desc   New Post
 *  @access Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-passwrod');

      if (!user) {
        return res.status(401).json({ msg: 'Unauthroised user' });
      }
      const newPost = new Post({
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
        text: req.body.text
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.log(err.messgae);
      return res.status(500).send('Server Error');
    }
  }
);

/**
 *  @route  GET api/posts
 *  @desc   Get all posts
 *  @access Private
 */

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    if (!posts) {
      return res.status(404).json({ msg: 'No posts found' });
    }

    return res.json(posts);
  } catch (err) {
    console.error(err.messgae);
    return res.status(500).send('Server error');
  }
});

/**
 *  @route  GET api/posts/:id
 *  @desc   Get a post by ID
 *  @access Private
 */

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    return res.json(post);
  } catch (err) {
    console.error(err.messgae);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }

    return res.status(500).send('Server error');
  }
});

/**
 *  @route  DELETE api/posts/:id
 *  @desc   Delete a post
 *  @access Private
 */

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.id });

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Unauthorised user' });
    }

    await post.remove();

    return res.json({ msg: 'Post successfully deleted' });
  } catch (err) {
    console.error(err.messgae);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    return res.status(500).send('Server error');
  }
});

/**
 *  @route  PUT api/posts/like/:id
 *  @desc   Like a post
 *  @access Private
 */

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already been liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.messgae);
    return res.status(500).send('Server Error');
  }
});

/**
 *  @route  PUT api/posts/unlike/:id
 *  @desc   unLike a post
 *  @access Private
 */

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    //Get remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.messgae);
    return res.status(500).send('Server Error');
  }
});

/**
 *  @route  PUT api/posts/comments/:id
 *  @desc   Comment on a post
 *  @access Private
 */

router.post(
  '/comments/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const comment = {
        user: req.user.id,
        name: user.name,
        avatar: user.avatar,
        text: req.body.text
      };

      post.comments.unshift(comment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.messgae);
      return res.status(500).send('Server Error');
    }
  }
);

/**
 *  @route  DELETE api/posts/comments/:post_id/:id
 *  @desc   Delete a post
 *  @access Private
 */

router.delete('/comments/:post_id/:comment_id', auth, async (req, res) => {
  console.log(req.user.id);
  try {
    const post = await Post.findById(req.params.post_id);

    //pull a comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }

    //Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authroized' });
    }

    const removeIndex = post.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});
module.exports = router;
