require('dotenv').config();

const PORT = process.env.PORT || 3001;
let MONGODB_URI = process.env.MONGODB_URI;
let CLOUDINARY_PRESET_POSTS = null;
let CLOUDINARY_PRESET_USERS = null;

if (process.env.NODE_ENV === 'test') {
    MONGODB_URI = process.env.TEST_MONGODB_URI;
} else if (process.env.NODE_ENV === 'development') {
    MONGODB_URI = process.env.DEV_MONGODB_URI;
} else {
    MONGODB_URI = process.env.MONGODB_URI;
}

if (process.env.NODE_ENV === 'development') {
    CLOUDINARY_PRESET_POSTS = 'dev-testing';
    CLOUDINARY_PRESET_USERS ='user-testing';
} else {
    CLOUDINARY_PRESET_POSTS = 'posts-production';
    CLOUDINARY_PRESET_USERS = 'user-production';
}

module.exports = {
    PORT,
    MONGODB_URI,
    CLOUDINARY_PRESET_POSTS,
    CLOUDINARY_PRESET_USERS
};