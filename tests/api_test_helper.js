const Post = require('../models/post');

const initialPosts = [
    {
        userName: 'Eddie',
        date: new Date(),
        content: 'Hello World - Eddie Huynh'
    },
    {
        userName: 'Tyler1',
        date: new Date(),
        content: 'Draven OP'
    },
    {
        userName: 'Midoriya',
        date: new Date(),
        content:'Plus Ultra'
    }
];

const nonExistingId = async () => {
    const post = new Post(
    {
        userName: 'toberemoved',
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

module.exports = {
    initialPosts, nonExistingId, postsInDb
};