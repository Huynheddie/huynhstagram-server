const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const path = require('path');
const User = require('../models/user');
const { cloudinary } = require('../utils/cloudinary');

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('posts', { content: 1, date: 1 });
  response.json(users);
});

usersRouter.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id).populate('posts', { content: 1, date: 1 });
  if (user) {
    response.json(user);
  } else {
    response.status(404).end();
  }
});

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

usersRouter.patch('/:id', async (request, response) => {
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
    console.log(oldUser);
    console.log(oldUser.profileImage);
    cloudinary.api.delete_resources([oldUser.profileImage]);

    const updatedUser = await (await User.findByIdAndUpdate(request.params.id, newProfileImage, { new: true})).populated('posts', { content: 1, date: 1 });
    response.json(updatedUser);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'update user profile image unsuccessful' });
  }
});

module.exports = usersRouter;