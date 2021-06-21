const {AuthenticationError} = require('apollo-server');
const {UserInputError} = require('apollo-server');
const Post = require('../../models/Post');
const checkAuth = require('../../util/checkAuth');

module.exports = {
    Query: {
        async getPosts () {
            try {
                const posts = await Post.find();
                return posts;
            } catch (err) {
                throw new Error(err);
            }
        },
        async getPost(parent, {postId}) {
            try {
                const post = await Post.findById(postId);
                if (post) {
                    return post;
                } else {
                    throw new Error("Post not found");
                }
            } catch (err) {
                throw new Error(err);
            }
        }
    },
    Mutation: {
        async createPost(parent, {body}, {req, connection, pubsub}) {
            //console.log(req.headers);
           const user = checkAuth(req);
           if (body.trim() === '') {
               throw new Error("Empty posts not allowed");
           }
           //console.log(user);
           const newPost = new Post({
               body,
               user: user.id,
               username: user.username,
               createdAt: new Date().toISOString()
           });
           const post = await newPost.save();
           pubsub.publish('NEW_POST', {
               newPost: post
           });
           console.log(post);
           return post;
        },
        async deletePost(parent, {postId}, {req, connection}) {
            const user = checkAuth(req);
            try {
                const post = await Post.findById(postId);
                if (user.username === post.username) {
                    await post.delete();
                    return "Post deleted";
                } else {
                    throw new AuthenticationError("Action not allowed");
                }
            } catch(err) {
                throw new Error(err);
            } 
        },
        async likePost(parent, {postId}, {req, connection}) {
            const {username} = checkAuth(req);
            const post = await Post.findById(postId);

            if (post) {
                if (post.likes.find(like=> like.username === username)) {
                  // post has been liked already 
                  post.likes = post.likes.filter(like => like.username !== username);
                } else {
                    // like empty
                    post.likes.push({
                        username,
                        createdAt: new Date().toISOString()
                    });
                }
                await post.save();
                return post;
            } else {
                throw new UserInputError("Post not found");
            }
        }
    },
    Subscription : {
        newPost: {
            subscribe: (parent, _, {pubsub}) => {
               return pubsub.asyncIterator("NEW_POST");
            }
        }
    }
}