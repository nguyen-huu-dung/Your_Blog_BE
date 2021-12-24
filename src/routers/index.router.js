const UserRouter = require('./user.router');
const BlogRouter = require('./blog.router');
const ImageRouter = require('./image.router');
const AccountRouter = require('./account.route');
const ForumBlogRouter = require('./forumBlog.route');
const FriendRouter = require('./friend.route');
const InviteRouter = require('./invite.route');
const SearchRouter = require('./search.route');
const ChatGlobalRouter = require('./chatGlobal.route');

const router = (app) => {
    app.use('/users', UserRouter);
    app.use('/blogs', BlogRouter);
    app.use('/forum_blogs', ForumBlogRouter)
    app.use('/images', ImageRouter);
    app.use('/friends', FriendRouter);
    app.use('/invite_friends', InviteRouter);
    app.use('/search', SearchRouter);
    app.use('/chat_globals', ChatGlobalRouter)
    app.use('/', AccountRouter);
}

module.exports = { router };