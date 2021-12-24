const ForumBlogModel = require("../models/forumBlog.model");
const BlogModel = require("../models/blog.model");
const UserModel = require("../models/user.model");
const LikeModel = require('../models/like.model');
const CommentModel = require('../models/comment.model');
const { removeVietnameseTones } = require("../utils/helpers/supports");
const { checkStatusFriend } = require("./friend.controller");

const filterSearch = (array, attribute, keyword) => {
    return array.filter((item) => {
        return removeVietnameseTones(item[attribute].toLowerCase())
                .includes(removeVietnameseTones(keyword.toLowerCase()));
    });
};
class SearchController {
    /* 
        Search user
        [GET] /users?keyword= && page=numPage && size=numSize
    */
    async searchUsers(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const { keyword, page, size } = req.query;
            if(keyword === "") return res.status(200).json({data: {users: []}, message: "", success: true});
            const users = await UserModel.find().populate("avatar").select("-_id -__v -username -password");
            const filterUsers = filterSearch(users, "name", keyword);
            if(filterUsers.length > 0) {
                let resFilterUsers = [];
                if(!page || !size) {
                    resFilterUsers = await Promise.all(filterUsers.map(async (user) => {
                        const friend = await checkStatusFriend(id_user, user.slug);
                        return {...user._doc, avatar: user.avatar.path, friend};
                    }))
                    return res.status(200).json({data: {users: resFilterUsers, paging: {page: 1, size: filterUsers.length, totalRecords: filterUsers.length, totalPages: 1}}, message: "", success: true});
                }
            }
            return res.status(200).json({data: {users: []}, message: "", success: true});
        } catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /* 
        Search user
        [GET] /forumBlogs?page=numPage && size=numSize
    */
    async searchForumBlogs(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const { keyword, page, size } = req.query;
            if(keyword === "") return res.status(200).json({data: {blogs: []}, message: "", success: true});
            const forumBlogs = await ForumBlogModel.find({status: 'public'}).sort({created: -1}).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
            const filterForumBlogs = filterSearch(forumBlogs, "title", keyword);
            if(filterForumBlogs.length > 0) {
                let resFilterForumBlogs = [];
                if(!page || !size) {
                    resFilterForumBlogs = await Promise.all(filterForumBlogs.map(async (blog) => {
                        const totalLikes = await LikeModel.countDocuments({blog: blog._id});
                        const totalComments = await CommentModel.countDocuments({blog: blog._id});
                        // check user token like blog
                        const findLike = await LikeModel.findOne({blog: blog._id, user: id_user});
                        const liked = findLike ? true : false;
                        return { 
                            blog, 
                            likes: { paging: {page: 1, size: totalLikes, totalRecords: totalLikes, totalPages: 1}, liked}, 
                            comments: { paging: {page: 1, size: totalComments, totalRecords: totalComments, totalPages: 1} } }
                        }))
                    }
                return res.status(200).json({data: {forumBlogs: resFilterForumBlogs, paging: {page: 1, size: filterForumBlogs.length, totalRecords: filterForumBlogs.length, totalPages: 1}}, message: "", success: true});
            }
            return res.status(200).json({data: {forumBlogs: []}, message: "", success: true});
        } 
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /* 
        Search user
        [GET] /blogs?keyword= &&page=numPage && size=numSize
    */
    async searchBlogs(req, res) {
        try {
            const { keyword, page, size } = req.query;
            if(keyword === "") return res.status(200).json({data: {blogs: []}, message: "", success: true});
            const blogs = await BlogModel.find({status: 'public'}).populate('user').populate('image').select('-_id -__v');
            const filterBlogs = filterSearch(blogs, "title", keyword);
            if(filterBlogs.length > 0) {
                let resFilterBlogs = [];
                if(!page || !size) {
                    resFilterBlogs = filterBlogs.map((blog) => {
                        return {...blog._doc, user: { slug: blog.user.slug, name: blog.user.name }, image: blog.image.path};
                    })
                    return res.status(200).json({data: {blogs: resFilterBlogs, paging: {page: 1, size: filterBlogs.length, totalRecords: filterBlogs.length, totalPages: 1}}, message: "", success: true});
                }
            }
            return res.status(200).json({data: {blogs: []}, message: "", success: true});
        } 
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}


module.exports = new SearchController;
