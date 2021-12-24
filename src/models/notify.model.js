const mongoose = require('mongoose');
const { Schema } = mongoose;


const NotifyModel = Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    type: {
        type: String,
        enum: [ 'comment', 'inviteFriend', 'acceptFriend' ],
        require: true
    },
    created: {
        type: Number,
        require: true
    },
    forumBlog: {
        type: Schema.Types.ObjectId,
        ref: 'forum-blogs'
    },
    isSeen: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('notifies', NotifyModel);