class Controller {
    constructor(request, response, session) {
		this.request = request;
		this.response = response;
		this.session = session;
	}

	doAction() {
		return this.action();
	}

	setAction(action) {
		this.action = action;
	}

	getAction() {
		return this.action;
	}

	error() {
		return this.response;
	}

	editModelFields(model, fields) {
		let fieldsEdited = 0;

		fields.forEach((field) => {
			if (this.isFieldValid(field)) {
				const functionName = `set${field.charAt(0).toUpperCase() + field.slice(1)}`;
				const argument = this.request.parameters.body[field];

				model[functionName](argument);
				fieldsEdited += 1;
			}
		});

		return fieldsEdited;
	}

	isFieldValid(field) {
		return Object.keys(this.request.parameters.body).includes(field) && this.request.parameters.body[field].length !== 0;
	}
}

module.exports = Controller;
