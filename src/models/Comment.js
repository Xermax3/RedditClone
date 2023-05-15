const CommentException = require('../exceptions/CommentException');
const DatabaseException = require('../exceptions/DatabaseException');
const Model = require('./Model');
const User = require('./User');
const Post = require('./Post')

class Comment extends Model {
    constructor(id, post, user, reply, content, createdAt = null, editedAt = null, deletedAt = null, upvotes = 0, downvotes = 0) {
        super(id);
        this.post = post;
        this.user = user;
        this.reply = reply;
        this.content = content;
        this.createdAt = createdAt;
        this.editedAt = editedAt;
        this.deletedAt = deletedAt;
		this.upvotes = upvotes;
		this.downvotes = downvotes;
		this.votes = upvotes - downvotes;
    }

    static async create(userId, postId, content, replyId = null) {
        const user = await User.findById(userId);
        const post = await Post.findById(postId);
        let reply = null;
        if (replyId) {
            reply = await this.findById(replyId);
            if (!reply)
                throw new CommentException(`Cannot create Comment: Reply does not exist with ID ${replyId}.`);
        }
        if (!user)
			throw new CommentException(`Cannot create Comment: User does not exist with ID ${userId}.`);
		if (!post)
			throw new CommentException(`Cannot create Comment: Post does not exist with ID ${postId}.`);
        if (!content)
			throw new CommentException('Cannot create Comment: Missing content.');

        const connection = await Model.connect();
        const sql = 'INSERT INTO `comment`(post_id, user_id, reply_id, content) VALUES(?, ?, ?, ?)';
        let results;

        try {
            [results] = await connection.execute(sql, [postId, userId, replyId, content]);
        } catch (error) {
            throw new DatabaseException(error);
        } finally {
            await connection.end();
        }

        return new Comment(results.insertId, post, user, reply, content);
    }

