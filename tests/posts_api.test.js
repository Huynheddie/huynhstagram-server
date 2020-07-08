const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const Post = require('../models/post');
const helper = require('./api_test_helper');

// If 'Jest did not exit one second after the test run has completed', check part4, 'testing the backend'
const api = supertest(app);

// Initialize database
beforeEach(async () => {
    await Post.deleteMany({});

    for (let index = 0; index < helper.initialPosts.length; index++) {
        const postObj = new Post(helper.initialPosts[index]);
        await postObj.save();
    }
});

describe('addition of a new post', () => {
    test('succeeds with valid data', async () => {
        const newPost = {
            userName: 'New Test User',
            date: new Date(),
            content: 'Test Content!'
        };
    
        await api
            .post('/posts')
            .send(newPost)
            .expect(200)
            .expect('Content-Type', /application\/json/);
    
        const postsAtEnd = await helper.postsInDb();
        expect(postsAtEnd).toHaveLength(helper.initialPosts.length + 1);
    
        const userNames = postsAtEnd.map(p => p.userName);    
        expect(userNames).toContain('New Test User');
    });
    
    test('fails with status code 400 if data invalid', async () => {
        const newPost = {
            userName: "Test User w/o Content",
            date: new Date()
        };
    
        await api
            .post('/posts')
            .send(newPost)
            .expect(400);
        
        const postsAtEnd = await helper.postsInDb();
        expect(postsAtEnd).toHaveLength(helper.initialPosts.length);
    });
});

describe('viewing a specific post', () => {
    test('succeeds with valid id', async () => {
        const postsAtStart = await helper.postsInDb();
        const postToView = postsAtStart[0];
    
        const resultNote = await api
            .get(`/posts/${postToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/);
        
        expect(resultNote.body.userName).toEqual(postToView.userName);
    });

    test('fails with status code 404 if post does not exist', async () => {
        const validNonExistingId = await helper.nonExistingId();

        await api
            .get(`/posts/${validNonExistingId}`)
            .expect(404);
    });

    test('fails with status code 400 if id is invalid', async () => {
        const invalidId = '1234567890';
        
        await api
            .get(`/posts/${invalidId}`)
            .expect(400);
    });
});

describe('deletion of a post', () => {
    test('a post can be deleted', async () => {
        const postsAtStart = await helper.postsInDb();
        const postToDelete = postsAtStart[0];
    
        await api  
            .delete(`/posts/${postToDelete.id}`)
            .expect(204);
        
        const postsAtEnd = await helper.postsInDb();
    
        expect(postsAtEnd).toHaveLength(helper.initialPosts.length - 1);
    });
});


afterAll(() => {
    mongoose.connection.close();
});