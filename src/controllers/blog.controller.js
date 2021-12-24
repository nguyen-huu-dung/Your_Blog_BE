const UserModel = require('../models/user.model');
const BlogModel = require('../models/blog.model');
const ImageModel = require('../models/image.model');
const { createBlogValidate, updateBlogValidate } = require("../utils/validates/blog.validate");
const { uploadCloud, cloudinary } = require('../core/config/upload_image.config');
const { checkStatusFriend } = require('./friend.controller');

class BlogController {

    /*
        Get all blogs
        [GET] /blogs?user=slug_user&&page=numPage&&size=numSize
    */
    async getBlogsUser(req, res) {
        try{
            const { id: user_id, slug: slug_token } = res.locals.decoded;
            const page = req.query.page;
            const size = req.query.size;
            const slug_user = req.query.user || slug_token;
            let blogs, countBlogs, resBlogs = [];
            if(slug_user === slug_token) {
                // get blogs
                if(!page || !size) {
                    blogs = await BlogModel.find({user: user_id, status: ['public', 'friend','private']}).populate('user').populate('image').select('-_id -__v');
                }
                else {
                    blogs = await BlogModel.find({user: user_id, status: ['public', 'friend','private']}).skip((page - 1) * size).limit(size).populate('user').populate('image').select('-_id -__v');
                    countBlogs = await BlogModel.countDocuments({user: user_id, status: ['public', 'friend','private']});
                }
            }
            else {
                // find user
                const findUser = await UserModel.findOne({slug: slug_user});
                if(!findUser) return res.status(404).json({data: {}, message: "User is not exists", success: false});

                // check status friend 
                const friend = await checkStatusFriend(user_id, slug_user);
                if(friend.status_friend === 'friend') {
                    // get blogs
                    if(!page || !size) {
                        blogs = await BlogModel.find({user: findUser._id, status: ['public', 'friend']}).populate('user').populate('image').select('-_id -__v');
                    }
                    else {
                        blogs = await BlogModel.find({user: findUser._id, status: ['public', 'friend']}).skip((page - 1) * size).limit(size).populate('user').populate('image').select('-_id -__v');
                        countBlogs = await BlogModel.countDocuments({user: findUser._id, status: ['public', 'friend']});
                    }
                }

                else {
                    // get blogs
                    if(!page || !size) {
                        blogs = await BlogModel.find({user: findUser._id, status: 'public'}).populate('user').populate('image').select('-_id -__v');
                    }
                    else {
                        blogs = await BlogModel.find({user: findUser._id, status: 'public'}).skip((page - 1) * size).limit(size).populate('user').populate('image').select('-_id -__v');
                        countBlogs = await BlogModel.countDocuments({user: findUser._id, status: 'public'});
                    }
                }
            }
            if(blogs.length > 0) {
                resBlogs = blogs.map((blog) => {
                    return {...blog._doc, user: { slug: blog.user.slug, name: blog.user.name}, image: blog.image.path};
                })
            }
            if(!page || !size) res.status(200).json({data: {blogs: resBlogs, paging: {page: 1, size: resBlogs.length, totalRecords: resBlogs.length, totalPages: 1}}, message:"", success:true});
            else res.status(200).json({data: {blogs: resBlogs, paging: {page, size: resBlogs.length, totalRecords: countBlogs, totalPages: Math.ceil(countBlogs/size)}}, message:"", success:true});

        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /*
        Get blog
        [GET] /blogs/:slug_blog?user=slug_user;
    */
    async getBlog(req, res) {
        try {
            const { id: user_id, slug: slug_token } = res.locals.decoded;
            const slug_user = req.query.user || slug_token;
            const slug_blog = req.params.slug_blog;
            // find user
            const findUser = await UserModel.findOne({slug: slug_user});
            if(!findUser) return res.status(404).json({data: {}, message: "User is not exists", success: false});
            // find blog
            const blog = await BlogModel.findOne({slug: slug_blog, user: findUser._id}).select('-_id -__v').populate('user').populate('image');
            if(!blog) return res.status(404).json({data: {}, message: "Blog is not exists", success: false}); 
            if(blog.status === 'deleted') return res.status(400).json({data: {}, message: "Blog is deleted", success: false}); // check blog deleted
            if(slug_user !== slug_token) {
                if(blog.status === 'private') return res.status(404).json({data: {}, message: "Blog is private, you do not have access", success: false}); // check user do not have access get blog
                // check status friend 
                const friend = await checkStatusFriend(user_id, slug_user);
                if(blog.status === 'friend' && friend.status_friend !== 'friend') {
                    return res.status(404).json({data: {}, message: "Blog is friend, you do not have access", success: false});
                }
            }
            res.status(200).json({data: {...blog._doc, user: { slug: blog.user.slug, name: blog.user.name }, image: blog.image.path}, message: "", success:true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /*
        Create new blog
        [POST] /blogs
    */
    async createNewBlog(req, res) {
        try {
            uploadCloud(req, res, async err => {
                const { id: user_id, slug: slug_user } = res.locals.decoded;
                const { title, description, status } = req.body;
                // validate req body
                const { error, value } = createBlogValidate({ title, description, status });
                if(error) return res.status(400).json({data: {} , message: error.details[0].message, success: false});
                if(err) return res.status(400).json({data: {}, message: "Only .png, .jpg and .jpeg format allowed!", success: false});
                // create new blog
                const newBlog = new BlogModel(value);
                newBlog.user = user_id;
                newBlog.created = Date.now();
                
                // check file image
                if(req.file) {
                    // create new image model
                    const newImage = new ImageModel(req.file);
                    newImage.type_image = "owner";
                    newImage.created = Date.now();
        
                    // save database
                    try {
                        const saveImage = await newImage.save();
                        newBlog.image = saveImage._id;
                    }
                    catch {
                        res.status(500).json({data: {}, message: "An error occurred when uploading image", success: false});
                    }
                }

                // save blog
                const saveBlog = await newBlog.save();
                res.status(200).json({data: {...saveBlog._doc, user: slug_user}, message: "Create new blog success", success: true});
            }) 
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /*
        Update blog info
        [PUT] /blogs/:slug_blog
    */
    async updateBlog(req, res) {
        try {
            const { id: user_id, slug: slug_user } = res.locals.decoded;
            const slug_blog = req.params.slug_blog;
            // validate req body
            const { error, value } = updateBlogValidate(req.body);
            if(error) return res.status(400).json({data: {} , message: error.details[0].message, success: false});
            // find blog
            const findBlog = await BlogModel.findOne({slug: slug_blog, user: user_id});
            if(!findBlog) return res.status(404).json({data: {}, message: "Blog is not exists or you do have not access", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // update blog
            const updateBlog = await BlogModel.findOneAndUpdate({slug: slug_blog, user: user_id}, {...value, updated: Date.now()}, {new: true}).select('-_id -__v').populate('user').populate('image');
            res.status(200).json({data: {...updateBlog._doc, user: { slug: updateBlog.user.slug, name: updateBlog.user.name }, image: updateBlog.image.path}, message: "Update blog success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Change image blog
        [PUT] /blogs/change_image/:slug_blog
    */
    async changeBlogImage(req, res) {
        try {
            uploadCloud(req, res, async err => {
                const { id: user_id } = res.locals.decoded;
                const slug_blog = req.params.slug_blog;
                // find blog
                const findBlog = await BlogModel.findOne({slug: slug_blog, user: user_id}).populate('image');
                if(!findBlog) return res.status(404).json({data: {}, message: "Blog is not exists or you do have not access", success: false});
                if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            
                if(err) return res.status(400).json({data: {}, message: "Only .png, .jpg and .jpeg format allowed!", success: false});
                if(!req.file) return res.status(400).json({data: {}, message: "Image is required", success: false});

                // check status image blog
                if(findBlog.image.type_image === "default") {
                    // create new image model
                    const newImage = new ImageModel(req.file);
                    newImage.type_image = "owner";
                    newImage.created = Date.now();
        
                    // save database
                    const saveImage = await newImage.save();
                    await BlogModel.findByIdAndUpdate(findBlog._id, { image: saveImage._id });
                }
                else {
                    await cloudinary.uploader.destroy(findBlog.image.filename);
                    // update image 
                    await ImageModel.findByIdAndUpdate(findBlog.image._id, { ...req.file, updated: Date.now()})
                }
                res.status(200).json({data: {image_update: req.file.path}, message: "Update blog success", success: true});
            }) 
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /*
        Delete blog
        [DELETE] /blogs/:slug_blog
    */
    async deleteBlog(req, res) {
        try {
            const { id: user_id } = res.locals.decoded;
            const slug_blog = req.params.slug_blog;
            // find blog
            const findBlog = await BlogModel.findOne({slug: slug_blog, user: user_id}).populate('image');
            if(!findBlog) return res.status(404).json({data: {}, message: "Blog is not exists or you do have not access", success: false});
            if(findBlog.status === 'deleted') return res.status(404).json({data: {}, message: "Blog is deleted", success: false});
            // delete blog
            // delete image blog
            if(findBlog.image.type_image === "owner") {
                await cloudinary.uploader.destroy(findBlog.image.filename);
                // delete image database
                await ImageModel.findByIdAndDelete(findBlog.image._id);
            }
            await BlogModel.findOneAndUpdate({slug: slug_blog, user: user_id}, {status: 'deleted', updated: Date.now()}, {new: true}).select('-_id -__v -user').populate('image');
            res.status(200).json({data: {}, message: "Delete blog success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}


module.exports = new BlogController;