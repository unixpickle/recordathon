(function() {
  
  function Player(sound, start, end) {
    this.sound = sound;
    this.start = start;
    this.end = end;
    
    // Create canvas and context
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 70;
    this.canvas.style.backgroundColor = '#ddd';
    this.context = this.canvas.getContext('2d');
    
    this.histogram = sound.histogram(this.canvas.width / 2);
    this.playing = null;
    this._setupEvents();
    this.draw();
  }
  
  Player.prototype.autocut = function() {
    var indexToTime = this.sound.header.getDuration() / this.histogram.length;
    for (var i = 0; i < this.histogram.length; ++i) {
      if (this.histogram[i] > 0.03) {
        this.start = i * indexToTime;
        break;
      }
    }
    for (var i = this.histogram.length - 1; i >= 0; --i) {
      if (this.histogram[i] > 0.03) {
        this.end = i * indexToTime;
        break;
      }
    }
    this.draw();
  };
  
  Player.prototype.draw = function() {
    var middle = this.canvas.height / 2;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw histogram
    this.context.fillStyle = '#FF6900';
    for (var i = 0; i < this.histogram.length; ++i) {
      var height = middle * this.histogram[i];
      this.context.fillRect(i*2, middle-height, 1, height*2);
    }
    
    // Draw cut markers
    this.context.fillStyle = '#000';
    var timeToX = this.canvas.width / this.sound.header.getDuration();
    var leftBar = this.start * timeToX;
    var rightBar = this.end * timeToX;
    this.context.fillRect(leftBar, 0, 1, this.canvas.height);
    this.context.fillRect(rightBar-1, 0, 1, this.canvas.height);
  };
  
  Player.prototype.playPause = function() {
    if (this.playing) {
      this.playing.pause();
      this.playing = null;
    } else {
      var sound = this.sound.crop(this.start, this.end);
      this.playing = new Audio();
      this.playing.src = 'data:audio/wav;base64,' + sound.base64();
      this.playing.addEventListener('ended', function() {
        this.playing = null;
      }.bind(this));
      this.playing.play();
    }
  };
  
  Player.prototype._setupEvents = function() {
    // Allow the user to drag and move the crop bars
    var dragging = -1;
    
    eventX = function(evt) {
      if ('undefined' !== typeof evt.offsetX) {
        return evt.offsetX;
      }
      return evt.layerX - 10;
    };
    
    // Handle mousedown events.
    this.canvas.addEventListener('mousedown', function(evt) {
      x = eventX(evt);
      console.log(x);
      var timeToX = this.canvas.width / this.sound.header.getDuration();
      var leftBar = this.start * timeToX;
      var rightBar = this.end * timeToX;
      if (Math.abs(x - leftBar) < Math.abs(x - rightBar)) {
        dragging = 0;
      } else {
        dragging = 1;
      }
    }.bind(this));
    
    // Handle mousemove events to handle drags.
    this.canvas.addEventListener('mousemove', function(evt) {
      if (dragging < 0) {
        return;
      }
      x = eventX(evt);
      var xToTime = this.sound.header.getDuration() / this.canvas.width;
      var time = xToTime * x;
      if (dragging == 0) {
        this.start = time;
      } else {
        this.end = time;
      }
      // Swap start and end if necessary.
      if (this.end < this.start) {
        var temp = this.start;
        this.start = this.end;
        this.end = temp;
        dragging = 1 - dragging;
      }
      
      this.draw();
    }.bind(this));
    
    // The mouseup event resets everything.
    this.canvas.addEventListener('mouseup', function() {
      dragging = -1;
    });
  };
  
  if (!window.recordathon) {
    window.recordathon = {};
  }
  window.recordathon.Player = Player;
  
})();