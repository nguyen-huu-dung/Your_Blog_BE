const express = require('express');
const commentController = require('../controllers/comment.controller');
const forumBlogController = require('../controllers/forumBlog.controller');
const likeController = require('../controllers/like.controller');
const ForumBlogRouter = express.Router({caseSensitive: true});

ForumBlogRouter.get('/', forumBlogController.getManyForumBlogs);
ForumBlogRouter.get('/:id_forum_blog', forumBlogController.getForumBlog);
ForumBlogRouter.post('/', forumBlogController.createForumBlog);
ForumBlogRouter.put('/:id_forum_blog', forumBlogController.updateForumBlog);
ForumBlogRouter.delete('/:id_forum_blog', forumBlogController.deleteForumBlog);

// likes
ForumBlogRouter.get('/:id_forum_blog/likes', likeController.getManyLikeBlogs);
ForumBlogRouter.put('/:id_forum_blog/likes', likeController.likeOrDislike);

// comments
ForumBlogRouter.get('/:id_forum_blog/comments', commentController.getManyComments);
ForumBlogRouter.post('/:id_forum_blog/comments', commentController.uploadComment);
ForumBlogRouter.put('/:id_forum_blog/comments/:id_comment', commentController.updateComment);
ForumBlogRouter.delete('/:id_forum_blog/comments/:id_comment', commentController.deleteComment);


module.exports = ForumBlogRouter;