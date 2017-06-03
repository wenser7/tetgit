process.on('message',function(m){
	console.log('child process recived message:',m);
});
process.send({message:'hello parent'});