    static async findById(id) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `comment` WHERE `id` = ?';
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
        const post = await Post.findById(results[0].post_id);
        const user = await User.findById(results[0].user_id);
        const reply = await this.findById(results[0].reply_id);
		const votes = await Comment.getVoteCount(results[0].id);
		return new Comment(results[0].id, post, user, reply, results[0].content,
			results[0].created_at, results[0].edited_at, results[0].deleted_at, votes.upvotes, votes.downvotes);
    }

    static async findByPost(postId) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `comment` WHERE `post_id` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [postId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		let comments = [];
		for (let i = 0; i < results.length; i++) {
            let post = await Post.findById(results[i].post_id);
            let user = await User.findById(results[i].user_id);
            let reply = await this.findById(results[i].reply_id);
			const votes = await Comment.getVoteCount(results[i].id);
			comments[i] = new Comment(results[i].id, post, user, reply, results[i].content,
                results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
		}
		return comments;
    }

    static async findByParent(replyId) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `comment` WHERE `reply_id` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [replyId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}
		
        let comments = [];
        let currentIndex = 0;
		for (let i = 0; i < results.length; i++) {
            let post = await Post.findById(results[i].post_id);
            let user = await User.findById(results[i].user_id);
            let reply = await this.findById(results[i].reply_id);
			const votes = await Comment.getVoteCount(results[i].id);
			comments[currentIndex] = new Comment(results[i].id, post, user, reply, results[i].content,
				results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
            currentIndex++;
            // Add the children recursively
            let children = await this.findByParent(results[i].id);
            children.forEach( child => {
                comments[currentIndex] = child;
                currentIndex++;
            })
		}     
		return comments;
    }

	static async findByUser(userId) {
        const connection = await Model.connect();
		const sql = 'SELECT * FROM `comment` WHERE `user_id` = ?';
		let results;

		try {
			[results] = await connection.execute(sql, [userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		let comments = [];
		for (let i = 0; i < results.length; i++) {
            let post = await Post.findById(results[i].post_id);
            let user = await User.findById(results[i].user_id);
            let reply = await this.findById(results[i].reply_id);
			const votes = await Comment.getVoteCount(results[i].id);
			comments[i] = new Comment(results[i].id, post, user, reply, results[i].content,
                results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
		}
		return comments;
    }

    static async findAll() {
		const connection = await Model.connect();
		const sql = 'SELECT * FROM `comment`';
		let results;

		try {
			[results] = await connection.execute(sql);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

		let comments = [];
		for (let i = 0; i < results.length; i++) {
            let post = await Post.findById(results[i].post_id);
            let user = await User.findById(results[i].user_id);
            let reply = await this.findById(results[i].reply_id);
			const votes = await Comment.getVoteCount(results[i].id);
			comments[i] = new Comment(results[i].id, post, user, reply, results[i].content,
                results[i].created_at, results[i].edited_at, results[i].deleted_at, votes.upvotes, votes.downvotes);
		}
		return comments;
	}
    
    static async getBookmarkedComments(userId) {
        const user = await User.findById(userId);
        if (!user)
			throw new CommentException(`Cannot bookmark Comment: User does not exist with ID ${userId}.`);

        const connection = await Model.connect();
        const sql = 'SELECT * FROM `bookmarked_comment` WHERE user_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let comments = [];
		for (let i = 0; i < results.length; i++) {
            comments[i] = await Comment.findById(results[i].comment_id);
		}
		return comments;
    }

	async checkIfBookmarkedByUser(userId) {
		const user = await User.findById(userId);
        if (!user)
			throw new PostException(`Cannot bookmark Comment: User does not exist with ID ${userId}.`);

        const connection = await Model.connect();
        const sql = 'SELECT * FROM `bookmarked_comment` WHERE comment_id = ? AND user_id = ?'
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
        const sql = 'SELECT * FROM `comment_vote` WHERE comment_id = ? AND user_id = ?'
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
        const sql = 'SELECT * FROM `comment_vote` WHERE comment_id = ?'
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
        const sql = 'SELECT * FROM `comment_vote` WHERE user_id = ?'
        let results;

        try {
			[results] = await connection.execute(sql, [id]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        let comments = [];
		for (let i = 0; i < results.length; i++) {
            comments[i] = await Comment.findById(results[i].comment_id);
		}
		return comments;
	}

    async bookmark(userId) {
        let connection = await Model.connect();
        const sqlSearch = 'SELECT * FROM `bookmarked_comment` WHERE comment_id = ? AND user_id = ?';
		const sqlAction = 'INSERT INTO `bookmarked_comment`(comment_id, user_id) VALUES(?, ?)';
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length > 0)
			throw new CommentException('Cannot bookmark Comment: Comment has already been bookmarked.');

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
        const sqlSearch = 'SELECT * FROM `bookmarked_comment` WHERE comment_id = ? AND user_id = ?';
		const sqlAction = 'DELETE FROM `bookmarked_comment` WHERE comment_id = ? AND user_id = ?';
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length < 1)
			throw new CommentException('Cannot unbookmark Comment: Comment has not been bookmarked.');

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
        const sqlSearch = 'SELECT * FROM `comment_vote` WHERE comment_id = ? AND user_id = ?';
		const sqlInsert = "INSERT INTO `comment_vote`(comment_id, user_id, type) VALUES(?, ?, 'Up')";
		const sqlUpdate = "UPDATE `comment_vote` SET type = 'Up' WHERE comment_id = ? AND user_id = ?";
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length > 0 && results[0].type == 'Up')
			throw new CommentException('Cannot up vote Comment: Comment has already been up voted.');

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
        const sqlSearch = 'SELECT * FROM `comment_vote` WHERE comment_id = ? AND user_id = ?';
		const sqlInsert = "INSERT INTO `comment_vote`(comment_id, user_id, type) VALUES(?, ?, 'Down')";
		const sqlUpdate = "UPDATE `comment_vote` SET type = 'Down' WHERE comment_id = ? AND user_id = ?";
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length > 0 && results[0].type == 'Down')
			throw new CommentException('Cannot down vote Comment: Comment has already been down voted.');

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
        const sqlSearch = 'SELECT * FROM `comment_vote` WHERE comment_id = ? AND user_id = ?';
		const sqlAction = 'DELETE FROM `comment_vote` WHERE comment_id = ? AND user_id = ?';
        let results;

        try {
			[results] = await connection.execute(sqlSearch, [this.id, userId]);
		} catch (error) {
			throw new DatabaseException(error);
		} finally {
			await connection.end();
		}

        if (results.length < 1)
			throw new CommentException('Cannot unvote Comment: Comment must first be up or down voted.');

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
			throw new CommentException('Cannot update Comment: You cannot update a comment that has been deleted.');
        if (!this.content)
            throw new CommentException('Cannot update Comment: Missing content.');

        const connection = await Model.connect();
		const sql = 'UPDATE `comment` SET content = ?, edited_at = ?';

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
			throw new CommentException('Cannot delete Comment: You cannot delete a comment that has been deleted.');

        const connection = await Model.connect();
		const sql = 'UPDATE `comment` SET deleted_at = ?';
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

    getPost() {
        return this.post;
    }

    getUser() {
        return this.user;
    }

    getRepliedTo() {
        return this.reply;
    }

    getContent() {
        return this.content;
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

module.exports = Comment;
