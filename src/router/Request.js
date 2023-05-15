/**
 * This class is responsible for parsing and organizing the HTTP request data.
 */
 class Request {
	constructor(requestMethod = 'GET', path  = '/', bodyParameters = {}, cookies) {
		const pathPieces = path.split('/').slice(1);
		const headerParameters = pathPieces.slice(1);

		this.controllerName = pathPieces[0] ?? '';
		this.requestMethod = requestMethod;
		this.parameters = {
			header: headerParameters ?? [],
			body: bodyParameters ?? {},
		};
		this.cookies = cookies;
	}

	convertStringParametersToNumbers() {
		this.parameters.header = this.parameters.header.map((string) => (Number.isNaN(parseInt(string)) ? string : parseInt(string)));
	}

	getParameters() {
		return this.parameters;
	}

	getControllerName() {
		return this.controllerName;
	}

	getRequestMethod() {
		return this.requestMethod;
	}

	getCookies() {
		return this.cookies;
	}
}

module.exports = Request;
