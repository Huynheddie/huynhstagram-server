const express = require('express');
const app = express();
const port = process.env.PORT || 4001;
const postsRouter = require('./routes/posts')

app.use('/accounts', postsRouter);
app.get('/', (req, res) => res.send('Hello world!'));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})