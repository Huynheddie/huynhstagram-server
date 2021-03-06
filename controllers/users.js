const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const path = require('path');
const Fuse = require('fuse.js');
const User = require('../models/user');
const Post = require('../models/post');
const config = require('../utils/config');
const { cloudinary } = require('../utils/cloudinary');

usersRouter.get('/', async (request, response) => {
  const users = await User.find({})
  .populate('posts', { content: 1, date: 1 })
  .populate('followers')
  .populate('following')
  .populate({
    path: 'followers',
    populate: [{
      path: 'followers'
    }, {
      path: 'following'
    }
  ] 
  })
  .populate({
    path: 'following',
    populate: [{
      path: 'following'
    }, {
      path: 'followers'
    }] 
  });
  response.json(users);
});

usersRouter.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id)
  .populate('posts', { content: 1, date: 1 })
  .populate('followers')
  .populate('following')
  .populate({
    path: 'followers',
    populate: [{
      path: 'followers'
    }, {
      path: 'following'
    }
  ] 
  })
  .populate({
    path: 'following',
    populate: [{
      path: 'following'
    }, {
      path: 'followers'
    }] 
  });
  if (user) {
    response.json(user);
  } else {
    response.status(404).end();
  }
});

usersRouter.get('/search/:username', async (request, response) => {
  // const users = await User.find({ username: { $regex : new RegExp(`(.*)${request.params.username.toLowerCase()}(.*)`, "i")} });
  // response.json(users);
  const users = await User.find({});

  const fuse = new Fuse(users, {
    keys: ['username'],
    includeScore: true,
    threshold: .4
  });

  const searchResult = fuse.search(request.params.username);
  response.json(searchResult.map(result => result.item));
});

// Registration
usersRouter.post('/', async (request, response) => {

  const body = request.body;
  const existingUser = await User.findOne({ username: body.username });

  if (existingUser) {
    response.status(500).json({ error: 'registering user unsuccessful' });
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  try {
    let profileImage = '';

    const picPath = path.join(__dirname, '..', 'images', 'default-user.jpg');
    const uploadResponse = await cloudinary.uploader.upload(picPath, {
      upload_preset: config.CLOUDINARY_PRESET_USERS,
      context: 'name=default-user-picture'
    });
    
    profileImage = uploadResponse.public_id;
    const user = new User({
      username: body.username,
      name: body.name,
      profileImage,
      passwordHash,
      biography: '',
    });

    const savedUser = await user.save();
    response.json(savedUser);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'registering user unsuccessful' });
  }
  
});

// Update user profile image
usersRouter.patch('/profileimage/:id', async (request, response) => {
  const body = request.body;
  try {
    const fileStr = body.profileImage;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: config.CLOUDINARY_PRESET_USERS
    });
    const publicImageId = uploadResponse.public_id;
    const newProfileImage= {
      profileImage: publicImageId
    };

    const oldUser = await User.findById(request.params.id);
    cloudinary.api.delete_resources([oldUser.profileImage]);

    const updatedUser = await (await User.findByIdAndUpdate(request.params.id, newProfileImage, { new: true})).populated('posts', { content: 1, date: 1 });
    response.json(updatedUser);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'update user profile image unsuccessful' });
  }
});

usersRouter.patch('/followUser', async (request, response) => {
  const { currentUserId, targetUserId } = request.body;

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  // Unfollow user
  if (currentUser.following.includes(targetUserId)) {
    currentUser.following = currentUser.following.filter(user => !user.equals(targetUserId));
    await currentUser.save();

    targetUser.followers = targetUser.followers.filter(user => !user.equals(currentUserId));
    await targetUser.save();
  } else {
    currentUser.following.push(targetUserId);
    await currentUser.save();
  
    targetUser.followers.push(currentUserId);
    await targetUser.save();
  }

  const users = await User.find({})
  .populate('posts', { content: 1, date: 1 })
  .populate('followers')
  .populate('following')
  .populate({
    path: 'followers',
    populate: [{
      path: 'followers'
    }, {
      path: 'following'
    }
  ] 
  })
  .populate({
    path: 'following',
    populate: [{
      path: 'following'
    }, {
      path: 'followers'
    }] 
  });
  response.json(users);
});

usersRouter.patch('/biography/:id', async (request, response) => {
  const user = await User.findById(request.params.id);
  const body = request.body;

  user.biography = body.newBio;
  await user.save();
  const updatedUser = await User.findById(request.params.id)
  .populate('posts', { content: 1, date: 1 })
  .populate('followers')
  .populate('following')
  .populate({
    path: 'followers',
    populate: [{
      path: 'followers'
    }, {
      path: 'following'
    }
  ] 
  })
  .populate({
    path: 'following',
    populate: [{
      path: 'following'
    }, {
      path: 'followers'
    }] 
  });
  response.json(updatedUser);
});

usersRouter.delete('/:id', async (request, response) => {
  const postsCommented = await Post.find({ 'comments.user': request.params.id });

  for (let index = 0; index < postsCommented.length; index++) {
    postsCommented[index].comments = postsCommented[index].comments.filter(comment => comment.user.toString() !== request.params.id);
    await postsCommented[index].save();
  }

  const posts = await Post.find({user:`${request.params.id}`});
  const imageIds = posts.map(post => post.imageId);
  cloudinary.api.delete_resources(imageIds);

  await Post.deleteMany({ user: `${request.params.id}` });
  const user = await User.findById(request.params.id);
  cloudinary.api.delete_resources([user.profileImage]);
  const deleteResponse = await User.findByIdAndDelete(request.params.id);
  response.json(deleteResponse);
});

module.exports = usersRouter;