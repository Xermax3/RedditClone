const CategoryException = require('../exceptions/CategoryException');
const DatabaseException = require('../exceptions/DatabaseException');
const Model = require('./Model');
const User = require('./User');

class Category extends Model {
    constructor(id, user, title, description, createdAt = null, editedAt = null, deletedAt = null) {
        super(id);
        this.user = user;
        this.title = title;
        this.description = description;
        this.createdAt = createdAt;
        this.editedAt = editedAt;
        this.deletedAt = deletedAt;
    }

    static async create(userId, title, description) {
		if (!userId)
			throw new CategoryException('Cannot create Category: Missing userId.');
		if (!title)
			throw new CategoryException('Cannot create Category: Missing title.');
		if (!description)
			throw new CategoryException('Cannot create Category: Missing description.');
		const user = await User.findById(userId);
		if (!user)
			throw new CategoryException(`Cannot create Category: User does not exist with ID ${userId}.`);
		if (await this.findByTitle(title))
			throw new CategoryException('Cannot create Category: Duplicate title.');

        const connection = await Model.connect();
        const sql = 'INSERT INTO `category`(user_id, title, description) VALUES(?, ?, ?)';
        let results;

        try {
            [results] = await connection.execute(sql, [userId, title, description]);
        } catch (error) {
            throw new DatabaseException(error);
        } finally {
            await connection.end();
        }

        return new Category(results.insertId, user, title, description);
    }

    static async findById(id) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `category` WHERE `id` = ?';
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
        const user = await User.findById(results[0].user_id);
		return new Category(results[0].id, user, results[0].title, results[0].description, 
                results[0].created_at, results[0].edited_at, results[0].deleted_at);
    }

    static async findByTitle(title) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `category` WHERE `title` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [title]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		if (results.length < 1) {
			return null;
		}
		const user = await User.findById(results[0].user_id);
		return new Category(results[0].id, user, results[0].title, results[0].description, 
                results[0].created_at, results[0].edited_at, results[0].deleted_at);
    }

    static async findAll() {
		const connection = await Model.connect();
		const sql = 'SELECT * FROM `category`';
		let results;

		try {
			[results] = await connection.execute(sql);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		let categories = [];
		for (let i = 0; i < results.length; i++) {
            let user = await User.findById(results[i].user_id);
			categories[i] = new Category(results[i].id, user, results[i].title, results[i].description, 
                results[i].created_at, results[i].edited_at, results[i].deleted_at);
		}
		return categories;
	}

    async save() {
		if (this.deletedAt)
			throw new CategoryException('Cannot update Category: You cannot update a category that has been deleted.');
        if (!this.title)
			throw new CategoryException('Cannot update Category: Missing title.');
		if (!this.description)
			throw new CategoryException('Cannot update Category: Missing description.');

        const connection = await Model.connect();
		const sql = 'UPDATE `category` SET title = ?, description = ?, edited_at = ?';

		try {
			await connection.execute(sql, [this.title, this.description, new Date()]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
    }

    async remove() {
		if (this.deletedAt)
			throw new CategoryException('Cannot delete Category: You cannot delete a category that has been deleted.');

        const connection = await Model.connect();
		const sql = 'UPDATE `category` SET deleted_at = ?';
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

    setTitle(newTitle) {
        this.title = newTitle;
    }

    setDescription(newDescription) {
        this.description = newDescription;
    }

    getUser() {
        return this.user;
    }

    getTitle() {
        return this.title;
    }

    getDescription() {
        return this.description;
    }
}

module.exports = Category;
