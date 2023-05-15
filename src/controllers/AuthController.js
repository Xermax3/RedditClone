const Controller = require('./Controller');
const AuthException = require('../exceptions/AuthException');
const User = require('../models/User');
const Cookie = require('../auth/Cookie');
const SessionManager = require('../auth/SessionManager');
const HttpStatusCode = require('../helpers/HttpStatusCode');

class AuthController extends Controller {
	constructor(request, response, session) {
		super(request, response, session);

		const headerParameters = this.request.getParameters().header;

		switch (request.getRequestMethod()) {
			case 'GET':
				switch (headerParameters[0]) {
                    case 'register':
                        this.setAction(this.getRegisterForm);
                        break;
                    case 'login':
                        this.setAction(this.getLoginForm);
                        break;
                    case 'logout':
                        this.setAction(this.logOut);
                        break;
                    default:
                        this.setAction(this.error);
                        this.response.setResponse({
                            isAuthenticated: this.session.exists('user_id'),
                            sessionUserId: this.session.get('user_id'),
                            template: 'ErrorView',
                            statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
                            message: 'Invalid request method!',
                        });
                }
				break;
			case 'POST':
                if (headerParameters[0] == 'login') {
                    this.setAction(this.logIn);
                    break;
                } else {
                    this.setAction(this.error);
                    this.response.setResponse({
                        isAuthenticated: this.session.exists('user_id'),
                        sessionUserId: this.session.get('user_id'),
                        template: 'ErrorView',
                        statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
                        message: 'Invalid request method!',
                    });
                }
			default:
				this.setAction(this.error);
				this.response.setResponse({
                    isAuthenticated: this.session.exists('user_id'),
                    sessionUserId: this.session.get('user_id'),
					template: 'ErrorView',
					statusCode: HttpStatusCode.METHOD_NOT_ALLOWED,
					message: 'Invalid request method!',
				});
		}
	}

	async getRegisterForm() {
		return this.response.setResponse({
			template: 'User/NewFormView',
			title: 'Register',
		});
	}

    async getLoginForm() {
        let cookies = await this.request.getCookies();
		return this.response.setResponse({
            remember: cookies.rememberedEmail,
			template: 'LoginFormView',
			title: 'Login',
		});
	}

	async logIn() {
		const { email, password, remember } = this.request.getParameters().body;

        let user = await User.logIn(email, password);
        if (user == null) {
            throw new AuthException('Cannot log in: Invalid credentials.');
        }
        this.session.set('user_id', user.getId());

        if (remember === 'on')
            this.response.addCookie(new Cookie('rememberedEmail', user.getEmail()));

        return this.response.setResponse({
            redirect: `user/${user.getId()}`,
            message: 'Logged in successfully!',
            payload: user,
        });
	}

	async logOut() {
        this.session.destroy();

		return this.response.setResponse({
            redirect: '',
            message: 'Logged out successfully!',
        });
	}
}

module.exports = AuthController;
