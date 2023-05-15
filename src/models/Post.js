const PostException = require('../exceptions/PostException');
const DatabaseException = require('../exceptions/DatabaseException');
const Model = require('./Model');
const User = require('./User');
const Category = require('./Category');

class Post extends Model {
    constructor(id, user, category, title, type, content, createdAt = null, editedAt = null, deletedAt = null, upvotes = 0, downvotes = 0) {
		super(id);
        this.user = user;
        this.category = category;
        this.title = title;
        this.type = type;
        this.content = content;
        this.createdAt = createdAt;
        this.editedAt = editedAt;
        this.deletedAt = deletedAt;
		this.upvotes = upvotes;
		this.downvotes = downvotes;
		this.votes = upvotes - downvotes;
    }

    static async create(userId, categoryId, title, type, content) {
        if (!title)
			throw new PostException('Cannot create Post: Missing title.');
        if (!type)
			throw new PostException('Cannot create Post: Missing type.');
        if (!content)
			throw new PostException('Cannot create Post: Missing content.');
        if (!userId)
            throw new PostException('Cannot create Post: Missing userId.');
        if (!categoryId)
            throw new PostException('Cannot create Post: Missing categoryId.');
        const user = await User.findById(userId);
        if (!user)
			throw new PostException(`Cannot create Post: User does not exist with ID ${userId}.`);
        const category = await Category.findById(categoryId);
        if (!category)
			throw new PostException(`Cannot create Post: Category does not exist with ID ${categoryId}.`);      

        const connection = await Model.connect();
        const sql = 'INSERT INTO `post`(user_id, category_id, title, type, content) VALUES(?, ?, ?, ?, ?)';
        let result;

        try {
            [result] = await connection.execute(sql, [userId, categoryId, title, type, content]);
        } catch (error) {
            throw new DatabaseException(error);
        } finally {
            await connection.end();
        }

        return new Post(result.insertId, user, category, title, type, content, result.created_at);
    }

