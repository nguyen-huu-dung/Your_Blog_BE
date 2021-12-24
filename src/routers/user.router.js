const express = require('express');
const userController = require('../controllers/user.controller');
const UserRouter = express.Router({caseSensitive: true});

UserRouter.get('/user_info', userController.getUser);
UserRouter.post('/', userController.createNewUser);
UserRouter.put('/user_info', userController.updateUserInfo);
UserRouter.put('/change_password', userController.changePasswordUser);
UserRouter.put('/change_avatar', userController.changeUserAvatar);

module.exports = UserRouter;