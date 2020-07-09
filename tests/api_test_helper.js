const Post = require('../models/post');
const User = require('../models/user');

const initialPosts = [
    {
        date: new Date(),
        content: 'Hello World - Eddie Huynh'
    },
    {
        date: new Date(),
        content: 'Draven OP'
    },
    {
        date: new Date(),
        content:'Plus Ultra'
    }
];

const nonExistingId = async () => {
    const post = new Post(
    {
        date: new Date(),
        content: 'willremovethissoon'
    });
    await post.save();
    await post.remove();
  
    return post._id.toString();
  };

const postsInDb = async () => {
    const posts = await Post.find({});
    return posts.map(post => post.toJSON());
};

const usersInDb = async () => {
    const users = await User.find({});
    return users.map(user => user.toJSON());
};

module.exports = {
    initialPosts, nonExistingId, postsInDb, usersInDb
};