const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatGlobalSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    message: {
        type: String,
        required: true
    },
    roomChat: {
        type: String,
        enum: ['roomQuestion', 'roomChat']
    },
    created: {
        type: Number
    }
})

module.exports = mongoose.model('chat-globals', ChatGlobalSchema);