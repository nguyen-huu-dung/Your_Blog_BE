const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { loginValidate } = require("../utils/validates/account.validate");
const json_key = process.env.JSON_WEB_TOKEN_KEY || "jsonwebtokenkey";

class AccountController {
    /* 
        Login
        [POST] /login
    */
    async login(req, res) {
        try {
            // validate
            const { error, value } = loginValidate(req.body);
            if(error) return res.status(400).json({data: {}, message: error.details[0].message, success: false});

            // check username exists
            const findUser = await UserModel.findOne({username: value.username});
            if(!findUser) return res.status(401).json({data: {}, message: "Account or Password is not correct", success: false});

            // check password
            const checkPassword = bcrypt.compareSync(value.password, findUser.password);
            if(!checkPassword) return res.status(401).json({data: {}, message: "Account or Password is not correct", success: false});

            // json web token
            const token = jwt.sign({id: findUser._id, slug: findUser.slug}, json_key, {expiresIn: '24h'});

            // save database
            const newToken = new TokenModel({user: findUser._id, token});
            await newToken.save();

            // return token for client
            res.status(200).json({data: {slug: findUser.slug, role: findUser.role, token}, message: "Login success", success: true});
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
   }

   /* 
        Logout
        [POST] /logout
   */
    async logout(req, res) {
        try {
            const token = req.header('token');
            await TokenModel.findOneAndUpdate({token}, {status: "deleted"});
            res.status(200).json({data: {}, message: "Logout success", success: true});
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
  }
}

module.exports = new AccountController;