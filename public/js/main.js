const BASE_URL = 'http://localhost:8000/';
let url = BASE_URL + "user/1";
const options = {
    headers: {
        // This is how the server will know to initialize a JsonResponse object and not an HtmlResponse.
        Accept: "application/json"
    }
};
// const doStuff = (data) => {
//     // If the request was successful, then `data` will have everything you asked for.
//     console.log(data);
// }

const makeRequest = async (url) => {
	return fetch(url, options)
    .then((response) => response.json())
    .catch( error => {
        // If there is any error you will catch them here.
        console.log(error);
    });
};

// fetch(url, options)
//     .then(response => response.json())
//     .then(data => {
//         doStuff(data);
//     })
//     .catch(function(error) {
//         // If there is any error you will catch them here.
//         console.error(error);
//     });



// Comment Show View
const commentId = document.getElementById('comment-id');
if (commentId != null) {
    commentVoting();
}

// Post Show View
const postId = document.getElementById('post-id');
if (postId != null) {
    const postBookmarkButton = document.getElementById('post-bookmark-button');
    postBookmarkButton.addEventListener('click', async () => {
        if (postBookmarkButton.getAttribute("bookmarked") == "false") {
            if (await makeRequest(BASE_URL + `post/${postId.innerText}/bookmark`)) {
                postBookmarkButton.setAttribute("bookmarked", "true");
                postBookmarkButton.innerText = "Unbookmark Post";
            }
        } else {
            if (await makeRequest(BASE_URL + `post/${postId.innerText}/unbookmark`)) {
                postBookmarkButton.setAttribute("bookmarked", "false");
                postBookmarkButton.innerText = "Bookmark Post";
            }
        }
    });

    const commentBookmarkButtons = document.querySelectorAll('#comments .comment-bookmark-button');
    commentBookmarkButtons.forEach(commentBookmarkButton => {
        const commentId = commentBookmarkButton.parentElement.getAttribute("comment-id");
        commentBookmarkButton.addEventListener('click', async () => {
            if (commentBookmarkButton.getAttribute("bookmarked") == "false") {
                if (await makeRequest(BASE_URL + `comment/${commentId}/bookmark`)) {
                    commentBookmarkButton.setAttribute("bookmarked", "true");
                    commentBookmarkButton.innerText = "Unbookmark Comment";
                }
            } else {
                if (await makeRequest(BASE_URL + `comment/${commentId}/unbookmark`)) {
                    commentBookmarkButton.setAttribute("bookmarked", "false");
                    commentBookmarkButton.innerText = "Bookmark Comment";
                }
            }
        });
    });

    postVoting();
    commentVoting();
}

// Category Show View
const categoryId = document.getElementById('category-id');
if (categoryId != null) {
    postVoting();
}

function postVoting() {
    const postUpvoteButtons = document.querySelectorAll('.post-upvote-button');
    postUpvoteButtons.forEach(postUpvoteButton => {
        postUpvoteButton.addEventListener('click', async () => {
            const postId = postUpvoteButton.getAttribute("post-id");
            const postVotes = document.querySelector(`.post-votes[post-id="${postId}"]`);
            if (postUpvoteButton.getAttribute("upvoted") == "false") {
                if (await makeRequest(BASE_URL + `post/${postId}/upvote`)) {
                    const postDownvoteButton = document.querySelector(`.post-downvote-button[post-id="${postId}"]`);
                    postUpvoteButton.setAttribute("upvoted", "true");
                    if (postDownvoteButton.getAttribute("downvoted") == "false") {
                        postVotes.innerText = parseInt(postVotes.innerText) + 1;
                    } else {
                        postDownvoteButton.setAttribute("downvoted", "false");
                        postVotes.innerText = parseInt(postVotes.innerText) + 2;
                    }
                }
            } else {
                if (await makeRequest(BASE_URL + `post/${postId}/unvote`)) {
                    postUpvoteButton.setAttribute("upvoted", "false");
                    postVotes.innerText = parseInt(postVotes.innerText) - 1;
                }
            }          
        });
    });

    const postDownvoteButtons = document.querySelectorAll('.post-downvote-button');
    postDownvoteButtons.forEach(postDownvoteButton => {
        postDownvoteButton.addEventListener('click', async () => {
            const postId = postDownvoteButton.getAttribute("post-id");
            const postVotes = document.querySelector(`.post-votes[post-id="${postId}"]`);
            if (postDownvoteButton.getAttribute("downvoted") == "false") {
                if (await makeRequest(BASE_URL + `post/${postId}/downvote`)) {
                    const postUpvoteButton = document.querySelector(`.post-upvote-button[post-id="${postId}"]`);
                    postDownvoteButton.setAttribute("downvoted", "true");
                    if (postUpvoteButton.getAttribute("upvoted") == "false") {
                        postVotes.innerText = parseInt(postVotes.innerText) - 1;
                    } else {
                        postUpvoteButton.setAttribute("upvoted", "false");
                        postVotes.innerText = parseInt(postVotes.innerText) - 2;
                    }
                }
            } else {
                if (await makeRequest(BASE_URL + `post/${postId}/unvote`)) {
                    postDownvoteButton.setAttribute("downvoted", "false");
                    postVotes.innerText = parseInt(postVotes.innerText) + 1;
                }
            }  
        });
    });
}

