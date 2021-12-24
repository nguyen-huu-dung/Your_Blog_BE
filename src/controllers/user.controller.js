const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const ImageModel = require('../models/image.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { uploadCloud, cloudinary } = require('../core/config/upload_image.config');
const { createUserValidate, updateUserValidate, validateChangePassword } = require("../utils/validates/user.validate");
const { checkStatusFriend } = require('./friend.controller');
const saltRounds = process.env.SALT_ROUNDS || 10;
const json_key = process.env.JSON_WEB_TOKEN_KEY || "jsonwebtokenkey";

class UserController {
    /*
        Get all users
        [GET] /users
    */
    getAllUsers(req, res) {}

    /*
        Get user
        [GET] /users/user_info?user=slug_user
    */
    async getUser(req, res) {
        try {   
            const { id: id_user, slug: slug_token } = res.locals.decoded;
            const slug_user = req.query.user || slug_token;
            // find user
            const findUserInfo = await UserModel.findOne({slug: slug_user}).populate('avatar');
            if(!findUserInfo) return res.status(404).json({data: {}, message: "User is not exists", success: false});
            const { username, slug, name, email, phone, avatar, address, country } = findUserInfo;
            const friend = await checkStatusFriend(id_user, slug_user);
            if(slug_user === slug_token) {
                res.status(200).json({data: {username, slug, name, email, phone, avatar: avatar.path, address, country, friend}, message: "", success: true});
            }
            else {
                res.status(200).json({data: {slug, name, email, phone, avatar: avatar.path, address, country, friend}, message: "", success: true})
            }
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Create new user
        [POST] /users
    */

    async createNewUser(req, res) {
        try{
            // validate 
            const { error, value } = createUserValidate(req.body);
            if(error) return res.status(400).json({data: {} , message: error.details[0].message, success: false});

            // check exists username
            const findUsername = await UserModel.findOne({username: value.username});
            if(findUsername) return res.status(400).json({data: {} , message: "Username is exists", success: false});

            // check exists email
            const findEmail = await UserModel.findOne({email: value.email});
            if(findEmail) return res.status(400).json({data: {}, message: "Email is exists", success: false});

            // check password vs password confirm
            if(value.password !== value.password_confirm) return res.status(400).json({data: {} , message: "Password confirm is not correct", success: false});

            // hash password
            const salt = bcrypt.genSaltSync(Number(saltRounds));
            const password = bcrypt.hashSync(value.password, salt);

            // save user
            const newUser = new UserModel(value);
            newUser.password = password;
            const saveUser = await newUser.save();

            // return client
            res.status(200).json({data: {username: saveUser.username, slug: saveUser.slug}, message: "Create user success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Update user info
        [PUT] /users/user_info
    */
    async updateUserInfo(req, res) {
        try{
            const { id: user_id, slug: slug_user } = res.locals.decoded;
            const { error, value } = updateUserValidate(req.body);
            if(error) return res.status(400).json({data: {}, message: error.details[0].message, success: false});

            // find user
            const findUser = await UserModel.findById(user_id);
            if(!findUser) res.status(404).json({data: {}, message: "User is not exists", success: false});

            // check email
            if(value.email && value.email !== findUser.email) {
                // check exists email
                const findEmail = await UserModel.findOne({email: value.email});
                if(findEmail) return res.status(400).json({data: {}, message: "Email is exists", success: false});
            } 

            // save update user info
            const updateUser = await UserModel.findByIdAndUpdate(user_id, {...value, updated: Date.now()}, {new: true}).select('-_id -__v -password').populate('avatar');
            let token = "";
            // check name
            if(value.name && value.name !== findUser.name) {
                // json web token
                token = jwt.sign({id: findUser._id, slug: updateUser.slug}, json_key, {expiresIn: '24h'});

                // save database
                const newToken = new TokenModel({user: findUser._id, token});
                await newToken.save();

                // delete old token
                await TokenModel.findOneAndUpdate({token: req.header('token')}, {status: "deleted"});
            }
            else {
                token = req.header('token');
            }
            const { username, slug, name, email, phone, avatar, address, country } = updateUser;
            res.status(200).json({data: {user: {username, slug, name, email, phone, avatar: avatar.path, address, country}, token}, message: "Update user info success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }


    /*
        Change password user
        [PUT] /users/change_password
    */
    async changePasswordUser(req, res) {
        try{
            const { id: user_id, slug: slug_user } = res.locals.decoded;
            // validate data update
            const { error, value } = validateChangePassword(req.body);
            if(error) return res.status(400).send({data: {}, message: error.details[0].message, success: false});

            // find user
            const findUser = await UserModel.findById(user_id);
            if(!findUser) res.status(404).json({data: {}, message: "User is not exists", success: false});

            // check current password
            const checkPassword = bcrypt.compareSync(value.current_password, findUser.password);
            if(!checkPassword) return res.status(400).send({data: {}, message: 'Current password is not correct', success: false});

            // check password vs password confirm
            if(value.new_password !== value.confirm_password) return res.status(400).json({data: {} , message: "Password confirm is not correct", success: false});

            // hash new password
            const salt = bcrypt.genSaltSync(Number(saltRounds));
            const password = bcrypt.hashSync(value.new_password, salt);

            // save update password
            await UserModel.findByIdAndUpdate(user_id, {password, updated: Date.now()});
            res.status(200).json({data: {}, message: "Change password success", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    /*
        Change avatar user
        [PUT] /users/change_avatar
    */
    async changeUserAvatar(req, res) {
        try {
            uploadCloud(req, res, async err => {
                const { id: user_id } = res.locals.decoded;
                // find user
                const findUser = await UserModel.findById(user_id).populate('avatar');
                if(!findUser) res.status(404).json({data: {}, message: "User is not exists", success: false});
                
                console.log(err);
                if(err) return res.status(400).json({data: {}, message: "Only .png, .jpg and .jpeg format allowed!", success: false});
                if(!req.file) return res.status(400).json({data: {}, message: "Image is required", success: false});

                // check status avatar
                if(findUser.avatar.type_image === "default") {
                    // create new image model
                    const newImage = new ImageModel(req.file);
                    newImage.type_image = "owner";
                    newImage.created = Date.now();
        
                    // save database
                    const saveImage = await newImage.save();
                    await UserModel.findByIdAndUpdate(findUser._id, { avatar: saveImage._id });
                }
                else {
                    await cloudinary.uploader.destroy(findUser.avatar.filename);
                    // update avatar
                    await ImageModel.findByIdAndUpdate(findUser.avatar._id, { ...req.file, updated: Date.now()})
                }
                res.status(200).json({data: {avatar_update: req.file.path}, message: "Update blog success", success: true});
            }) 
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}


module.exports = new UserController;