var multiparty = require('multiparty')
  , http = require('http')
  , fs = require('fs')
  , url = require('url')
  , mime = require('mime')
  , exec = require('child_process').exec
  , Queue = require('./modules/Queue')
  , Ortcoi = require('./modules/Ortcoi').Ortcoi
  , Path = require('path');

var App = function(port){ 
    this._server = null;
    this._current = null;
    this._type = null;
    this._queue = new Queue();
    this._done = new Array();
    this.initialize(port);
 }
App.prototype = {
    _server: null,
    _current: null,
    _queue: null,
    _done: null,
    _formats: null,
    _type: null,
    initialize : function(port){
        port = port || 8080;
        var $this = this;

        this._server = http.createServer(function(request, response) {
            response.setHeader('Access-Control-Allow-Origin', '*');
            if (request.method == 'OPTIONS') {
                response.send(200);
                return;
            }
            request.query = url.parse(request.url, true);

            switch(request.query.pathname){
                case '/Upload' :
                    $this.manageUpload(request, response);
                    break;
                case '/GetStatus' :
                    $this.manageStatus(request, response);
                    break;
                case '/GetFile' :
                    $this.download(request, response);
                    break;
                default:
                    $this.getFile(request, response);
            }
        }).listen(port);

        console.log('Starting ninpp server on port : '+port);
    },
    getFile: function(request, response){
        if(request.query.pathname == '/')
            request.query.pathname = '/index.html';

        var path = __dirname+request.query.pathname;
        fs.readFile(path, 'utf8', function (err,data) {
            if(err){
                response.writeHead(404, {'content-type': 'text/html'});
                response.write('Nothing here!');
                response.end();
                return;
            }
            response.writeHead(200, {'content-type': mime.lookup(path)});
            response.write(data);
            response.end();
        });
    },
    getToken: function(){
        return parseInt(Math.random() * 1000000000).toString(32);
    },
    download: function(request, response){
        fs.readFile(__dirname+'/data/done/'+request.query.query.token+'.zip', 'binary', function(err, data){
            if(err){
                console.log('Error while reading "./data/done/'+request.query.query.token+'.zip" :' + err);
                response.end();
                return;
            }
            response.setHeader('Content-Length', data.length);
            response.setHeader('Content-disposition', 'attachment; filename=presentation.zip');
            response.setHeader('Content-type', 'application/zip');
            response.write(data, 'binary');
            response.end();
        });
    },
    manageStatus: function(request, response){
        var token = request.query.query.token, result = JSON.stringify({token : null, state: null, position: 0}, null, 3);
        response.setHeader('Content-Type', 'application/json');
        if(token){
            if(this._current && this._current.token == token){
                result = JSON.stringify({token : this._current.token, state: this._current.state, position: 0}, null, 3);
            }
            this._done.filter(function(e){ 
                return e.token == token; 
            }).forEach(function(e, i){
                result = JSON.stringify({token : e.token, state: e.state, position: 0}, null, 3);
            });
            this._queue._queue.filter(function(e){ 
                return e.token == token; 
            }).forEach(function(e, i){
                result = JSON.stringify({token : e.token, state: e.state, position: i + 1}, null, 3);
            });
        }
        response.end(result);
    },
    manageUpload: function(request, response){
        var $this = this, form = new multiparty.Form({autoFiles: true}), files = [];

        form.on('file', function(file, fileInfo){
            files.push(fileInfo);
        });

        form.on('close', function(){
            var element = { token: $this.getToken(), file: files[0], state: 'waiting' }
            $this._queue.enqueue(element);

            console.log('Adding new element "'+element.token+'" to processsing list.');

            var result = JSON.stringify({token : element.token, state: element.state, position: $this._queue.size()}, null, 3);
            response.setHeader('Content-Type', 'application/json');
            response.end(result);

            $this.manageQueue();
        });

        form.parse(request);
    },
    manageQueue: function(){
        var $this = this;
        exec('rm '+__dirname+'/data/curent.zip', function(){
            if($this._current == null && $this._queue.size() > 0){
                $this._current = $this._queue.dequeue();
                $this.copyFile($this._current, function(){
                    $this.currentOrtcoi = new Ortcoi({from : __dirname+'/data/curent.zip', to: __dirname+'/data/done/'+$this._current.token, path: __dirname});
                    $this.currentOrtcoi.on('done', function(opt){
                        $this.creationDone();
                    });
                    $this.currentOrtcoi.on('progress', function(opt){
                        $this._current.state = opt.state;
                    });
                    $this.currentOrtcoi.on('error', function(message){
                        $this.manageError(message);
                    });
                    $this.currentOrtcoi.start();
                }, function(message){
                    $this.manageError(message);
                });
            }
        });
    },
    creationDone: function(){
        this._current.state = 'done';
        this._done.push(this._current);
        this._current = null;
        this.manageQueue();
    },
    manageError: function(error){
        this._current.error = error;
        this._current.state = 'failed';
        console.log(this._current);
        this._done.push(this._current);
        this._current = null;
        this.manageQueue();
    },
    copyFile: function(element, end, error){
        var source = fs.createReadStream(element.file.path);
        var dest = fs.createWriteStream(__dirname+'/data/curent.zip');
        source.pipe(dest);
        source.on('end', end);
        source.on('error', error);
    }
};
var app = new App(8080);