const logger = require('./logger');

const requestLogger = (request, response, next) => {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Method:', request.method);
        console.log('Path:  ', request.path);
        if (request.method === 'POST' && request.body.imageText) {
            const modifiedBody = {...request.body};
            delete modifiedBody.imageText;
            console.log('Body (w/o) imageText: ', modifiedBody);
        } else {
            console.log('Body:  ', request.body);
        }
        console.log('---');
    }
    
    next();
};

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (error, request, response, next) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error(error.message);
    }

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' });
    } if (error.name === 'ValidationError') {
        return response.status(400).send({ error: error.message });
    } if (error.name === 'JsonWebTokenError') {
        return response.status(401).json({ error: 'invalid token' });
    }

    next(error);
};

module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler
};