    static async findById(id) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `post` WHERE `id` = ?';
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
        const category = await Category.findById(results[0].category_id);
		const votes = await Post.getVoteCount(results[0].id);
		return new Post(results[0].id, user, category, results[0].title, results[0].type, results[0].content,
			results[0].created_at, results[0].edited_at, results[0].deleted_at, votes.upvotes, votes.downvotes);
    }

    static async findByCategory(categoryId) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `post` WHERE `category_id` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [categoryId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let posts = [];
		for (let i = 0; i < results.length; i++) {
            let user = await User.findById(results[i].user_id);
            let category = await Category.findById(results[i].category_id);
			const votes = await Post.getVoteCount(results[i].id);
			posts[i] = new Post(results[i].id, user, category, results[i].title, results[i].type, results[i].content,
                results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
		}
		return posts;
    }

	static async findByUser(userId) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `post` WHERE `user_id` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let posts = [];
		for (let i = 0; i < results.length; i++) {
            let user = await User.findById(results[i].user_id);
            let category = await Category.findById(results[i].category_id);
			const votes = await Post.getVoteCount(results[i].id);
			posts[i] = new Post(results[i].id, user, category, results[i].title, results[i].type, results[i].content,
                results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
		}
		return posts;
    }

    static async findAll() {
		const connection = await Model.connect();
		const sql = 'SELECT * FROM `post`';
		let results;

		try {
			[results] = await connection.execute(sql);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		let posts = [];
		for (let i = 0; i < results.length; i++) {
            let user = await User.findById(results[i].user_id);
            let category = await Category.findById(results[i].category_id);
			const votes = await Post.getVoteCount(results[i].id);
			posts[i] = new Post(results[i].id, user, category, results[i].title, results[i].type, results[i].content,
                results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
		}
		return posts;
	}

    static async getBookmarkedPosts(userId) {
        const user = await User.findById(userId);
        if (!user)
			throw new PostException(`Cannot bookmark Post: User does not exist with ID ${userId}.`);

        const connection = await Model.connect();
        const sql = 'SELECT * FROM `bookmarked_post` WHERE user_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let posts = [];
		for (let i = 0; i < results.length; i++) {
            posts[i] = await Post.findById(results[i].post_id);
		}
		return posts;
    }

	async checkIfBookmarkedByUser(userId) {
		const user = await User.findById(userId);
        if (!user)
			return false;

        const connection = await Model.connect();
        const sql = 'SELECT * FROM `bookmarked_post` WHERE post_id = ? AND user_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        return results.length > 0;
	}

	async checkVoteForUser(userId) {
		const user = await User.findById(userId);
        if (!user)
			return null;

        const connection = await Model.connect();
        const sql = 'SELECT * FROM `post_vote` WHERE post_id = ? AND user_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		if (results.length > 0) {
			if (results[0].type == 'Up')
				return "upvote";
			else
				return "downvote";
		}
        return null;
	}

	static async getVoteCount(id) {
		const connection = await Model.connect();
        const sql = 'SELECT * FROM `post_vote` WHERE post_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [id]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let upvotes = 0;
		let downvotes = 0;
		for (let i = 0; i < results.length; i++) {
            if (results[i].type == 'Up')
				upvotes++;
			else
				downvotes++;
		}
		return {upvotes, downvotes};
	}

	static async getUserVoted(id) {
		const connection = await Model.connect();
        const sql = 'SELECT * FROM `post_vote` WHERE user_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [id]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let posts = [];
		for (let i = 0; i < results.length; i++) {
            posts[i] = await Post.findById(results[i].post_id);
		}
		return posts;
	}

    async bookmark(userId) {
        let connection = await Model.connect();
        const sqlSearch = 'SELECT * FROM `bookmarked_post` WHERE post_id = ? AND user_id = ?';
		const sqlAction = 'INSERT INTO `bookmarked_post`(post_id, user_id) VALUES(?, ?)';
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length > 0)
			throw new PostException('Cannot bookmark Post: Post has already been bookmarked.');

		connection = await Model.connect();

		try {
			await connection.execute(sqlAction, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
    }

    async unbookmark(userId) {
        let connection = await Model.connect();
        const sqlSearch = 'SELECT * FROM `bookmarked_post` WHERE post_id = ? AND user_id = ?';
		const sqlAction = 'DELETE FROM `bookmarked_post` WHERE post_id = ? AND user_id = ?';
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length < 1)
			throw new PostException('Cannot unbookmark Post: Post has not been bookmarked.');

		connection = await Model.connect();

		try {
			await connection.execute(sqlAction, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
    }

	async upVote(userId) {
		let connection = await Model.connect();
        const sqlSearch = 'SELECT * FROM `post_vote` WHERE post_id = ? AND user_id = ?';
		const sqlInsert = "INSERT INTO `post_vote`(post_id, user_id, type) VALUES(?, ?, 'Up')";
		const sqlUpdate = "UPDATE `post_vote` SET type = 'Up' WHERE post_id = ? AND user_id = ?";
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length > 0 && results[0].type == 'Up')
			throw new PostException('Cannot up vote Post: Post has already been up voted.');

		connection = await Model.connect();

		try {
			if (results.length > 0)
				await connection.execute(sqlUpdate, [this.id, userId]);
			else
				await connection.execute(sqlInsert, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
	}

	async downVote(userId) {
		let connection = await Model.connect();
        const sqlSearch = 'SELECT * FROM `post_vote` WHERE post_id = ? AND user_id = ?';
		const sqlInsert = "INSERT INTO `post_vote`(post_id, user_id, type) VALUES(?, ?, 'Down')";
		const sqlUpdate = "UPDATE `post_vote` SET type = 'Down' WHERE post_id = ? AND user_id = ?";
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length > 0 && results[0].type == 'Down')
			throw new PostException('Cannot down vote Post: Post has already been down voted.');

		connection = await Model.connect();

		try {
			if (results.length > 0)
				await connection.execute(sqlUpdate, [this.id, userId]);
			else
				await connection.execute(sqlInsert, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
	}

	async unvote(userId) {
		let connection = await Model.connect();
        const sqlSearch = 'SELECT * FROM `post_vote` WHERE post_id = ? AND user_id = ?';
		const sqlAction = 'DELETE FROM `post_vote` WHERE post_id = ? AND user_id = ?';
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length < 1)
			throw new PostException('Cannot unvote Post: Post must first be up or down voted.');

		connection = await Model.connect();

		try {
			await connection.execute(sqlAction, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
	}

    async save() {
        if (this.deletedAt)
			throw new PostException('Cannot update Post: You cannot update a post that has been deleted.');
        if (this.type == 'URL')
			throw new PostException('Cannot update Post: Only text posts are editable.');
		if (!this.content)
			throw new PostException('Cannot update Post: Missing content.');

        const connection = await Model.connect();
		const sql = 'UPDATE `post` SET content = ?, edited_at = ?';

		try {
			await connection.execute(sql, [this.content, new Date()]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		return true;
    }

    async remove() {
        if (this.deletedAt)
			throw new PostException('Cannot delete Post: You cannot delete a post that has been deleted.');

        const connection = await Model.connect();
		const sql = 'UPDATE `post` SET deleted_at = ?';
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

    setContent(newContent) {
        this.content = newContent;
    }

    getTitle() {
        return this.title;
    }

    getContent() {
        return this.content;
    }

    getUser() {
        return this.user;
    }

    getCategory() {
        return this.category;
    }

	getUpvotes() {
		return this.upvotes;
	}

	getDownvotes() {
		return this.downvotes;
	}

	getVotes() {
		return this.votes;
	}
}

module.exports = Post;
