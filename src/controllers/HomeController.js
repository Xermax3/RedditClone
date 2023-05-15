const Category = require('../models/Category');
const Controller = require('./Controller');

class HomeController extends Controller {
    constructor(request, response, session) {
        super(request, response, session);
        this.action = this.home;
    }

    async home() {
        return await this.response.setResponse({
            isAuthenticated: this.session.exists('user_id'),
            sessionUserId: this.session.get('user_id'),
            template: "HomeView",
            title: "Welcome",
            header: "Welcome to Reddit!",
            message: "Homepage!",
            categories: await Category.findAll(),
        });
    }
}

module.exports = HomeController;
