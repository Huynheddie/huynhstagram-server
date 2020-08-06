const postsRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Post = require('../models/post');
const User = require('../models/user');
const config = require('../utils/config');
const { cloudinary } = require('../utils/cloudinary');

const getTokenFrom = request => {
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

postsRouter.get('/', async (request, response) => {
  const posts = await Post.find({})
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
    }]
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'followers',
      }]
    }]
  })
  .populate('likes')
  .populate({
    path: 'likes',
    populate: [{
      path: 'followers',
      model: 'User',
    }]
  });
  response.json(posts);
});

postsRouter.get('/:id', async (request, response) => {
  const post = await Post.findById(request.params.id)
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
    }]
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'followers',
      }]
    }]
  })
  .populate('likes')
  .populate({
    path: 'likes',
    populate: [{
      path: 'followers',
      model: 'User',
    }]
  });
  if (post) {
    response.json(post);
  } else {
    response.status(404).end();
  }
});

postsRouter.get('/byUser/:id', async (request, response) => {
  const userPosts = await Post.find({ user: request.params.id})
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
    }]
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'followers',
      }]
    }]
  })
  .populate('likes')
  .populate({
    path: 'likes',
    populate: [{
      path: 'followers',
      model: 'User',
    }]
  });
  response.json(JSON.stringify(userPosts));
});

postsRouter.post('/', async (request, response) => {
  const body = request.body;

  if (body.content === undefined) {
    return response.status(400).json({ error: 'Content missing' });
  }

  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  try {
    const fileStr = body.imageText;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: config.CLOUDINARY_PRESET_POSTS
    });
    const publicImageId = uploadResponse.public_id;

    const user = await User.findById(decodedToken.id);

    const post = new Post({
      date: new Date(),
      content: body.content,
      likes: [],
      comments: [],
      imageId: publicImageId,
      user: user._id
    });
    
    const savedPost = await post.save();
    user.posts = user.posts.concat(savedPost._id);
    await user.save();

    const returnPost = await Post.findById(savedPost._id)
    .populate({
      path: 'user', model: 'User', select: 'username name profileImage'
    })
    .populate({
      path: 'comments',
      populate: [{
        path: 'user',
        model: 'User',
      }]
    })
    .populate({
      path: 'comments',
      populate: [{
        path: 'likes',
        populate: [{
          path: 'followers',
        }]
      }]
    })
    .populate('likes')
    .populate({
      path: 'likes',
      populate: [{
        path: 'followers',
        model: 'User',
      }]
    });
    response.json(returnPost.toJSON());

  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'uploading file unsuccessful' });
  }
  
});

postsRouter.put('/:id', async (request, response) => {
  const body = request.body;

  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);

  const post = {
    Date: new Date(),
    content: body.content,
    user: user._id
  };

  const updatedPost = await Post.findByIdAndUpdate(request.params.id, post, { new: true })
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
    }]
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'followers',
      }]
    }]
  })
  .populate('likes')
  .populate({
    path: 'likes',
    populate: [{
      path: 'followers',
      model: 'User',
    }]
  });
  response.json(updatedPost.toJSON());
});

postsRouter.patch('/:id', async (request, response) => {
  const body = request.body;
  const updatedPost = await Post.findByIdAndUpdate(request.params.id, body, { new: true })
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
    }]
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'followers',
      }]
    }]
  })
  .populate('likes')
  .populate({
    path: 'likes',
    populate: [{
      path: 'followers',
      model: 'User',
    }]
  });
  response.json(updatedPost.toJSON());
});

// Add or remove like
postsRouter.patch('/like/:id', async (request, response) => {
  const body = request.body;
  const post = await Post.findById(request.params.id);
  if (post.likes.includes(body.userId)) {
    post.likes = post.likes.filter(x => x.toString() !== body.userId);
  } else {
    post.likes.push(body.userId);
  }
  await post.save();
  const updatedPost = await Post.findById(request.params.id)
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
    }]
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'followers',
      }]
    }]
  })
  .populate('likes')
  .populate({
    path: 'likes',
    populate: [{
      path: 'followers',
      model: 'User',
    }]
  });
  response.json(updatedPost);
});

postsRouter.delete('/:id', async (request, response) => {
  const post = await Post.findById(request.params.id);
  cloudinary.api.delete_resources([post.imageId]);
  await Post.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

module.exports = postsRouter;
