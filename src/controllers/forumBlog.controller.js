const UserModel = require('../models/user.model');
const ForumBlogModel = require('../models/forumBlog.model');
const LikeModel = require('../models/like.model');
const CommentModel = require('../models/comment.model');
const { createForumBlogValidate, updateForumBlogValidate } = require("../utils/validates/blog.validate");

class ForumController {

    /*
        Get many forum blogs
        [GET] /forum_blogs?page=num_page&&size=num_size
    */
    async getManyForumBlogs(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const page = req.query.page;
            const size = req.query.size;
            const type = req.query.type;
            let getBlogs, countBlogs, resBlogs = [];
            if(!page || !size) {
                if(type === "user") {
                    getBlogs = await ForumBlogModel.find({status: 'public', user: id_user}).sort({created: -1}).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
                }
                else {
                    getBlogs = await ForumBlogModel.find({status: 'public'}).sort({created: -1}).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
                }
                if(getBlogs.length > 0) {
                    resBlogs = await Promise.all(getBlogs.map(async (blog) => {
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
                res.status(200).json({data: {forumBlogs: resBlogs, paging: {page: 1, size: getBlogs.length, totalRecords: getBlogs.length, totalPages: 1}}, message: "", success: true});
            }
            else {
                if(type === "user") {
                    const { id: id_user } = res.locals.decoded;
                    getBlogs = await ForumBlogModel.find({status: 'public', user: id_user}).sort({created: -1}).skip((page - 1) * size).limit(size).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
                    // get count
                    countBlogs = await ForumBlogModel.countDocuments({status: 'public', user: id_user});
                }
                else {
                    getBlogs = await ForumBlogModel.find({status: 'public'}).sort({created: -1}).skip((page - 1) * size).limit(size).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
                    // get count
                    countBlogs = await ForumBlogModel.countDocuments({status: 'public'});
                }
                if(getBlogs.length > 0) {
                    resBlogs = await Promise.all(getBlogs.map(async (blog) => {
                        const totalLikes = await LikeModel.countDocuments({blog: blog._id});
                        const totalComments = await CommentModel.countDocuments({blog: blog._id});
                        // check user token like blog
                        const findLike = await LikeModel.findOne({blog: blog._id, user: id_user});
                        const liked = findLike ? true : false;
                        return { 
                            blog, 
                            likes: { paging: {page: 1, size: totalLikes, totalRecords: totalLikes, totalPages: 1}, liked }, 
                            comments: { paging: {page: 1, size: totalComments, totalRecords: totalComments, totalPages: 1} } }
                        }))
                    }
                res.status(200).json({data: {forumBlogs: resBlogs, paging: {page, size: getBlogs.length, totalRecords: countBlogs, totalPages: Math.ceil(countBlogs/size)}}, message: "", success: true});
            }
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Get details forum blog
        [GET] /forum_blogs/:id_forum_blog
    */
    async getForumBlog(req, res) {
        try {
            const id_blog = req.params.id_forum_blog;
            const blog = await ForumBlogModel.findById(id_blog).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
            if(!blog) return res.status(404).json({data: {}, message: "Forum blog is not exists", success: false});
            if(blog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            const totalLikes = await LikeModel.countDocuments({blog: blog._id});
            const totalComments = await CommentModel.countDocuments({blog: blog._id});
            res.status(200).json({data: {blog, 
                likes: { paging: {page: 1, size: totalLikes, totalRecords: totalLikes, totalPages: 1} }, 
                comments: { paging: {page: 1, size: totalComments, totalRecords: totalComments, totalPages: 1} }},
                message: "", success: true});
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Post forum blog
        [POST] /forum_blogs
    */
    async createForumBlog(req, res) {
        try {  
            const { id: user_id, slug: slug_user } = res.locals.decoded;
            // validate req body
            const { error, value } = createForumBlogValidate(req.body);
            if(error) return res.status(400).json({data: {}, message: error.details[0].message, success: false});
            // create new forum
            const newBlog = new ForumBlogModel(value);
            newBlog.user = user_id;
            newBlog.created = Date.now();

            // save blog
            const saveBlog = await newBlog.save();
            // find user
            const user = await UserModel.findOne({slug: slug_user}).populate({ path: "avatar", select: '-_id path' }).select('-_id -username -password -__v');
            res.status(200).send({data: {blog: {...saveBlog._doc, user}, 
                likes: { paging: {page: 1, size: 0, totalRecords: 0, totalPages: 1} }, 
                comments: { paging: {page: 1, size: 0, totalRecords: 0, totalPages: 1} }}, 
                message: "Create new forum blog success", success: true});
        }
        catch(err){
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Update forum blog
        [PUT] /forum_blogs/:id_forum_blog
    */
    async updateForumBlog(req, res) {
        try {  
            const { id: user_id, slug: slug_user } = res.locals.decoded;
            const id_blog = req.params.id_forum_blog;
            // validate req body
            const { error, value } = updateForumBlogValidate(req.body);
            if(error) return res.status(400).json({data: {} , message: error.details[0].message, success: false});
            // find blog
            const findBlog = await ForumBlogModel.findOne({_id: id_blog, user: user_id});
            if(!findBlog) return res.status(404).json({data: {}, message: "Blog is not exists or you do have not access", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // update blog
            const updateBlog = await ForumBlogModel.findOneAndUpdate({_id: id_blog, user: user_id}, {...value, updated: Date.now()}, {new: true}).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
            const totalLikes = await LikeModel.countDocuments({blog: findBlog._id});
            const totalComments = await CommentModel.countDocuments({blog: findBlog._id});
            res.status(200).json({data: {blog: updateBlog,
                likes: { paging: {page: 1, size: totalLikes, totalRecords: totalLikes, totalPages: 1} }, 
                comments: { paging: {page: 1, size: totalComments, totalRecords: totalComments, totalPages: 1} }}, 
                message: "Update forum blog success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Delete forum blog
        [DELETE] /forum_blogs/:id_forum_blog
    */
    async deleteForumBlog(req, res) {
        try {
            const { id: user_id } = res.locals.decoded;
            const id_blog = req.params.id_forum_blog;
            // find blog
            const findBlog = await ForumBlogModel.findOne({_id: id_blog, user: user_id});
            if(!findBlog) return res.status(404).json({data: {}, message: "Blog is not exists or you do have not access", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // update delete blog
            await ForumBlogModel.findOneAndUpdate({_id: id_blog, user: user_id}, {status: 'deleted', updated: Date.now()}, {new: true}).select('-__v').populate({path: "user", select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }});
            // delete like and comment
            await LikeModel.deleteMany({blog: id_blog});
            await CommentModel.deleteMany({blog: id_blog});
            res.status(200).json({data: {}, message: "Delete blog success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}


module.exports = new ForumController;