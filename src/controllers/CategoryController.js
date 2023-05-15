const CategoryException = require('../exceptions/CategoryException');
const Controller = require('./Controller');
const Category = require('../models/Category');
const Post = require('../models/Post');
const HttpStatusCode = require('../helpers/HttpStatusCode');

class CategoryController extends Controller {
    constructor(request, response, session) {
        super(request, response, session);

        const headerParameters = this.request.getParameters().header;

        switch (request.getRequestMethod()) {
            case 'GET':
                if (headerParameters.length == 0) {
                    this.setAction(this.list);
                } else {
                    if (headerParameters[1]== "edit")
                        this.setAction(this.getEditForm);
                    else
                        this.setAction(this.show);
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
        if (!this.session.exists('user_id'))
			throw new CategoryException('Cannot create Category: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const { title, description } = this.request.getParameters().body;
        let category = await Category.create(this.session.get('user_id'), title, description);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: '/',
            message: 'Category created successfully!', 
            payload: category
        });
    }

    async show() {
        const id = this.request.getParameters().header[0];
        let category = await Category.findById(id);

        if (!category)
            throw new CategoryException(`Cannot retrieve Category: Category does not exist with ID ${id}.`);

        const posts = await Post.findAll();
        posts.forEach(async post => {
            post.createdAtText = post.getCreatedAt().toString();
            if (this.session.exists('user_id')) {
                const vote = await post.checkVoteForUser(this.session.get('user_id'));
                post.isUpvotedByUser = vote == "upvote";
                post.isDownvotedByUser = vote == "downvote";
            } else {
                post.isUpvotedByUser = false;
                post.isDownvotedByUser = false;
            }
        });
        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "Category/ShowView",
            title: category.getTitle(),
            payload: category,
            message: 'Category retrieved successfully!',
            posts: posts,
        });
    }

    async list() {
        let categories = await Category.findAll();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            payload: categories,
            message: 'Categories retrieved successfully!',
        });
    }

    async edit() {
        if (!this.session.exists('user_id'))
			throw new CategoryException('Cannot update Category: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const { title, description } = this.request.getParameters().body;
        if (!title && !description)
            throw new CategoryException('Cannot update Category: No update parameters were provided.');

        const id = this.request.getParameters().header[0];
        let category = await Category.findById(id);

        if (!category)
            throw new CategoryException(`Cannot update Category: Category does not exist with ID ${id}.`);
        
        if (category.getUser().getId() != this.session.get('user_id'))
            throw new CategoryException('Cannot update Category: You cannot update a category created by someone other than yourself.', HttpStatusCode.FORBIDDEN);
        
        if (title)
            category.setTitle(title);
        if (description)
            category.setDescription(description);
        await category.save();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: `category/${category.getId()}`,
            message: 'Category updated successfully!', 
            payload: category,
        });
    }

    async destroy() {
        if (!this.session.exists('user_id'))
			throw new CategoryException('Cannot delete Category: You must be logged in.', HttpStatusCode.UNAUTHORIZED);
        
        const id = this.request.getParameters().header[0]; 
        let category = await Category.findById(id);

        if (!category)
            throw new CategoryException(`Cannot delete Category: Category does not exist with ID ${id}.`);

        if (category.getUser().getId() != this.session.get('user_id'))
            throw new CategoryException('Cannot delete Category: You cannot delete a category created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        await category.remove();

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            redirect: '/',
            message: 'Category deleted successfully!', 
            payload: category,
        });
    }

    async getEditForm() {
        if (!this.session.exists('user_id'))
			throw new CategoryException('Cannot update Category: You must be logged in.', HttpStatusCode.UNAUTHORIZED);

        const id = parseInt(this.request.getParameters().header[0]);
        let category = await Category.findById(id);

        if (!category)
            throw new CategoryException(`Cannot update Category: Category does not exist with ID ${id}.`);

        if (category.getUser().getId() != this.session.get('user_id'))
            throw new CategoryException('Cannot update Category: You cannot update a category created by someone other than yourself.', HttpStatusCode.FORBIDDEN);

        return this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "Category/EditView",
            title: "Edit Category",
            payload: {id}
        });
    }
}

module.exports = CategoryController;
