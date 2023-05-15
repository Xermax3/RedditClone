const PostException = require('../exceptions/PostException');
const Controller = require('./Controller');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const HttpStatusCode = require('../helpers/HttpStatusCode');
const Url = require('../helpers/Url');

class PostController extends Controller {
    constructor(request, response, session) {
        super(request, response, session);

        const headerParameters = this.request.getParameters().header;

        switch (request.getRequestMethod()) {
            case 'POST':
                this.setAction(this.new);
                break;
            case 'GET':
                if (headerParameters.length == 0) {
                    this.setAction(this.list);
                } else {
                    switch (headerParameters[1]) {
                        case "edit":
                            this.setAction(this.getEditForm);
                            break;
                        case "upvote":
                            this.setAction(this.upVote);
                            break;
                        case "downvote":
                            this.setAction(this.downVote);
                            break;
                        case "unvote":
                            this.setAction(this.unvote);
                            break;
                        case "bookmark":
                            this.setAction(this.bookmark);
                            break;
                        case "unbookmark":
                            this.setAction(this.unbookmark);
                            break;
                        default:
                            this.setAction(this.show);
                            break;
                    }              
                }
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
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot create Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const { categoryId, title, type, content } = this.request.getParameters().body;
        let post = await Post.create(this.session.get('user_id'), categoryId, title, type, content);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `category/${categoryId}`,
            message: 'Post created successfully!', 
            payload: post
        });
    }

    async show() {
        const id = this.request.getParameters().header[0];
        let post = await Post.findById(id);

        if (!post)
            throw new PostException(`Cannot retrieve Post: Post does not exist with ID ${id}.`);

        const comments = await Comment.findByPost(id);
        comments.forEach(async comment => {
            comment.createdAtText = comment.getCreatedAt().toString();
            if (this.session.exists('user_id')) {
                comment.isBookmarkedByUser = await comment.checkIfBookmarkedByUser(this.session.get('user_id'));
                const vote = await comment.checkVoteForUser(this.session.get('user_id'));
                comment.isUpvotedByUser = vote == "upvote";
                comment.isDownvotedByUser = vote == "downvote";
            } else {
                comment.isBookmarkedByUser = false;
                comment.isUpvotedByUser = false;
                comment.isDownvotedByUser = false;
            }
        });
        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "Post/ShowView",
            title: post.getTitle(),
            payload: post,
            isBookmarkedByUser: this.session.exists('user_id') && await post.checkIfBookmarkedByUser(this.session.get('user_id')),
            message: 'Post retrieved successfully!',
            comments: comments,
        });
    }

    async list() {
        let posts = await Post.findAll();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            payload: posts,
            message: 'Posts retrieved successfully!',
        });
    }

    async edit() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot update Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        let post = await Post.findById(id);

        if (!post)
            throw new PostException(`Cannot update Post: Post does not exist with ID ${id}.`);

        if (post.getUser().getId() != this.session.get('user_id'))
            throw new PostException('Cannot update Post: You cannot update a post created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        const { content } = this.request.getParameters().body;
        if (!content)
            throw new PostException('Cannot update Post: No update parameters were provided.');
        post.setContent(content);
        await post.save();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `post/${post.getId()}`,
            message: 'Post updated successfully!', 
            payload: post,
        });
    }

    async destroy() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot delete Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        let post = await Post.findById(id);

        if (!post)
            throw new PostException(`Cannot delete Post: Post does not exist with ID ${id}.`);

        if (post.getUser().getId() != this.session.get('user_id'))
            throw new PostException('Cannot delete Post: You cannot delete a post created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        await post.remove();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `post/${post.getId()}`,
            message: 'Post deleted successfully!', 
            payload: post,
        });
    }

    async getEditForm() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot update Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = parseInt(this.request.getParameters().header[0]);
        let post = await Post.findById(id);

        if (!post)
            throw new PostException(`Cannot update Post: Post does not exist with ID ${id}.`);

        if (post.getUser().getId() != this.session.get('user_id'))
            throw new PostException('Cannot update Post: You cannot update a post created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "Post/EditView",
            title: "Edit Post",
            payload: {id},
            content: await (await Post.findById(id)).getContent()
        });
    }

    async upVote() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot up vote Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);
        
        const id = this.request.getParameters().header[0];
        const post = await Post.findById(id);
        const response = await post.upVote(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Post was up voted successfully!', 
            payload: response,
        });
    }

    async downVote() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot down vote Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);
        
        const id = this.request.getParameters().header[0];
        const post = await Post.findById(id);
        const response = await post.downVote(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Post was down voted successfully!', 
            payload: response,
        });
    }

    async unvote() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot unvote Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);
        
        const id = this.request.getParameters().header[0];
        const post = await Post.findById(id);
        const response = await post.unvote(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Post was unvoted successfully!', 
            payload: response,
        });
    }

    async bookmark() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot bookmark Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        const post = await Post.findById(id);
        const response = await post.bookmark(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Post was bookmarked successfully!', 
            payload: response,
        });
    }

    async unbookmark() {
        if (!this.session.exists('user_id'))
			throw new PostException('Cannot unbookmark Post: You must be logged in.', HttpStatusCode.UNAUTHORIZED);
        
        const id = this.request.getParameters().header[0];
        const post = await Post.findById(id);
        const response = await post.unbookmark(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Post was unbookmarked successfully!', 
            payload: response,
        });
    }
}

module.exports = PostController;
