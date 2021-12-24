const express = require('express');
const AccountRouter = express.Router({caseSensitive: true});
const accountController = require('../controllers/account.controller');

AccountRouter.post('/login', accountController.login);
AccountRouter.post('/logout', accountController.logout);

module.exports = AccountRouter;