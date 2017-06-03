var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");
var fs = require('fs');

var app = express();

//加载聊天服务
var server = require('http').Server(app);
var io = require('socket.io')(server);

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/tasks", function(err) {
	if(!err) {
		console.log("connected to MongoDB");
	} else {
		console.log(err);
	}
});

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var Task = new Schema({
	task: String
});
var tk = mongoose.model("tk", Task);

/* GET home page. */
router.get('/', function(req, res, next) {
	var user = {
		fisrt_name: "wang",
		surname: "dong",
		address: "The white house",
		facebook_friends: "50000"
	};
	res.render('index', {
		title: 'Express',
		user: user
	});
	
});

router.get("/new", function(req, res) {
	res.render('new', {
		title: "New Task"
	})
});

router.post('/tasks', function(req, res) {

	var task = new tk(req.body);

	task.save(function(err) {
		if(!err) {
			//console.log(req.body.task);
			req.flash('info', 'Task created');
			res.redirect('/tasks');
		} else {
			req.flash('error', 'err');
			res.redirect('/new');
		}
	});
});

router.get('/tasks', function(req, res) {

	tk.find({}, function(err, docs) {
		res.render('tasks', {
			title: "Todos index view",
			docs: docs,
	
		});
	});
	
});

router.get('/tasks/:id/edit', function(req, res) {
	tk.findById(req.params.id, function(err, doc) {
		res.render('edit', {
			title: "Edit Task View",
			task: doc
		});
	});
});

router.post('/tasks/edit/:id', function(req, res) {
	tk.findById(req.params.id, function(err, doc) {
		doc.task = req.body.task;
		doc.save(function(err) {
			if(!err) {
				res.redirect('/tasks');
			} else {
				res.redirect('new');
			}
		});
	});
});

router.post('/tasks/remove/:id', function(req, res) {
	tk.findById(req.params.id, function(err, doc) {
		if(!doc) {
			return next(new Error('Document not found'));
		}
		doc.remove(function() {
			res.redirect('/tasks');
		});
	});
});

//socket.io公聊、私聊网页
router.get('/zixun', function(req, res) {
	res.sendFile('/xuexi/public/index2.html');
})

var rebels = [{
		name: 'Han Solo'
	},
	{
		name: 'Luke Skywalker'
	},
	{
		name: 'C-3PO'
	},
	{
		name: 'R2-D2'
	}
];

router.get('/json', function(req, res) {
	
	var mp3 = 'C:/xuexi/广岛之恋.mp3'
	//var readableStream = fs.createReadStream(mp3);//将间频文件转换成一个流
	//readableStream.pipe(res);//在流中传输给客户端,这种传送效率是最高的，在读的同时传送
	//res.json(rebels);
	fs.readFile('C:/xuexi/广岛之恋.mp3',function(err,data){//这种必须等 到读完才传送
		if(err){
			throw err
		}
		res.write(data);
		res.end();
	});
});


router.get('/react',function(req,res){
	res.render('react',{});
});

router.get('/english',function(req,res){
	res.render('English',{});
});
module.exports = router;