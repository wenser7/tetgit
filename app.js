var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var flash = require('connect-flash');
var session = require('express-session');


var index = require('./routes/index');
var users = require('./routes/users');

//创建子进程并杀死子进程
var spawn = require('child_process').spawn;
var ping = spawn('ping',['www.baidu.com']);
ping.stdout.setEncoding('utf-8');
ping.stdout.on('data',function(data){
	console.log(data);
});
ping.on('exit',function(code,signal){
	console.log('child process was killed with a'+signal+'signal');
})
ping.kill('SIGINT');

//父进程与子进程互通消息
var fork = require('child_process').fork;
var child = fork('C:/xuexi/child.js');
child.on('message',function(m){
	console.log('parent process received message:',m);
});
child.send({message:'hello child'});

var app = express();
app.set('port', (process.env.PORT||3000));


//加载聊天服务
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

//添加Socket.IO功能
/*app.get('/zixun', function(req, res) {
	res.sendFile('/xuexi/public/index2.html');
});*/

var nicknames = []; //昵称数组须是全局变量
var usocket = [];//指向socket对象的数组
var count = 0; //同时在线用户初始化
io.on('connection', function(socket,client) {
	console.log('User connected');
	//昵称管理

	socket.on('nickname', function(nk, callback) {
		if(nicknames.indexOf(nk) != -1) { //判断新传进的昵称在数组内是否已存在，存在即!=-1.
			callback(false);
		} else {
			callback(true);
			console.log('nickname:' + nk);
			nicknames.push(nk); //将新连接的昵称加入昵称数组
			socket.nickname = nk; //定义一个名称为nickname的socket变量，这个变量在整个socket里都可以用，每一个连接都会自动拥有一个变量
			nicknames[nk]=nk;//昵称存进数组，方便查找
			
			usocket.push(nk);//将昵称存进socketo数组
			usocket[nk]=socket;//将注册的昵称保存进对应的socket对象里，方便指定发送时能找到
			//console.log('nk:' + nicknames[nk]);
			//console.log('socketp[nk]'+socket[nk]);
			socket.emit('nicknames', nicknames);
			socket.broadcast.emit('nicknames', nicknames);
		}
	});

	socket.on('chat message', function(msg) {
	
		var reciverUsername = msg.To;//获得要发送给对方的名称
		
		//reciverUsername='';

		//先由服务器接收传递过来的数据，再返回给客户端
		socket.emit('chat message', {
			ap: socket.nickname,//socket.nickname是一个socket里都能用的变量
			To:msg.To,
			Say: msg.Say
		}); //传送给自己
		/*socket.broadcast.emit('chat message', {
			ap: socket.nickname,
			Say: msg.Say
		});*/ //传送给所有人，除了自己
		//socket.cm=msg; 定义一个名称为cm 的socket变量 
		//console.log('socket' + socket.cm);
		console.log('socket[nk]'+usocket[reciverUsername].id);
		//通过指定客户端的socket的ID发送私聊信息
		socket.broadcast.to(usocket[reciverUsername].id).emit('chat message',{
			ap:socket.nickname,
			To:msg.To,
			Say: msg.Say
		});
		console.log(socket.id);
	
	});
	

	socket.on('disconnect', function() {
		if(!socket.nickname) {
			return;
		}
		if(nicknames.indexOf(socket.nickname) > -1) { //检查属于这个连接的变量是否还存在，不存在会返回-1
			nicknames.splice(nicknames.indexOf(socket.nickname), 1)
		}
		//console.log('socket对像：'+socket.id);
		console.log('Nicknames are:' + nicknames);
		socket.emit('nicknames', nicknames); //有人离线后发送新的昵称列表
		socket.broadcast.emit('nicknames', nicknames);
	});

	count++;
	socket.emit('users', {
		number: count
	});
	socket.broadcast.emit('users', {
		number: count
	});
	socket.on('disconnect', function() {
		count--;
		socket.broadcast.emit('users', {
			number: count
		});
	});

	socket.on('join', function(data) {
		socket.join(data.user);
		io.sockets.in(data.user).emit('new_msg', data.msg);
	});

});



//设置会话
app.use(cookieParser());
app.use(session({
	secret: 'es5eiqm6ak',
	Key: 'es5eiqm6akdb',
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 30
	},
	resave: false,
	saveUninitialized: true
}));
app.use(flash());
app.use(function(req, res, next) {
	res.locals.errors = req.flash('error');
	res.locals.infos = req.flash('info');
	next();
});

//路由
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

process.stdin.resume();
process.on('SIGINT',function(){
	console.log('Got a SIGINT.Exiting');
	process.exit(0);
});

//缓冲区
var buffer = new Buffer(10);
var buffer2 = new Buffer(10)
buffer.write('hi','utf-8');
buffer.write('there',2,'utf-8');
buffer2.write('wang','utf-8')
buffer.copy(buffer2,1,0,8);
console.log('buffer:',buffer.toString('utf-8'));
console.log('buffer2:',buffer2.toString('utf-8'));

//将读取的文件写入另一个文件
var stream = fs.ReadStream('sheng.txt');
stream.setEncoding('utf-8');
stream.on('data',function(chunk){
	console.log('read some data');
	fs.writeFile('copytxt',chunk,function(err){
		if(err){
			throw err;
		}
		console.log('the file has been saved');
	})
});
stream.on('close',function(){
	console.log('all the data is read');
});


server.listen(PORT, function() {
	console.log("服务器已在3000端口运行");
});



module.exports = app;