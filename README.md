# Assignment 5 - Fetch 🐕

- 💯**Worth**: 15%
- 📅**Due**: May 16, 2021 @ 23:59
- 🙅🏽‍**Penalty**: Late submissions lose 10% per day to a maximum of 3 days. Nothing is accepted after 3 days and a grade of 0% will be given.

## 🎯 Objectives

- **Consume** your Reddit API using the client-side JS `fetch` function.
- **Manipulate** the DOM using the JSON data retrieved from your API.

## 🔨 Setup

1. Navigate to `~/web-ii/Assignments`.
2. Click `Code -> 📋` to copy the URL to the repository.
3. Clone the Git repo `git clone <paste URL from GitHub>` (without the angle brackets).
   - You may have to use the `HTTPS` or `SSH` URL to clone depending on your settings. If one doesn't work, try the other by clicking `Use SSH` or `Use HTTPS` above the 📋, and copy the new URL.
4. You should now have a folder inside `Assignments` called `assignment-5-githubusername`.
   - If you want, you can rename this folder to `5-Fetch` for consistency's sake! 😉
5. Copy these folders from A4 into `src`:
   - `src/Controllers`
   - `src/Models`
   - `src/Views`
   - `src/Router`
6. Write the following code inside `public/js/main.js`:

   ```javascript
   const BASE_URL = 'http://localhost:8000/';
   let url = BASE_URL + "user/1";
   const options = {
       headers: {
           // This is how the server will know to initialize a JsonResponse object and not an HtmlResponse.
           Accept: "application/json"
       }
   };
   const doStuff = (data) => {
       // If the request was successful, then `data` will have everything you asked for.
       console.log(data);
   }

   fetch(url, options)
       .then(response => response.json())
       .then(data => {
           doStuff(data);
       })
       .catch(function(error) {
           // If there is any error you will catch them here.
           console.error(error);
       });
   ```

7. Make sure to include this file in your `src/Views/Partials/Header.hbs`:

   ```html
   <head>
       <script src="{{ scripts 'main.js' }}" defer></script>
   </head>
   ```

