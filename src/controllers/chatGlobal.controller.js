const ChatGlobalModel = require("../models/chatGlobal.model");
const UserModel = require("../models/user.model");

class ChatGlobalController {

    /*
        Get message
        [GET] /chat_globals?roomName
    */
    async getMessagesChatGlobal(req, res) {
        try {
            const { id: id_user, slug: slug_user } = res.locals.decoded;
            const roomName = req.query.roomName;
            if(!roomName) return res.status(400).json({data: {}, message: "roomName is required", success: false});
            // get messages
            const getMessages = await ChatGlobalModel.find({roomChat: roomName}).sort({created: -1}).limit(100).populate({path: 'user', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v');
            let resMessages = [];
            if(getMessages.length > 0) {
                const reverseMessages = await getMessages.reverse();
                resMessages = reverseMessages.map((message, index) => {
                    // let isMessageBefore = false;
                    // let isMessageAfter = false;
                    // if(index > 0) {
                    //     if(reverseMessages[index-1].user.slug === message.user.slug) isMessageBefore = true;
                    // }
                    // if(index < getMessages.length - 1) {
                    //     if(message.user.slug === reverseMessages[index+1].user.slug)  isMessageAfter = true;
                    // }
                    let type = "receiveMessage";
                    if(message.user.slug === slug_user) type = "sendMessage";
                    return {...message._doc, type};
                })
            }
            res.status(200).json({data: {messages: resMessages}, message:"", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /**
        Post message
        [POST] /chat_globals?roomName 
    */
    async postMessagesChatGlobal(req, res) {
        try {
            const { id: id_user, slug: slug_user } = res.locals.decoded;
            const roomName = req.query.roomName;
            if(!roomName) return res.status(400).json({data: {}, message: "roomName is required", success: false});
            // create new message
            const newMessage = new ChatGlobalModel();
            newMessage.user = id_user;
            newMessage.message = req.body.message;
            newMessage.roomChat = roomName;
            newMessage.created = Date.now();
            const saveMessage = await newMessage.save();
            // find user
            const user = await UserModel.findOne({slug: slug_user}).populate({ path: "avatar", select: '-_id path' }).select('-_id -username -password -__v'); 
            res.status(200).json({data: {...saveMessage._doc, user, type: "sendMessage"}, message:"", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}

module.exports = new ChatGlobalController;