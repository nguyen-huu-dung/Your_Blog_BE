const express = require('express');
const chatGlobalController = require('../controllers/chatGlobal.controller');
const ChatGlobalRouter = express.Router({caseSensitive: true});

ChatGlobalRouter.get('/', chatGlobalController.getMessagesChatGlobal);
ChatGlobalRouter.post('/', chatGlobalController.postMessagesChatGlobal);


module.exports = ChatGlobalRouter;