8. Navigate to [http://localhost:8000](http://localhost:8000) and open the developer tools. You should see that a JSON object was logged to the console (assuming you had a user in your database with an ID of 1). You can now do anything you want with this data! Put it in a variable, log it, populate DOM nodes with it, etc.

## 🔍 Context

In **A1**, we created the 4 main models (`User`, `Category`, `Post`, and `Comment`) that are in charge of talking to the database. The models are based on the entities from the ERD which can be found in the A1 specs.

In **A2**, we implemented the `Router` that handles the web requests/responses and instantiates a `Controller`. We also implemented the `Controller` which takes care of deciding which model method to call.

In **A3**, we implemented **error-handling** by **throwing and catching exceptions** and we also implemented the **views** of our application using the [Handlebars templating engine](https://handlebarsjs.com).

In **A4**, we implemented **session management** to allow users to log into our application.

In this **final assignment**, we will implement the functionality to:

1. 🔖 Bookmark/unbookmark posts/comments.
   - Bookmarking is how a user can save a post or comment they particularly like so that it is easily retrievable at a later time. The bookmarks will be available on the user's profile page.
2. 🔃 Upvote/downvote posts/comments.
   - Voting is the how a user can express if they like a particular post or comment. In real Reddit, the more upvotes a post or comment has, the high it appears in the feed. This would be a really cool feature to add, but there's already a lot of work to be done just implementing simple voting that I won't make you do this!
3. 👤 View all the user's activity on their profile page to see the posts/comments they've written, voted on, and bookmarked.

We'll be implementing these features by getting both the server-side JS (in Node) and the client-side JS (in the browser) to talk to each other. The client-side JS we'll have to write for this assignment will largely be used for calling the `fetch()` function that will make an asynchronous HTTP request to our server. Dig up your Web I assignment where you queried the Star Wars API. You can also use E5.1 as a reference. Instead of querying the Star Wars API this time, we're now going to query the API we've been building in this course!

We're also going to be using the `post_vote`, `comment_vote`, `bookmarked_post`, and `bookmarked_comment` database tables to implement these features. These tables are **already in your database** so you don't need to add them.

All 4 of these tables are _associative entities_:

1. `post_vote`: Resolves a many-to-many relationship between `user` and `post`.
2. `comment_vote`: Resolves a many-to-many relationship between `user` and `comment`.
3. `bookmarked_post`: Resolves a many-to-many relationship between `user` and `post`.
4. `bookmarked_comment`: Resolves a many-to-many relationship between `user` and `comment`.

If you need a refresher on these types of relationships, please refer to your notes from last semester's database course.

The tests will give you a better idea of what you'll need to add/modify in each entity, but here's a description to get you started.

### 🔖 Bookmarking

1. The `Post` and `Comment` models will need an additional field to keep track of if a particular instance has been bookmarked or not. You should work with the `bookmarked_post` and `bookmarked_comment` database tables to accomplish this.
   - A post or comment can be in one of two _states_ when it comes to bookmarking:
     1. **Bookmarked**: The user has clicked the bookmark button on a particular post or comment.
     2. **Unbookmarked**: The user has either not clicked the bookmark button or has clicked it and clicks it again to remove the bookmark.
2. The `PostController` and `CommentController` will need to have additional methods to handle the action of bookmarking and unbookmarking a particular post or comment. See the routing table below for more details.
3. The views that display posts and comments will have to keep track of the bookmark state of the element so that you can work with it in client-side JS.
   - For example, you can set a `state` attribute on the button element that tracks whether post or comment is bookmarked or not:

     ```hbs
     <button class="comment-bookmark-button" comment-id="{{ id }}" state="bookmarked">
     ```

   You can then check the state of this element when it is clicked to know which bookmark request you need to make. This is only one way of doing it, you may very well think of your own way to keep track of state, and that's perfectly fine!

### 🔃 Voting

1. The `Post` and `Comment` models will need additional fields to keep track of if a particular instance has been upvoted or downvoted, as well as some way to calculate how many total votes a particular instance has.
   - The **total votes** are simply the upvotes minus the downvotes.
     - For example, if a post has 1 upvote and 2 downvotes, the **total votes** would be -1.
   - A post or comment can be in one of three _states_ when it comes to voting:
     1. **Upvoted**: The user has clicked the upvote button on a particular post or comment.
     2. **Downvoted**: The user has clicked the downvote button on a particular post or comment.
     3. **Unvoted**: The user has either not clicked the upvote button or has clicked it but later decided that they don't want to vote on this particular post or comment. They can click the upvote button again which will remove the vote. The same goes for downvoting.
2. The `PostController` and `CommentController` will need to have additional methods to handle the action of upvoting, downvoting, and unvoting a particular post or comment. See the routing table below for more details.
3. The views that display posts and comments will have to keep track of the vote state of the element so that you can work with it in client-side JS.
   - For example, you can set a `state` attribute on the button element that tracks whether post or comment is up/downvoted or not

     ```hbs
     <button class="post-upvote-button" post-id="{{ id }}" state="filled">
     <button class="post-downvote-button" post-id="{{ id }}" state="blank">
     ```

   You can then check the state of this element when it is clicked to know which vote request you need to make. This is only one way of doing it, you may very well think of your own way to keep track of state, and that's perfectly fine!

## 🗺️ Routes

Notice a "new" type of response listed in the routes table: `JSON`. I say "new" in quotations because it's actually not-so-new. Our app has been returning JSON this whole time in the HTTP tests - we just haven't used it in the front-end yet. Now we have three response options - we can either

1. Render a template file (HTML), or
2. Redirect the user to another page, or
3. Send back JSON data

For all the routes that return `JSON` in the table below, you'll have to make use of the JS `fetch()` function to call that route from your front-end. If you need a refresher on this, please go back to your _Web Programming I_ assignment where you consumed the Star Wars API.

| HTTP Method | Path                          | Action                                | Redirect/Template   | Description                                          |
| ----------- | ----------------------------- | ------------------------------------- | ------------------- | ---------------------------------------------------- |
| `GET`       | `/`                           | `HomeController::home`                | `HomeView`          | Display the homepage.                                |
| `ANY`       | `/{garbage}`                  | `ErrorController::error`              | `ErrorView`         | Display a 404 error page.                            |
| `GET`       | `/auth/register`              | `AuthController::getRegisterForm`     | `User/NewFormView`  | Display a form to register a new user.               |
| `GET`       | `/auth/login`                 | `AuthController::getLoginForm`        | `LoginFormView`     | Display a form to log in a user.                     |
| `POST`      | `/auth/login`                 | `AuthController::logIn`               | `/user/{id}`        | Log in a user.                                       |
| `GET`       | `/auth/logout`                | `AuthController::logOut`              | `/`                 | Log out the user.                                    |
| `POST`      | `/user`                       | `UserController::new`                 | `/auth/login`       | Register a user.                                     |
| `GET`       | `/user/{id}`                  | `UserController::show`                | `User/ShowView`     | Display a user's profile where they can edit/delete. |
| `GET`       | `/user/{id}/posts`            | `UserController::getPosts`            | `JSON`              | Display all posts for this user.                     |
| `GET`       | `/user/{id}/comments`         | `UserController::getComments`         | `JSON`              | Display all comments for this user.                  |
| `GET`       | `/user/{id}/postvotes`        | `UserController::getPostVotes`        | `JSON`              | Display all posts this user has voted on.            |
| `GET`       | `/user/{id}/commentvotes`     | `UserController::getCommentVotes`     | `JSON`              | Display all comments this user has voted on.         |
| `GET`       | `/user/{id}/postbookmarks`    | `UserController::getPostBookmarks`    | `JSON`              | Display all post bookmarks for this user.            |
| `GET`       | `/user/{id}/commentbookmarks` | `UserController::getCommentBookmarks` | `JSON`              | Display all comment bookmarks for this user.         |
| `PUT`       | `/user/{id}`                  | `UserController::edit`                | `/user/{id}`        | Edit a user's profile.                               |
| `DELETE`    | `/user/{id}`                  | `UserController::destroy`             | `/user/{id}`        | Deactivate a user's profile.                         |
| `POST`      | `/category`                   | `CategoryController::new`             | `/`                 | Create a new category.                               |
| `GET`       | `/category/{id}`              | `CategoryController::show`            | `Category/ShowView` | Display all posts in a category.                     |
| `GET`       | `/category/{id}/edit`         | `CategoryController::getEditForm`     | `Category/EditView` | Display a form to edit a category.                   |
| `PUT`       | `/category/{id}`              | `CategoryController::edit`            | `/category/{id}`    | Edit category title/description.                     |
| `DELETE`    | `/category/{id}`              | `CategoryController::destroy`         | `/`                 | Deactivate a category.                               |
| `POST`      | `/post`                       | `PostController::new`                 | `/category/{id}`    | Create new post.                                     |
| `GET`       | `/post/{id}`                  | `PostController::show`                | `Post/ShowView`     | Display a post's details and comments.               |
| `GET`       | `/post/{id}/upvote`           | `PostController::upVote`              | `JSON`              | Upvote a post.                                       |
| `GET`       | `/post/{id}/downvote`         | `PostController::downVote`            | `JSON`              | Downvote a post.                                     |
| `GET`       | `/post/{id}/unvote`           | `PostController::unvote`              | `JSON`              | Unvote a post.                                       |
| `GET`       | `/post/{id}/bookmark`         | `PostController::bookmark`            | `JSON`              | Bookmark a post.                                     |
| `GET`       | `/post/{id}/unbookmark`       | `PostController::unbookmark`          | `JSON`              | Unbookmark a post.                                   |
| `GET`       | `/post/{id}/edit`             | `PostController::getEditForm`         | `Post/EditView`     | Display a form to edit a post.                       |
| `PUT`       | `/post/{id}`                  | `PostController::edit`                | `/post/{id}`        | Edit contents of text post.                          |
| `DELETE`    | `/post/{id}`                  | `PostController::destroy`             | `/post/{id}`        | Deactivate a post.                                   |
| `POST`      | `/comment`                    | `CommentController::new`              | `/post/{id}`        | Create a new comment.                                |
| `GET`       | `/comment/{id}`               | `CommentController::show`             | `Comment/ShowView`  | Display a comment along with its replies.            |
| `GET`       | `/comment/{id}/upvote`        | `CommentController::upVote`           | `JSON`              | Upvote a comment.                                    |
| `GET`       | `/comment/{id}/downvote`      | `CommentController::downVote`         | `JSON`              | Downvote a comment.                                  |
| `GET`       | `/comment/{id}/unvote`        | `CommentController::unvote`           | `JSON`              | Unvote a comment.                                    |
| `GET`       | `/comment/{id}/bookmark`      | `CommentController::bookmark`         | `JSON`              | Bookmark a comment.                                  |
| `GET`       | `/comment/{id}/unbookmark`    | `CommentController::unbookmark`       | `JSON`              | Unbookmark a comment.                                |
| `GET`       | `/comment/{id}/edit`          | `CommentController::getEditForm`      | `Comment/EditView`  | Display a form to edit a comment.                    |
| `PUT`       | `/comment/{id}`               | `CommentController::edit`             | `/post/{id}`        | Edit the contents of a comment.                      |
| `DELETE`    | `/comment/{id}`               | `CommentController::destroy`          | `/post/{id}`        | Deactivate a comment.                                |

## 🧪 Tests

As usual, get all your model functions working first since that's the base of the whole application. Then make sure the controllers can call the model methods successfully and that the router is routing to the correct controller. Move on to the HTTP tests to verify that the proper JSON is being returned from the app. Finish with the browser tests by implementing all of the UI interactions. I **highly recommend** working on them in (loosely) this order:

1. `tests/models/bookmark.test.js`
2. `tests/controller/bookmark.test.js`
3. `tests/router/bookmark.test.js`
4. `tests/http/bookmark.test.js`
5. `tests/browser/bookmark.test.js`
6. `tests/models/vote.test.js`
7. `tests/controller/vote.test.js`
8. `tests/router/vote.test.js`
9. `tests/http/vote.test.js`
10. `tests/browser/vote.test.js`
11. `browser/post.test.js`: Many posts created successfully.
12. `browser/comment.test.js:`: Many comments created successfully.

Since bookmarks are going to be easier to implement than votes, I recommend working on them first.

### 🎥 [Test Suite Video](https://youtu.be/g6tDMUgRRsY)

The test code itself serves as a guide for you to create your views as they will tell you what elements on the page it expects. To aid you further, I've recorded a run of all the tests which can be found [here](https://youtu.be/g6tDMUgRRsY). This will enable you to see my interpretation of the pages and how they look and function. Use YouTube's [playback speed](https://www.howtogeek.com/702364/how-to-speed-up-youtubes-playback-speed-or-slow-it-down/) feature to slow down the video.

### 🐞 Debugging

Please refer to the debugging section of **E3.3** for a detailed explanation on how to debug browser tests.

## 🚲 Handlebars

I encourage the use of partials as much as you can. For example, it's probably a good idea to put the post voting interface in its own template file so that you can use it both on the category page as well as the post page. When your template usage starts getting more advanced, you may find yourself in a situation where you have to pass data to a partial you're nesting. Here's an example of how to do this:

```hbs
<!-- Post/ListView -->
{{#each posts}}
    ...
    {{> 'Post/VoteView' post=this isAuthenticated=../isAuthenticated}}
    ...
{{/each}}
```

```hbs
<!-- Post/VoteView -->
{{#if isAuthenticated}}
    {{#if post.upvoted}}
        ...
    {{/if}}
{{/if}}
```

## 📥 Submission

Check that all tests are passing by removing all occurrences of `.only` and running the test suite for the final time. Once you've made your final `git push` to GitHub, here's what you have to do to submit:

1. Go to [Gradescope](https://www.gradescope.ca/courses/828) and click the link for this assignment.
2. Select the correct repository and branch from the dropdown menus.
3. Click _Upload_.
4. Wait for the autograder to finish grading your submission. Once it's done, you should see the final output of the test results as well as your grade on the top right.

### 💯 Grade Distribution

- `browser/vote.test.js` = **50%**
- `browser/bookmark.test.js` = **30%**
- `browser/post.test.js`: Many posts created successfully. = **10%**
- `browser/comment.test.js:`: Many comments created successfully. = **10%**
- Breaking any of the tests not listed above = **-0.25%** for every broken test.

At first glance it may not seem fair that only the browser tests are graded even though you're putting work into the other test suites. Here's my justification:

- The reality is, is that the model/controller/router/http tests are there as a guide to help you implement the infrastructure needed to support the end-user application. If I did not provide those tests for you, it would've been much harder to design the back-end implementation from scratch.
- When you're on the job, you're not going to get paid if only some the back-end implemention works but the front-end doesn't actually do anything. The customer is paying you for a fully functioning application.
- Since we got rid of the final project, this last assignment is acting as a _pseudo_ final project, so it needs to be more challenging. Though, I'm sure some would argue that A3 was still harder! 😉
