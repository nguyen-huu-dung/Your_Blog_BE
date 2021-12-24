const FriendModel = require('../models/friend.model');
const InviteModel = require('../models/inviteFriend.model');
const UserModel = require('../models/user.model');
class FriendController {

    /*
        Get friends user  
        [GET] /friends?page=numPage&&size=numSize
    */
    async getFriends(req, res) {
        try {
            const { id: id_user, slug: slug_user } = res.locals.decoded;
            const page = req.query.page;
            const size = req.query.size;
            let friends, countFriends, resFriends = [];
            if(!page || !size) {
                friends = await FriendModel.find({users: {"$all": [id_user]}}).populate({path: 'users', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v');
            }
            else {
                friends = await FriendModel.find({users: {"$all": [id_user]}}).skip((page - 1) * size).limit(size).populate({path: 'users', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v');
                // get count friends
                countFriends = await FriendModel.countDocuments({users: {"$all": [id_user]}});
            }
            // format response
            if(friends.length > 0) {
                resFriends = friends.map((friend) => {
                    const user = friend.users.filter((user) => user.slug !== slug_user);
                    return {...user[0]._doc, created: friend.created, friend: {status_friend: "friend", id_friend: friend._id}};
                })
            }
            if(!page || !size ) res.status(200).json({data: {friends: resFriends, paging: {page: 1, size: resFriends.length, totalRecords: resFriends.length, totalPages: 1}}, message: "", success: true});
            else res.status(200).json({data: {friends: resFriends, paging: {page, size: resFriends.length, totalRecords: countFriends, totalPages: Math.ceil(countFriends/size)}}, message: "", success: true});
        }
        catch(err){
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Get invites friend
        [GET] /invite_friends?type="from"or"to"&&page=numPage&&size=numSize
    */ 
    async getInviteFriends(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;     
            const page = req.query.page;
            const size = req.query.size; 
            const type = req.query.type;
            if(!type || (type !== 'from' && type !== 'to')) return res.status(400).json({data: {}, message: "Type is required, equals from or to", success: false});
            let invites, countInvites, resInvites = [];
            if(!page || !size) {
                if(type === 'from') {
                    invites = await InviteModel.find({from: id_user}).sort({created: -1}).populate({path: 'to', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v -from');
                }
                else if (type === 'to') {
                    invites = await InviteModel.find({to: id_user}).sort({created: -1}).populate({path: 'from', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v -to');
                }
            }
            else {
                if(type === 'from') {
                    invites = await InviteModel.find({from: id_user}).sort({created: -1}).skip((page - 1) * size).limit(size).populate({path: 'to', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v -from');
                    // get count invites
                    countInvites = await InviteModel.countDocuments({from: id_user});
                }
                else if (type === 'to') {
                    invites = await InviteModel.find({to: id_user}).sort({created: -1}).skip((page - 1) * size).limit(size).populate({path: 'from', select: '-_id name slug avatar', populate: {path: 'avatar', select: '-_id path'}}).select('-__v -to');
                    // get count invites
                    countInvites = await InviteModel.countDocuments({to: id_user});
                }
                
            }
            // format invite
            if(invites.length > 0) {
                if(type === 'from') {
                    resInvites = invites.map((invite) => {
                        return {...invite.to._doc, created: invite.created, friend: { status_friend: "inviteFrom",  id_invite: invite._id}};
                    })
                }
                else if(type === 'to') {
                    resInvites = invites.map((invite) => {
                        return {...invite.from._doc, created: invite.created, friend: { status_friend: "inviteTo",  id_invite: invite._id}};
                    })
                }
            }
            if(!page || !size) res.status(200).json({data: {invites: resInvites, paging: {page: 1, size: resInvites.length, totalRecords: resInvites.length, totalPages: 1}}, message: "", success: true});
            else res.status(200).json({data: {invites: resInvites, paging: {page, size: resInvites.length, totalRecords: countInvites, totalPages: Math.ceil(countInvites/size)}}, message: "", success: true});
        }
        catch (err){
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    } 

    /*
        Invite friend
        [POST] /invite_friends 
    */
    async inviteFriend(req, res) {
        try {
            const { id: id_user_from, slug: slug_user_from } = res.locals.decoded;
            const slug_user_to = req.body.toSlugUser;
            if(slug_user_from === slug_user_to) return res.status(400).json({data: {}, message: "Could not invite yourself", success: false});
            // find user to
            const findUserTo = await UserModel.findOne({slug: slug_user_to});
            if(!findUserTo) return res.status(400).json({data: {}, message: "User who is invite is not exists", success: false});
            // check invite friend
            const findInviteFrom = await InviteModel.findOne({from: id_user_from, to: findUserTo._id});
            const findInviteTo = await InviteModel.findOne({from: findUserTo._id, to: id_user_from});
            if(findInviteFrom || findInviteTo) return res.status(400).json({data: {}, message: "Existed invite between 2 person before", success: false})
            // check friend
            const findFriend = await FriendModel.findOne({users: { "$all": [id_user_from, findUserTo._id]}});
            if(findFriend) return res.status(400).json({data: {}, message: "Already friend", success: false});
            // add new invite friend
            const newInvite = new InviteModel();
            newInvite.from = id_user_from;
            newInvite.to = findUserTo._id;
            newInvite.created = Date.now();
            // save invite
            await newInvite.save();
            res.status(200).json({data:{}, message: "Invite success", success: true});
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Accept invite friend
        [PUT] /invite_friends/:id_invite
    */
    async acceptInviteFriend(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const id_invite = req.params.id_invite;
            // check invite
            const findInvite = await InviteModel.findOne({_id: id_invite, to: id_user});
            if(!findInvite) return res.status(400).json({data: {}, message: "Invite is not exists or you do not have access", success: false});
            // accept invite
            const newFriend = new FriendModel();
            newFriend.users = [findInvite.from, findInvite.to];
            newFriend.created = Date.now();
            // save friend and delete invite
            await newFriend.save();
            await InviteModel.findByIdAndRemove(findInvite._id);
            res.status(200).json({data: {}, message: "Add friend success", success: true});
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Cancel invite friend
        [DELETE] /invite_friends/:id_invite
    */

    async cancelInviteFriend(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const id_invite = req.params.id_invite;
            // check invite
            const findInviteFrom = await InviteModel.findOne({_id: id_invite, from: id_user});
            const findInviteTo = await InviteModel.findOne({_id: id_invite, to: id_user});
            if(!findInviteFrom && !findInviteTo) return res.status(400).json({data: {}, message: "Invite is not exists you do not have access", success: false});
            // delete invite
            await InviteModel.findByIdAndRemove(id_invite);
            res.status(200).json({data: {}, message: "Cancel invite success", success: true});
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
    
    /*
        Delete friend
        [DELETE] /friends/:id_friend
    */
    async cancelFriend(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const id_friend = req.params.id_friend;
            // check friend
            const findFriend = await FriendModel.findOne({_id: id_friend, users: { "$all": [id_user]}});
            if(!findFriend) return res.status(400).json({data: {}, message: "Friend is not exists or You do have not access", success: false});
            // delete friend
            await FriendModel.findByIdAndRemove(id_friend);
            res.status(200).json({data: {}, message: "Delete friend success", success: true});
        }
        catch{
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Get status friends (owner, friend, inviteFrom, inviteTo, nothing)
        [GET] /friends/status_friend/:slug_user
    */
    async checkStatusFriendApi(req, res) {
        try {
            const { id: id_user_token } = res.locals.decoded;
            const slug_user_check = req.params.slug_user;
            const findUserCheck = await UserModel.findOne({slug: slug_user_check});
            if(!findUserCheck) return res.status(404).json({data: {}, message: "User is not exists", success: false});
            const friend = await checkStatusFriend(id_user_token, slug_user_check);
            res.status(200).json({data: {friend}, message: "", success: true});
        }
        catch(err) {
            console.log(err);
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}

// function check status friend (owner,friend, inviteFrom, inviteTo, nothing)
const checkStatusFriend = async (id_user_token, slug_user_check) => {
    try {
        // find user check
        const findUserCheck = await UserModel.findOne({slug: slug_user_check});
        if(!findUserCheck) return;
        if(id_user_token === String(findUserCheck._id)) return {status_friend: "owner"};
        // check friend
        const checkFriend = await FriendModel.findOne({users: {"$all": [id_user_token, findUserCheck._id]}});
        if(checkFriend) return {status_friend: "friend", id_friend: checkFriend._id};
        // check invite from
        const checkInviteFrom = await InviteModel.findOne({from: id_user_token, to: findUserCheck._id});
        if(checkInviteFrom) return {status_friend: "inviteFrom", id_invite: checkInviteFrom._id};
        // check invite to
        const checkInviteTo = await InviteModel.findOne({ to: id_user_token, from: findUserCheck._id});
        if(checkInviteTo) return {status_friend: "inviteTo", id_invite: checkInviteTo._id};
        return {status_friend: "nothing"};
    }
    catch(err) {
        console.log(err);
    }
}

const friendController = new FriendController;

module.exports = {friendController, checkStatusFriend};