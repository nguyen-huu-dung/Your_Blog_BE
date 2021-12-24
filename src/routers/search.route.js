const express = require("express");
const SearchRouter = express.Router({ caseSensitive: true });
const searchController = require("../controllers/search.controller");

SearchRouter.get("/users", searchController.searchUsers);
SearchRouter.get("/forum_blogs", searchController.searchForumBlogs);
SearchRouter.get("/blogs", searchController.searchBlogs);
module.exports = SearchRouter;
