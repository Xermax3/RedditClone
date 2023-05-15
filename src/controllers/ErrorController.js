const HttpStatusCode = require('../helpers/HttpStatusCode');
const Controller = require('./Controller');

class ErrorController extends Controller {
	constructor(request, response, session) {
		super(request, response, session);
		this.setAction(this.error);
	}

	async error() {
		return this.response.setResponse({
			isAuthenticated: this.session.exists('user_id'),
			sessionUserId: this.session.get('user_id'),
			template: 'ErrorView',
			title: 'Error',
			statusCode: HttpStatusCode.NOT_FOUND,
			message: 'Invalid request path!',
		});
	}
}

module.exports = ErrorController;
