const jwt = require('jsonwebtoken');
const TokenModel = require('../../models/token.model');
const json_key = process.env.JSON_WEB_TOKEN_KEY || "jsonwebtokenkey";

const checkTokenMiddle = async (req, res, next) => {
    const token = req.header('token');
    if(!token) return res.status(401).json({data: {}, message: "Missing token", success: false});
    try{
        // verify token
        const decoded = jwt.verify(token, json_key);
        // check token exists database
        const findToken = await TokenModel.findOne({token, status: "active"});
        if(!findToken) return res.status(401).json({data: {}, message: "Token is not correct", success: false});
        res.locals.decoded = decoded;
        next();
    }
    catch {
        res.status(401).json({data: {}, message: "Token is not correct", success: false});
    }
} 

// // use get user /?user=slug_user
// const authorMiddle = async (req, res, next) => {
//     const { slug } = res.locals.decoded;
//     const slug_user = req.query.user || slug;
//     if (slug_user === slug)  access = 'owner';
//     else  access = 'not owner';
//     res.locals.decoded = {...res.locals.decoded, access};
//     next();
// }

module.exports = { checkTokenMiddle };