function commentVoting() {
    const commentUpvoteButtons = document.querySelectorAll('.comment-upvote-button');
    commentUpvoteButtons.forEach(commentUpvoteButton => {
        commentUpvoteButton.addEventListener('click', async () => {
            const commentId = commentUpvoteButton.getAttribute("comment-id");
            const commentVotes = document.querySelector(`.comment-votes[comment-id="${commentId}"]`);
            if (commentUpvoteButton.getAttribute("upvoted") == "false") {
                if (await makeRequest(BASE_URL + `comment/${commentId}/upvote`)) {
                    const commentDownvoteButton = document.querySelector(`.comment-downvote-button[comment-id="${commentId}"]`);
                    commentUpvoteButton.setAttribute("upvoted", "true");
                    if (commentDownvoteButton.getAttribute("downvoted") == "false") {
                        commentVotes.innerText = parseInt(commentVotes.innerText) + 1;
                    } else {
                        commentDownvoteButton.setAttribute("downvoted", "false");
                        commentVotes.innerText = parseInt(commentVotes.innerText) + 2;
                    }
                }
            } else {
                if (await makeRequest(BASE_URL + `comment/${commentId}/unvote`)) {
                    commentUpvoteButton.setAttribute("upvoted", "false");
                    commentVotes.innerText = parseInt(commentVotes.innerText) - 1;
                }
            }     
        });
    });

    const commentDownvoteButtons = document.querySelectorAll('.comment-downvote-button');
    commentDownvoteButtons.forEach(commentDownvoteButton => {
        commentDownvoteButton.addEventListener('click', async () => {
            const commentId = commentDownvoteButton.getAttribute("comment-id");
            const commentVotes = document.querySelector(`.comment-votes[comment-id="${commentId}"]`);
            if (commentDownvoteButton.getAttribute("downvoted") == "false") {
                if (await makeRequest(BASE_URL + `comment/${commentId}/downvote`)) {
                    const commentUpvoteButton = document.querySelector(`.comment-upvote-button[comment-id="${commentId}"]`);
                    commentDownvoteButton.setAttribute("downvoted", "true");
                    if (commentUpvoteButton.getAttribute("upvoted") == "false") {
                        commentVotes.innerText = parseInt(commentVotes.innerText) - 1;
                    } else {
                        commentUpvoteButton.setAttribute("upvoted", "false");
                        commentVotes.innerText = parseInt(commentVotes.innerText) - 2;
                    }
                }
            } else {
                if (await makeRequest(BASE_URL + `comment/${commentId}/unvote`)) {
                    commentDownvoteButton.setAttribute("downvoted", "false");
                    commentVotes.innerText = parseInt(commentVotes.innerText) + 1;
                }
            }  
        });
    });
}


