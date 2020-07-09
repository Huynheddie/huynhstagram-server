const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const Post = require('../models/post');
const User = require('../models/user');
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
            date: new Date(),
            content: 'Test Content!'
        };

        const newUser = {
            username: 'huynheddie',
            name: 'Eddie Huynh',
            password: 'spagheddie'
          };
      
        await api.post('/users').send(newUser);

        const loginResponse = await api
            .post('/login')
            .send({ username: newUser.username, password: newUser.password });
    
        await api
            .post('/posts')
            .send(newPost)
            .set('Authorization', `bearer ${loginResponse.body.token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/);
    
        const postsAtEnd = await helper.postsInDb();
        expect(postsAtEnd).toHaveLength(helper.initialPosts.length + 1);
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
        
        expect(resultNote.body.id).toEqual(postToView.id);
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

describe('when there is initially one user in db', () => {
    beforeEach(async () => {
      await User.deleteMany({});
  
      const passwordHash = await bcrypt.hash('secret', 10);
      const user = new User({ username: 'root', passwordHash });
  
      await user.save();
    });
  
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb();
  
      const newUser = {
        username: 'huynheddie',
        name: 'Eddie Huynh',
        password: 'spagheddie'
      };
  
      await api
        .post('/users')
        .send(newUser)
        .expect(200)
        .expect('Content-Type', /application\/json/);
  
      const usersAtEnd = await helper.usersInDb();
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
  
      const usernames = usersAtEnd.map(u => u.username);
      expect(usernames).toContain(newUser.username);
    });

    test('creation fails with proper status code and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb();

        const newUser = {
            username: 'root',
            name: 'superuser',
            password: 'test'
        };

        const result = await api
            .post('/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/);
        
        expect(result.body.error).toContain('`username` to be unique');

        const usersAtEnd = await helper.usersInDb();
        expect(usersAtEnd).toHaveLength(usersAtStart.length);
    });
  });


afterAll(() => {
    mongoose.connection.close();
});