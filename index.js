const {ApolloServer, PubSub} = require('apollo-server');
const gql = require('graphql-tag');
const mongoose = require('mongoose');
require('dotenv').config();
const PORT = process.env.port || 5000;

const Post = require('./models/Post');
const User = require('./models/User');
const typeDefs = require('./graphql/typeDefs');

const resolvers = require('./graphql/resolvers');

const pubsub = new PubSub();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req, connection}) => {return {req, connection, pubsub}}
});


mongoose.connect(process.env.MONGODB).then((res) => {
    console.log("connected to mongodb");
    return server.listen({port: PORT});
}).then(res => {
    console.log("server running at " + res.url);
}).catch(err => {
    console.log(err);
});




