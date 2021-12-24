const express = require('express');
const { friendController }= require('../controllers/friend.controller');
const FriendRouter = express.Router({caseSensitive: true});

FriendRouter.get('/', friendController.getFriends);
FriendRouter.get('/status_friend/:slug_user', friendController.checkStatusFriendApi);
FriendRouter.delete('/:id_friend', friendController.cancelFriend);

module.exports = FriendRouter;