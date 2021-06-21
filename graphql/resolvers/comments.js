const {UserInputError} = require('apollo-server');
const {AuthenticationError} = require('apollo-server');
const Post = require('../../models/Post');
const checkAuth = require('../../util/checkAuth');

module.exports = {
    Mutation: {
        createComment: async (parent, {postId, body} , {req, connection}) => {
            const user = checkAuth(req);
            if (body.trim() === "") {
                throw new UserInputError("Empty comment", {
                    errors: {
                        body: "Comment body must not be empty"
                    }
                });
            }
            const post = await Post.findById(postId);
            if (post) {
                post.comments.unshift({
                    body,
                    username: user.username,
                    createdAt: new Date().toISOString()
                });
                await post.save();
                return post;
            } else {
                throw new UserInputError("Post does not exist");
            }
        },
        async deleteComment(parent, {postId, commentId}, {req, connection}) {
            const {username} = checkAuth(req);
            const post = await Post.findById(postId);
            if (post) {
                const commentIndex = post.comments.findIndex(c => c.id  === commentId);
                if (post.comments[commentIndex].username === username) {
                    post.comments.splice(commentIndex, 1);
                    await post.save();
                    return post;
                } else {
                    throw new AuthenticationError("Action not allowed");
                }
            } else {
                throw new UserInputError("Post not found");
            }
        }
    }
}