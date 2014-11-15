var spawn = require('child_process').spawn
  , exec = require('child_process').exec;

var FFmpegEncode = function(params, done, fail, path){ 
    path = path || './data/bin/ffmpeg';
    var process = spawn(path, params, { stdio: 'ignore' });

    process.on('close', function (code) {
        if(code == 0)
           done();
        else
            fail();
    });

    return process;
};

module.exports = {
	encode : FFmpegEncode
};