const LikeModel = require('../models/like.model');
const ForumBlogModel = require('../models/forumBlog.model');
const { checkStatusFriend } = require('./friend.controller');

class LikeController {
    /*
        Get many like
        [GET] /forum_blogs/:id_forum_blog/likes?page=num_page&size=num_size
    */
    async getManyLikeBlogs(req, res) {
        try{
            const { id: id_user } = res.locals.decoded;
            const id_blog = req.params.id_forum_blog;
            const page = req.query.page;
            const size = req.query.size;
            // check blog exists
            const findBlog = await ForumBlogModel.findById(id_blog);
            if(!findBlog) return res.status(404).json({data: {}, message: "Forum blog is not exists", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // check user token like blog
            const findLike = await LikeModel.findOne({blog: id_blog, user: id_user});
            const liked = findLike ? true : false;
            let likeUsers, countLikes, resLikeUsers = [];
            if(!page || !size) {
                likeUsers = await LikeModel.find({blog: id_blog}).populate({path: 'user', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-_id -__v');
                if(likeUsers.length > 0) {
                    resLikeUsers = await Promise.all(likeUsers.map(async (like) => {
                        const friend = await checkStatusFriend(id_user, like.user.slug);
                        return {...like._doc, friend};
                    }))
                }
                res.status(200).json({data: { likeUsers: resLikeUsers, paging: {page: 1, size: likeUsers.length, totalRecords: likeUsers.length, totalPages: 1}, liked}, message: "", success: true});
            }
            else {
                likeUsers = await LikeModel.find({blog: id_blog}).skip((page - 1) * size).limit(size).populate({path: 'user', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-_id -__v');
                if(likeUsers.length > 0) {
                    resLikeUsers = await Promise.all(likeUsers.map(async (like) => {
                        const friend = await checkStatusFriend(id_user, like.user.slug);
                        return {...like._doc, friend};
                    }))
                }
                // get count like blog
                countLikes = await LikeModel.countDocuments({blog: id_blog});
                res.status(200).json({data: { likeUsers: resLikeUsers, paging: {page, size: likeUsers.length, totalRecords: countLikes, totalPages: Math.ceil(countLikes/size)}, liked}, message: "", success: true});
            }
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Like or dislike
        [PUT] /forums_blogs/:id_forum_blog/likes
    */
    async likeOrDislike(req, res) {
        try{
            const { id: id_user } = res.locals.decoded;
            const id_blog = req.params.id_forum_blog;
            const type = req.body.type;
            // check blog exists
            const findBlog = await ForumBlogModel.findById(id_blog);
            if(!findBlog) return res.status(404).json({data: {}, message: "Forum blog is not exists", success: false});
            if(type === 'like') {
                // check liked
                const findLike = await LikeModel.findOne({blog: id_blog, user: id_user});
                if(findLike) return res.status(400).json({data: {}, message: "User liked blog", success: false});
                // create new like
                const newLike = new LikeModel();
                newLike.user = id_user;
                newLike.blog = id_blog;
                newLike.time = Date.now();
                // save Like
                await newLike.save();
                res.status(200).json({data: {}, message: "Like blog success", success: true});
            }
            else if (type === 'unlike') {
                await LikeModel.findOneAndDelete({blog: id_blog, user: id_user});
                res.status(200).json({data: {}, message: "Unlike blog success", success: true});
            }
            else res.status(400).json({data: {}, message: "Type is like or unlike, is required", success: false});
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}


module.exports = new LikeController;