// User Show View
const userId = document.getElementById('user-id');
if (userId != null) {
    const userPosts = document.getElementById('user-posts');
    const userComments = document.getElementById('user-comments');
    const userPostVotes = document.getElementById('user-post-votes');
    const userCommentVotes = document.getElementById('user-comment-votes');
    const userPostBookmarks = document.getElementById('user-post-bookmarks');
    const userCommentBookmarks = document.getElementById('user-comment-bookmarks');
    document.getElementById('show-user-posts-button').addEventListener('click', async () => {
        const body = document.getElementById('user-posts-body');
        const response = await makeRequest(BASE_URL + `user/${userId.innerText}/posts`);
        await fillUserTable(body, response.payload, true);
        userPosts.hidden = false;
        userComments.hidden = true;
        userPostVotes.hidden = true;
        userCommentVotes.hidden = true;
        userPostBookmarks.hidden = true;
        userCommentBookmarks.hidden = true;
    });
    document.getElementById('show-user-comments-button').addEventListener('click', async () => {
        const body = document.getElementById('user-comments-body');
        const response = await makeRequest(BASE_URL + `user/${userId.innerText}/comments`);
        await fillUserTable(body, response.payload, false);
        userPosts.hidden = true;
        userComments.hidden = false;
        userPostVotes.hidden = true;
        userCommentVotes.hidden = true;
        userPostBookmarks.hidden = true;
        userCommentBookmarks.hidden = true;
    });
    document.getElementById('show-user-post-votes-button').addEventListener('click', async () => {
        const body = document.getElementById('user-post-votes-body');
        const response = await makeRequest(BASE_URL + `user/${userId.innerText}/postvotes`);
        await fillUserTable(body, response.payload, true);
        userPosts.hidden = true;
        userComments.hidden = true;
        userPostVotes.hidden = false;
        userCommentVotes.hidden = true;
        userPostBookmarks.hidden = true;
        userCommentBookmarks.hidden = true;
    });
    document.getElementById('show-user-comment-votes-button').addEventListener('click', async () => {
        const body = document.getElementById('user-comment-votes-body');
        const response = await makeRequest(BASE_URL + `user/${userId.innerText}/commentvotes`);
        await fillUserTable(body, response.payload, false);
        userPosts.hidden = true;
        userComments.hidden = true;
        userPostVotes.hidden = true;
        userCommentVotes.hidden = false;
        userPostBookmarks.hidden = true;
        userCommentBookmarks.hidden = true;
    });
    document.getElementById('show-user-post-bookmarks-button').addEventListener('click', async () => {
        const body = document.getElementById('user-post-bookmarks-body');
        const response = await makeRequest(BASE_URL + `user/${userId.innerText}/postbookmarks`);
        await fillUserTable(body, response.payload, true);
        userPosts.hidden = true;
        userComments.hidden = true;
        userPostVotes.hidden = true;
        userCommentVotes.hidden = true;
        userPostBookmarks.hidden = false;
        userCommentBookmarks.hidden = true;
    });
    document.getElementById('show-user-comment-bookmarks-button').addEventListener('click', async () => {
        const body = document.getElementById('user-comment-bookmarks-body');
        const response = await makeRequest(BASE_URL + `user/${userId.innerText}/commentbookmarks`);
        await fillUserTable(body, response.payload, false);
        userPosts.hidden = true;
        userComments.hidden = true;
        userPostVotes.hidden = true;
        userCommentVotes.hidden = true;
        userPostBookmarks.hidden = true;
        userCommentBookmarks.hidden = false;
    });
}

async function fillUserTable(tableBody, payload, isPost) {
    payload.forEach(async element => {
        let tr = document.createElement("tr");
        let votes = document.createElement("th");
        votes.innerText = element.votes;
        let dateCreated = document.createElement("th");
        dateCreated.innerText = new Date(element.createdAt).toString();
        let writtenBy = document.createElement("th");
        writtenBy.innerText = element.user.username;
        let link = document.createElement("a");
        if (isPost) {
            link.href = BASE_URL + `post/${element.id}`;
            let title = document.createElement("th");
            title.innerText = element.title;
            title.appendChild(link);
            tr.appendChild(title);
        }
        else {
            link.href = BASE_URL + `comment/${element.id}`;
            let title = document.createElement("th");
            title.innerText = element.post.title;
            let content = document.createElement("th");
            content.innerText = element.content;
            content.appendChild(link);
            tr.appendChild(title);
            tr.appendChild(content);
        }
        tr.appendChild(votes);
        tr.appendChild(dateCreated);
        tr.appendChild(writtenBy);
        tableBody.appendChild(tr);
    });
}

