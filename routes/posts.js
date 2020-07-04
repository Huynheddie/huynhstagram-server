const express = require('express');
const router = express.Router()
const mongoose = require('mongoose');

const postSchema = require('../models/postSchema');
const Post = mongoose.model('post', postSchema, 'test');

mongoose.connect(`mongodb+srv://user:userpassword@cluster0.buo9z.mongodb.net/posts?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });

router.get('/', async (req, res) => {
    try {
        console.log('Posts');
        Post.find({}, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        });
    } catch (error) {
        console.log(error);
    }
})

module.exports = router;