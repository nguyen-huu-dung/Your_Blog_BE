const { checkTokenMiddle} = require("./middleware");


const middlewares = (app) => {
    app.post('/logout', checkTokenMiddle);

    app.get('/users/user_info', checkTokenMiddle);
    app.put('/users/user_info', checkTokenMiddle);
    app.put('/users/change_password', checkTokenMiddle);
    app.put('/users/change_avatar', checkTokenMiddle);

    app.use('/blogs', checkTokenMiddle);
    app.use('/forum_blogs', checkTokenMiddle);
    
    app.use('/friends', checkTokenMiddle);
    app.use('/invite_friends', checkTokenMiddle);

    app.use('/search', checkTokenMiddle);

    app.use('/chat_globals', checkTokenMiddle);
}

module.exports = { middlewares };