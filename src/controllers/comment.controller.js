const ForumBlogModel = require('../models/forumBlog.model');
const CommentModel = require('../models/comment.model');
const UserModel = require('../models/user.model');
const { postNotify } = require('./notify.controller');

class CommentController {

    /*
        Get many comments
        [GET] /forum_blogs/:id_forum_blog/comments?page=num_page&&size=num_size
    */
    async getManyComments (req, res) {
        try {
            const id_blog = req.params.id_forum_blog;
            const page = req.query.page;
            const size = req.query.size;
            // check blog exists
            const findBlog = await ForumBlogModel.findById(id_blog);
            if(!findBlog) return res.status(404).json({data: {}, message: "Forum blog is not exists", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // get many comment
            let comments, countComments;
            if(!page || !size) {
                comments = await CommentModel.find({blog: id_blog})
                .populate({path: 'user', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v');
                res.status(200).json({data: {comments, paging: {page: 1, size: comments.length, totalRecords: comments.length, totalPages: 1}}, message: "", success: true});
            }
            else {
                comments = await CommentModel.find({blog: id_blog}).skip((page - 1) * size).limit(size)
                .populate({path: 'user', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v');
                // get count comments
                countComments = await CommentModel.countDocuments({blog: id_blog});
                res.status(200).json({data: {comments, paging: {page, size: comments.length, totalRecords: countComments, totalPages: Math.ceil(countComments/size)}}, message: "", success: true});
            }
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Upload comment
        [POST] /forum_blogs/:id_forum_blog/comments
    */
   async uploadComment (req, res) {
        try {
            const { id: id_user, slug: slug_user } = res.locals.decoded;
            const id_blog = req.params.id_forum_blog;
            const content = req.body.content;
            if(!content) return res.status(400).json({data: {}, message: "Content is required", success: false});
            // check blog exists
            const findBlog = await ForumBlogModel.findById(id_blog).populate('user');
            if(!findBlog) return res.status(404).json({data: {}, message: "Forum blog is not exists", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // create new comment
            const newComment = new CommentModel();
            newComment.user = id_user;
            newComment.blog = id_blog;
            newComment.created = Date.now();
            newComment.content = content;
            // save comment
            const saveComment =  await newComment.save();
            // find user
            const user = await UserModel.findOne({slug: slug_user}).populate({ path: "avatar", select: '-_id path' }).select('-_id -username -password -__v');
            // post notify
            if(id_user === String(findBlog.user._id)) 
               return res.status(200).json({data: {...saveComment._doc, user, notify: null}, message: "Comment success", success: true});
            const newNotifyComment = await postNotify(id_user, findBlog.user._id, "comment", id_blog);
            res.status(200).json({data: {...saveComment._doc, user, notify: {...newNotifyComment._doc, from: user, to: findBlog.user.slug}}, message: "Comment success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
   }

    /*
        Update comment
        [PUT] /forum_blogs/:id_forum_blog/comments/:id_comment
    */
    async updateComment (req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const { id_forum_blog: id_blog, id_comment } = req.params;
            const content = req.body.content;
            if(!content) return res.status(400).json({data: {}, message: "Content is required", success: false});
            // check comment
            const findComment = await CommentModel.findOne({_id: id_comment, blog: id_blog});
            if(!findComment) return res.status(404).json({data: {}, message: "Comment blog is not exists", success: false});

            // check user 
            if(id_user !== String(findComment.user)) return res.status(401).json({data: {}, message: "You do not have edit comment", success: false});
            // edit comment
            const editComment = await CommentModel.findOneAndUpdate({_id: id_comment, blog: id_blog}, {content, updated: Date.now()}, {new: true}).populate({path: 'user', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v');
            res.status(200).json({data: {...editComment._doc}, message: "Edit comment success", success: true});
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Delete comment
        [DELETE] /forum_blogs/:id_forum_blog/comments/:id_comment
    */
    async deleteComment (req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const { id_forum_blog: id_blog, id_comment } = req.params;
            // check comment
            const findComment = await CommentModel.findOne({_id: id_comment, blog: id_blog}).populate({path: 'blog', select: 'user'});
            if(!findComment) return res.status(404).json({data: {}, message: "Comment blog is not exists", success: false});
            // check user 
            if(id_user !== String(findComment.user) && id_user !== String(findComment.blog.user)) return res.status(401).json({data: {}, message: "You do not have delete comment", success: false});
            // delete comment
            await CommentModel.findOneAndDelete({_id: id_comment, blog: id_blog});
            res.status(200).json({data: {}, message: "Delete comment success", success: true});
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}


module.exports = new CommentController;