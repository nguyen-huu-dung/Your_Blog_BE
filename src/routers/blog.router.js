const express = require('express');
const BlogRouter = express.Router({caseSensitive: true});
const blogController = require('../controllers/blog.controller');

BlogRouter.get('/', blogController.getBlogsUser);
BlogRouter.get('/:slug_blog', blogController.getBlog);
BlogRouter.post('/', blogController.createNewBlog);
BlogRouter.put('/change_image/:slug_blog', blogController.changeBlogImage);
BlogRouter.put('/:slug_blog', blogController.updateBlog);
BlogRouter.delete('/:slug_blog', blogController.deleteBlog);

module.exports = BlogRouter;