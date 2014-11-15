var   jszip = require('jszip')
	, fs = require('fs')
	, encode = require('./FFMpeg').encode
	, exec = require('child_process').exec;

var Ortcoi = function(options){
	this._options = options;
	this._events = {};
	this._type = null;
	this._zip = null;
	this._ffmpegPath = options.path + '/data/bin/ffmpeg';
};

Ortcoi.prototype = {
	_options: null,
	_zip: null,
	_type : null,
	_events: null,
	_ffmpegPath: null,

	start: function(){
		this.fire('progress', {state : 'started'});
		this.openZip();
	},

	openZip: function(){
		var $this = this;
        fs.readFile(this._options.from, function(err, data) {
            if (err) {
                $this.fire('error', {detail : err, context: 'Ortcoi.js openZip'});
                return;
            }
            $this._zip = new jszip(data);
            $this.fire('progress', {state : 'loaded zip'});
            $this.manageZip();
        });
	},

	manageZip: function(){
        var $this = this;
     	this.fire('progress', {state : 'decompressing files'});
        exec('mkdir -p '+this._options.to+'/curent && unzip '+this._options.from+' -d '+this._options.to+'/curent', function(err){
        	if (err) {
                $this.fire('error', {detail : err, context: 'Ortcoi.js manageZip'});
                return;
            }
            $this.convert();
        });
    },

    getMediaHtml: function(){
    	switch(this._type){
            case 'audio':
                return '<audio preload="auto"><source src="audio.ogg" type="audio/ogg"><source src="audio.mp3" type="audio/mpeg"></audio>';
            case 'video':
                return '<video preload="auto" poster="thumb.jpg"><source src="video.webm" type="video/webm"><source src="video.mp4" type="video/mp4"><source src="video.ogg" type="video/ogg"></video>';
            default:
                return 'unknown format';
        }
    },

    convert: function(){
     	this.fire('progress', {state : 'encoding audio/video'});
     	if(this._zip.file('audio.ogg') && this._zip.file('video.mp4'))
     		this._mergeAudioAndVideo();
     	else if(zip.file('audio.ogg')==null && zip.file('video.mp4'))
     		this._convertAudioAndVideo();
     	else if(zip.file('audio.ogg') && zip.file('video.mp4')==null)
     		this._convertAudio();
     	else
     		this.fire('error', {detail : 'Nothing to convert', context: 'Ortcoi.js convert'});
    },

    _mergeAudioAndVideo: function(){
    	var $this = this, processes = {}, todo = 3, processDone = 0;
        var done = function(){
            if(++processDone >= todo){
                $this._type = 'video';
                $this._createThumbnail();
            }
            $this.fire('progress', {state : 'video converted : '+processDone+'/'+todo});
        },fail = function(message){
            for(var key in processes){
                processes[key].kill();
            }
            $this.fire('error', {detail : message, context: 'Ortcoi.js _mergeAudioAndVideo/fail'});
        };

        processes.h264 = encode(['-i', this._options.to+'/curent/video.mp4', '-itsoffset', '-1.45', '-i', this._options.to+'/curent/audio.ogg', '-c:v', 'h264', '-c:a', 'mp3', '-r', '24', '-strict', 'experimental', this._options.to+'/video.mp4'], function(){
            done();
            processes.ogg = encode(['-i', $this._options.to+'/video.mp4', '-c:v', 'theora', '-c:a', 'vorbis', '-ac', '2', '-strict', 'experimental', $this._options.to+'/video.ogg'], done, function(){
                fail('ogg conversion error.');
            }, $this._ffmpegPath);
            processes.webm = encode(['-i', $this._options.to+'/video.mp4', '-c:v', 'libvpx', '-c:a', 'vorbis', '-ac', '2', '-strict', 'experimental', $this._options.to+'/video.webm'], done, function(){
                fail('webm conversion error.');
            }, $this._ffmpegPath);
        }, function(){
            fail('h264 conversion error.');
        }, this._ffmpegPath);
    },

    _convertAudioAndVideo: function(){
    	var $this = this, processes = {}, todo = 3, processDone = 0;
        var done = function(){
            if(++processDone >= todo){
                $this._type = 'video';
                $this._createThumbnail();
            }
            $this.fire('progress', {state : 'video converted : '+processDone+'/'+todo});
        },fail = function(message){
            for(var key in processes){
                processes[key].kill();
            }
            $this.fire('error', {detail : message, context: 'Ortcoi.js _convertAudioAndVideo/fail'});
        };

        processes.h264 = encode(['-ss', '0.05','-i', this._options.to+'/curent/video.mp4', '-c:v', 'h264', '-c:a', 'mp3', '-r', '24', '-strict', 'experimental', this._options.to+'/video.mp4'], function(){
            done();
            processes.webm = encode(['-i', $this._options.to+'/video.mp4','-c:v', 'libvpx', '-c:a', 'vorbis', '-ac', '2','-r', '24', '-strict', 'experimental', $this._options.to+'/video.webm'], done, function(){
                fail('webm conversion error.');
            }, $this._ffmpegPath);
        }, function(){
            fail('h264 conversion error.');
        }, this._ffmpegPath);

        processes.ogg = encode(['-i', this._options.to+'/curent/video.mp4', '-c:v', 'theora', '-c:a', 'vorbis', '-ac', '2', '-r', '24', '-strict', 'experimental', this._options.to+'/video.ogg'], done, function(){
            fail('ogg conversion error.');
        }, this._ffmpegPath);
    },

    _convertAudio: function(){
    	var $this = this, processes = {}, todo = 2, processDone = 0;
        var done = function(){
            if(++processDone >= todo){
                $this._type = 'audio';
                $this._createHTML(zip);
            }
            $this.fire('progress', {state : 'audio converted : '+processDone+'/'+todo});
        },fail = function(message){
            for(var key in processes){
                processes[key].kill();
            }
            $this.fire('error', {detail : message, context: 'Ortcoi.js _convertAudio/fail'});
        };

        processes.mp3 = encode(['-i', this._options.to+'/curent/audio.ogg', '-c:a', 'mp3', '-strict', 'experimental', this._options.to+'/audio.mp3'], fdone, function(){
            fail('mp3 conversion error.');
        }, this._ffmpegPath);

        processes.ogg = encode(['-i', this._options.to+'/curent/audio.ogg', '-c:a', 'vorbis', '-strict', 'experimental', this._options.to+'/audio.ogg'], done, function(){
            fail('vorbis conversion error.');
        }, this._ffmpegPath);
    },

    _createThumbnail: function(){
    	this.fire('progress', {state : 'creating thumbnail'});
        var $this = this;
        encode(['-itsoffset', '-4', '-i', this._options.to+'/video.mp4', '-f', 'image2', '-vframes', '1', this._options.to+'/thumb.jpg'], function(){
            $this._createHTML();
        }, function(){
        	$this.fire('error', {detail : 'Thumbnails generation error.', context: 'Ortcoi.js _createThumbnail'});
        }, this._ffmpegPath);
    },

    _createHTML: function(){
    	var $this = this;
        this.fire('progress', {state : 'creating html'});
        fs.readFile(this._options.path + '/data/template.html', 'utf8', function (err,data) {
            if (err) {
                $this.fire('error', {detail : err, context: 'Ortcoi.js _createHTML'});
            }
            data = data
                .replace('%media%', $this.getMediaHtml())
                .replace('%slides%', $this._zip.file('slides.html').asText())
                .replace('%record%', $this._zip.file('record.json').asText());
            fs.writeFile($this._options.to+'/index.html', data, function(err) {
                if (err) {
                    $this.fire('error', {detail : err, context: 'Ortcoi.js _createHTML'});
                }
                exec('rm -r '+$this._options.to+'/curent && zip -r -9 '+$this._options.to+'.zip '+$this._options.to, function(){
                    exec('rm -r '+$this._options.to, function(){
                        $this.fire('done', $this._options);
                    });
                });
            }); 

        });
    },

	//events
	fire: function(event, options){
		if(typeof this._events[event] != 'undefined' && this._events[event].length > 0){
			for(var k in this._events[event]){
				this._events[event][k](options);
			}
		}
	},

	on: function(event, func){
		if(typeof this._events[event] == 'undefined'){
			this._events[event] = [];
		}
		this._events[event].push(func);
	}
};

module.exports = {
	Ortcoi : Ortcoi
};