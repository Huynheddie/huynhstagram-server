const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    name: String
})

module.exports = postSchema;