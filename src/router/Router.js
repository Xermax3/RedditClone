const UserController = require('../controllers/UserController');
const CategoryController = require('../controllers/CategoryController');
const PostController = require('../controllers/PostController');
const CommentController = require('../controllers/CommentController');
const HomeController = require('../controllers/HomeController');
const ErrorController = require('../controllers/ErrorController');
const AuthController = require('../controllers/AuthController');
const logger = require('../helpers/Logger');

/**
 * This class is responsible for invoking the appropriate method
 * on the appropriate model based on the results of the parsed `Request`.
 * Once the `message` and `payload` have been determined, it will return
 * a `Response` object to be sent back to the client as an HTTP response.
 */
class Router {
    constructor(request, response, session) {
		this.request = request;
		this.response = response;
		this.session = session;
		this.setController(this.request.getControllerName());
	}

    getController() {
        return this.controller;
    }

    setController(controllerName) {
        switch (controllerName) {
            case '':
                this.controller = new HomeController(this.request, this.response, this.session);
                break;
            case 'user':
                this.controller = new UserController(this.request, this.response, this.session);
                break;
            case 'category':
                this.controller = new CategoryController(this.request, this.response, this.session);
                break;
            case 'post':
                this.controller = new PostController(this.request, this.response, this.session);
                break;
            case 'comment':
                this.controller = new CommentController(this.request, this.response, this.session);
                break;
            case 'auth':
                this.controller = new AuthController(this.request, this.response, this.session);
                break;
            default:
                this.controller = new ErrorController(this.request, this.response, this.session);
                break;
        }
    }

    async dispatch() {
        try {
			this.response = await this.controller.doAction();
		}
		catch (error) {
			logger.error(error);

			this.response = await this.response.setResponse({
				template: 'ErrorView',
				title: 'Error',
				statusCode: error.statusCode,
				message: error.message,
			});
		}

		return this.response;
    }
}

module.exports = Router;
