const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const path = require('path');
const User = require('../models/user');
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

// Registration
usersRouter.post('/', async (request, response) => {

  const body = request.body;

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  try {
    let profileImage = '';
    const defaultPicture = await cloudinary.search
    .expression('context.name=default-user-picture')
    .execute();

    if (defaultPicture.total_count === 0) {
      // console.log('Need to upload default pic');
      const picPath = path.join(__dirname, '..', 'images', 'default-user.jpg');
      const uploadResponse = await cloudinary.uploader.upload(picPath, {
        upload_preset: 'user-testing',
        context: 'name=default-user-picture'
      });
      profileImage = uploadResponse.public_id;

    } else {
      // console.log('Already uploaded');
      profileImage = defaultPicture.resources[0].public_id;
    }

    const user = new User({
      username: body.username,
      name: body.name,
      profileImage,
      passwordHash
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
      upload_preset: 'user-testing'
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

  // console.log('Current user updated following list: ', currentUser.following);
  // console.log('Target user updated followers: ', targetUser.followers);
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

usersRouter.delete('/:id', async (request, response) => {
  const deleteResponse = await User.findByIdAndDelete(request.params.id);
  response.json(deleteResponse);
});

module.exports = usersRouter;