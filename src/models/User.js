const UserException = require('../exceptions/UserException');
const DatabaseException = require('../exceptions/DatabaseException');
const Model = require('./Model');
const AuthException = require('../exceptions/AuthException');

class User extends Model {
    constructor(id, username, email, password, avatar = null, createdAt = null, editedAt = null, deletedAt = null) {
		super(id);
		this.username = username;
		this.email = email;
        this.password = password;
        this.avatar = avatar;
        this.createdAt = createdAt;
        this.editedAt = editedAt;
        this.deletedAt = deletedAt;
	}
    
    static async create(username, email, password) {
		if (!username)
			throw new UserException('Cannot create User: Missing username.');
		if (!email)
			throw new UserException('Cannot create User: Missing email.');
		if (!password)
			throw new UserException('Cannot create User: Missing password.');
		if (await this.findByUsername(username))
			throw new UserException('Cannot create User: Duplicate username.');
		if (await this.findByEmail(email))
			throw new UserException('Cannot create User: Duplicate email.');

        const connection = await Model.connect();
		const sql = 'INSERT INTO `user`(username, email, password) VALUES(?, ?, ?)';
		let results;

		try {
			[results] = await connection.execute(sql, [username, email, password]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		return new User(results.insertId, username, email, password);
    }

    static async findById(id) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `user` WHERE `id` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [id]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		if (results.length < 1) {
			return null;
		}
		return new User(results[0].id, results[0].username, results[0].email, results[0].password, 
                results[0].avatar, results[0].created_at, results[0].edited_at, results[0].deleted_at);
    }

    static async findByUsername(username) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `user` WHERE `username` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [username]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		if (results.length < 1) {
			return null;
		}
		return new User(results[0].id, results[0].username, results[0].email, results[0].password, 
                results[0].avatar, results[0].created_at, results[0].edited_at, results[0].deleted_at);
    }

    static async findByEmail(email) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `user` WHERE `email` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [email]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		if (results.length < 1) {
			return null;
		}
		return new User(results[0].id, results[0].username, results[0].email, results[0].password, 
                results[0].avatar, results[0].created_at, results[0].edited_at, results[0].deleted_at);
    }

	static async findAll() {
		const connection = await Model.connect();
		const sql = 'SELECT * FROM `user`';
		let results;

		try {
			[results] = await connection.execute(sql);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		let users = [];
		for (let i = 0; i < results.length; i++) {
			users[i] = new User(results[i].id, results[i].username, results[i].email, results[i].password, 
                results[i].avatar, results[i].created_at, results[i].edited_at, results[i].deleted_at);
		}
		return users;
	}

	static async logIn(email, password) {
		if (!email)
			throw new AuthException('Cannot log in: Missing email.');
		if (!password)
			throw new AuthException('Cannot log in: Missing password.');

		const connection = await Model.connect();
		const sql = 'SELECT * FROM `user` WHERE `email` = ? AND `password` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [email, password]);
		}
		catch (exception) {
			throw new DatabaseException(exception);
		}
		finally {
			await connection.end();
		}

		if (results.length === 0) {
			return null;
		}

		if (results[0].deleted_at)
			throw new AuthException('Cannot log in: User has been deleted.');

		return new User(results[0].id, results[0].username, results[0].email, results[0].password, 
			results[0].avatar, results[0].created_at, results[0].edited_at, results[0].deleted_at);
	}

    async save() {
        if (!this.username)
			throw new UserException('Cannot update User: Missing username.');
		if (!this.email)
			throw new UserException('Cannot update User: Missing email.');

        const connection = await Model.connect();
		const sql = 'UPDATE `user` SET username = ?, email = ?, avatar = ?, edited_at = ?';

		try {
			await connection.execute(sql, [this.username, this.email, this.avatar, new Date()]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
    }

    async remove() {
        const connection = await Model.connect();
		const sql = 'UPDATE `user` SET deleted_at = ?';
        this.deletedAt = new Date();

		try {
			await connection.execute(sql, [this.deletedAt]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
    }

    setUsername(newUsername) {
        this.username = newUsername;
    }

    setEmail(newEmail) {
        this.email = newEmail;
    }

    setAvatar(newAvatar) {
        this.avatar = newAvatar;
    }

    getUsername() {
        return this.username;
    }

    getEmail() {
        return this.email;
    }

    getAvatar() {
        return this.avatar;
    }
}

module.exports = User;
