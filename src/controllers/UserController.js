const UserException = require('../exceptions/UserException');
const Controller = require('./Controller');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const HttpStatusCode = require('../helpers/HttpStatusCode');

class UserController extends Controller {
    constructor(request, response, session) {
        super(request, response, session);

        const headerParameters = this.request.getParameters().header;

        switch (request.getRequestMethod()) {
            case 'GET':
                if (headerParameters.length === 0) {
                    this.setAction(this.list);
                } else {
                    switch (headerParameters[1]) {
                        case "posts":
                            this.setAction(this.getPosts);
                            break;
                        case "comments":
                            this.setAction(this.getComments);
                            break;
                        case "postvotes":
                            this.setAction(this.getPostVotes);
                            break;
                        case "commentvotes":
                            this.setAction(this.getCommentVotes);
                            break;
                        case "postbookmarks":
                            this.setAction(this.getPostBookmarks);
                            break;
                        case "commentbookmarks":
                            this.setAction(this.getCommentBookmarks);
                            break;
                        default:
                            this.setAction(this.show);
                            break;
                    }
                }
                break;
            case 'POST':
                this.setAction(this.new);
                break;
            case 'PUT':
                this.setAction(this.edit);
                break;
            case 'DELETE':
                this.setAction(this.destroy);
                break;
            default:
                this.setAction(this.error);
                this.response.setResponse({
                    isAuthenticated: this.session.exists('user_id'),
                    sessionUserId: this.session.get('user_id'),
                    statusCode: HttpStatusCode.METHOD_NOT_ALLOWED, 
                    template: "ErrorView",
                    title: "Error",
                    message: 'Invalid request method!',
                });
        }
    }

    async new() {
        const { username, email, password } = this.request.getParameters().body;
        let user = await User.create(username, email, password);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: 'auth/login',
            message: 'User created successfully!', 
            payload: user
        });
    }

    async show() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);

        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "User/ShowView",
            title: user.getUsername(),
            payload: user,
            message: 'User retrieved successfully!',
        });
    }

    async list() {
        let users = await User.findAll();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            payload: users,
            message: 'Users retrieved successfully!',
        });
    }

    async edit() {
        if (!this.session.exists('user_id'))
			throw new UserException('Cannot update User: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const { username, email } = this.request.getParameters().body;
        if (!username && !email)
            throw new UserException('Cannot update User: No update parameters were provided.');

        const id = this.request.getParameters().header[0];
        if (id != this.session.get('user_id'))
            throw new UserException('Cannot update User: You cannot update a user other than yourself.', HttpStatusCode.FORBIDDEN);

        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot update User: User does not exist with ID ${id}.`);
            
        if (username)
            user.setUsername(username);
        if (email)
            user.setEmail(email);
        await user.save();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `user/${user.getId()}`,
            message: 'User updated successfully!', 
            payload: user,
        });
    }

    async destroy() {
        if (!this.session.exists('user_id'))
			throw new UserException('Cannot delete User: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        if (id != this.session.get('user_id'))
            throw new UserException('Cannot delete User: You cannot delete a user other than yourself.', HttpStatusCode.FORBIDDEN);

        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot delete User: User does not exist with ID ${id}.`);

        await user.remove();
        this.session.destroy();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `user/${user.getId()}`,
            message: 'User deleted successfully!', 
            payload: user,
        });
    }

    async getPosts() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        let posts = await Post.findByUser(id);
        return this.response.setResponse({
            message: "User's posts were retrieved successfully!", 
            payload: posts,
        });
    }

    async getComments() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        let posts = await Comment.findByUser(id);
        return this.response.setResponse({
            message: "User's comments were retrieved successfully!", 
            payload: posts,
        });
    }

    async getPostVotes() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        let posts = await Post.getUserVoted(id);
        return this.response.setResponse({
            message: "User's post votes were retrieved successfully!", 
            payload: posts,
        });
    }

    async getCommentVotes() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        let comments = await Comment.getUserVoted(id);
        return this.response.setResponse({
            message: "User's comment votes were retrieved successfully!",
            payload: comments,
        });
    }

    async getPostBookmarks() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        let posts = await Post.getBookmarkedPosts(id);
        return this.response.setResponse({
            message: "User's post bookmarks were retrieved successfully!", 
            payload: posts,
        });
    }

    async getCommentBookmarks() {
        const id = this.request.getParameters().header[0];
        let user = await User.findById(id);
        if (!user)
            throw new UserException(`Cannot retrieve User: User does not exist with ID ${id}.`);

        let comments = await Comment.getBookmarkedComments(id);
        return this.response.setResponse({
            message: "User's comment bookmarks were retrieved successfully!", 
            payload: comments,
        });
    }
}

module.exports = UserController;
