const NotifyModel = require('../models/notify.model');

/*
    Post notify
*/
const postNotify = async (from, to, type, forumBlog) => {
    const newNotify = new NotifyModel();
    newNotify.from = from;
    newNotify.to = to;
    newNotify.type = type;
    newNotify.forumBlog = forumBlog;
    newNotify.created = Date.now();
    const saveNotify = await newNotify.save();
    return saveNotify;
}

/*
    Delete notify
*/
const deleteNotify = async (id_notify, userTo) => {
    // delete notify
    await NotifyModel.findOneAndDelete({_id: id_notify, to: userTo});
    return
}

class NotifyController {

    /* 
        Get notify
        [GET] /notifies?page=numPage&&size=numSize&&minAt&&maxAt
    */
    async getNotifies(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const { page, size, minAt, maxAt } = req.params;
            let notifies, countNotifies;
            if(!page || !size) {
                notifies = await NotifyModel.find({to: id_user}).sort({created: -1}).populate({path: 'from', select: '-_id name slug avatar',populate: { path: "avatar", select: '-_id path' }}).populate({path:'to', select: '-_id slug'}).select('-__v');
                res.status(200).json({data: {notifies}, message: "", success: true});
            }
        }   
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }

    /*
        Delete notify
        [DELETE] /notifies/:id_notify
    */    
    async deleteNotifies(req, res) {
        try {
            const { id: id_user } = res.locals.decoded;
            const id_notify = req.params.id_notify;
            // find notify
            const findNotify = await NotifyModel.find({_id: id_notify, to: id_user});
            if(!findNotify) return res.status(400).json({data: {}, message: "Notify is not exists or you do not have access", success: false});
            await NotifyModel.findByIdAndDelete(id_notify);
            res.status(200).json({data, message: 'Delete notify success', success: true});
        }
        catch {
            res.status(500).json({data: {}, message: "The server has an error", success: false});
        }
    }
}

const notifyController = new NotifyController;

module.exports = { notifyController, postNotify , deleteNotify};