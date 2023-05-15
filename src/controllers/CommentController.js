const CommentException = require('../exceptions/CommentException');
const Controller = require('./Controller');
const Comment = require('../models/Comment');
const HttpStatusCode = require('../helpers/HttpStatusCode');

class CommentController extends Controller {
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
			throw new CommentException('Cannot create Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const { postId, content, replyId } = this.request.getParameters().body;
        let comment = await Comment.create(this.session.get('user_id'), postId, content, replyId);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `post/${postId}`,
            message: 'Comment created successfully!', 
            payload: comment
        });
    }

    async show() {
        const id = this.request.getParameters().header[0];
        let comment = await Comment.findById(id);

        if (!comment)
            throw new CommentException(`Cannot retrieve Comment: Comment does not exist with ID ${id}.`);

        comment.createdAtText = comment.getCreatedAt().toString();
        const replies = await Comment.findByParent(comment.getId());
        replies.forEach(async reply => {
            reply.createdAtText = reply.getCreatedAt().toString();
            if (this.session.exists('user_id')) {
                reply.isBookmarkedByUser = await reply.checkIfBookmarkedByUser(this.session.get('user_id'));
                const vote = await reply.checkVoteForUser(this.session.get('user_id'));
                reply.isUpvotedByUser = vote == "upvote";
                reply.isDownvotedByUser = vote == "downvote";
            } else {
                reply.isBookmarkedByUser = false;
                reply.isUpvotedByUser = false;
                reply.isDownvotedByUser = false;
            }
        });
        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "Comment/ShowView",
            title: "Comment Thread", // id?
            payload: comment,
            message: 'Comment retrieved successfully!',
            replies: replies,
        });
    }

    async list() {
        let comments = await Comment.findAll();
        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            payload: comments,
            message: 'Comments retrieved successfully!',
        });
    }

    async edit() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot update Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        let comment = await Comment.findById(id);

        if (!comment)
            throw new CommentException(`Cannot update Comment: Comment does not exist with ID ${id}.`);

        if (comment.getUser().getId() != this.session.get('user_id'))
            throw new CommentException('Cannot update Comment: You cannot update a comment created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        const { content } = this.request.getParameters().body;
        if (!content)
            throw new CommentException('Cannot update Comment: No update parameters were provided.');
        comment.setContent(content);
        await comment.save();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `post/${comment.getPost().getId()}`,
            message: 'Comment updated successfully!', 
            payload: comment,
        });
    }

    async destroy() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot delete Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        let comment = await Comment.findById(id);

        if (!comment)
            throw new CommentException(`Cannot delete Comment: Comment does not exist with ID ${id}.`);

        if (comment.getUser().getId() != this.session.get('user_id'))
            throw new CommentException('Cannot delete Comment: You cannot delete a comment created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        await comment.remove();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `post/${comment.getPost().getId()}`,
            message: 'Comment deleted successfully!', 
            payload: comment,
        });
    }

    async getEditForm() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot update Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = parseInt(this.request.getParameters().header[0]);
        let comment = await Comment.findById(id);

        if (!comment)
            throw new CommentException(`Cannot update Comment: Comment does not exist with ID ${id}.`);

        if (comment.getUser().getId() != this.session.get('user_id'))
            throw new CommentException('Cannot update Comment: You cannot update a comment created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "Comment/EditView",
            title: "Edit Comment",
            payload: {id},
            content: await (await Comment.findById(id)).getContent()
        });
    }

    async upVote() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot up vote Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        const comment = await Comment.findById(id);
        const response = await comment.upVote(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Comment was up voted successfully!', 
            payload: response,
        });
    }

    async downVote() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot down vote Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        const comment = await Comment.findById(id);
        const response = await comment.downVote(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Comment was down voted successfully!', 
            payload: response,
        });
    }

    async unvote() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot unvote Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        const comment = await Comment.findById(id);
        const response = await comment.unvote(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Comment was unvoted successfully!', 
            payload: response,
        });
    }

    async bookmark() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot bookmark Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = this.request.getParameters().header[0];
        const comment = await Comment.findById(id);
        const response = await comment.bookmark(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Comment was bookmarked successfully!', 
            payload: response,
        });
    }

    async unbookmark() {
        if (!this.session.exists('user_id'))
			throw new CommentException('Cannot unbookmark Comment: You must be logged in.', HttpStatusCode.UNAUTHORIZED);
        
        const id = this.request.getParameters().header[0];
        const comment = await Comment.findById(id);
        const response = await comment.unbookmark(this.session.get('user_id'));

        return this.response.setResponse({
            message: 'Comment was unbookmarked successfully!', 
            payload: response,
        });
    }
}

module.exports = CommentController;
