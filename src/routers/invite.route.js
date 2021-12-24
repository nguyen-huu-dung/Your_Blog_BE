const express = require('express');
const { friendController }= require('../controllers/friend.controller');
const InviteRouter = express.Router({caseSensitive: true});

InviteRouter.get('/', friendController.getInviteFriends);
InviteRouter.post('/', friendController.inviteFriend);
InviteRouter.put('/:id_invite', friendController.acceptInviteFriend);
InviteRouter.delete('/:id_invite', friendController.cancelInviteFriend);

module.exports = InviteRouter;