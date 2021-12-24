const mongoose = require('mongoose');
const { Schema } = mongoose;

const InviteFriendSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    created: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('invite-friends', InviteFriendSchema);