var Queue = function(){ this._queue = new Array(); };

Queue.prototype = {
    _queue: null,
    dequeue: function(){
        return this._queue.pop();
    },
    enqueue: function(item){
        return this._queue.unshift(item);
    },
    size: function(){
        return this._queue.length;
    },
    get: function(i){
        return this._queue[i];
    }
};

module.exports = Queue;