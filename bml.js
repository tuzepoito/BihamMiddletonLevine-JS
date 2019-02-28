// implementation of the Biham-Middleton-Levine traffic model.
// author : Cédric "tuzepoito" Chartron

// fallback for requestAnimationFrame
var requestAnimation = window.requestAnimationFrame ||
  function (callback, el) { setTimeout(callback, 1000/60.0); };

var BML = function (ctx, width, height) {
  var COLOR_WHITE = 0;
  var COLOR_RED = 1;
  var COLOR_BLUE = 2;

  var self = this;

  var imageData = ctx.createImageData(width, height);
  var data = imageData.data;


  var image = new Array(height);
  for (var i = 0; i < height; i++) {
    image[i] = new Array(width);
  }

  // buffer for intermediate calculation.
  var buffer = new Array(height);
  for (var i = 0; i < height; i++) {
    buffer[i] = new Array(width);
  }

  this.init = function(density) {
    // init with density between 0 and 100
    // density : ratio car_pixels / empty_pixels
    // assuming, prob. of red cars == prob. of blue cars.

    var chance = density / 100.0;

    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var rand = Math.random();

        if (rand < chance / 2) {
          image[i][j] = COLOR_RED;
        } else if (rand < chance) {
          image[i][j] = COLOR_BLUE;
        } else {
          image[i][j] = COLOR_WHITE;
        }
      }
    }
  };

  this.step = function() {
    var width1 = width-1;
    var height1 = height-1;

    // move red cars
    for (var i = 0; i < height; i++) {
      // unrolling the loop for performance(?)

      // first column
      var center = image[i][0];
      var prev = image[i][width1];
      var next = image[i][1];

      if (center == COLOR_WHITE && prev == COLOR_RED) {
        buffer[i][0] = COLOR_RED;
      } else if (center == COLOR_RED && next == COLOR_WHITE) {
        buffer[i][0] = COLOR_WHITE;
      } else {
        buffer[i][0] = center;
      }
    

      for (var j = 1; j < width1; j++) {
        center = image[i][j];
        prev = image[i][j-1]; // left
        next = image[i][j+1]; // right
        if (center == COLOR_WHITE && prev == COLOR_RED) {
          buffer[i][j] = COLOR_RED;
        } else if (center == COLOR_RED && next == COLOR_WHITE) {
          buffer[i][j] = COLOR_WHITE;
        } else {
          buffer[i][j] = center;
        }
      }

      // last column
      center = image[i][width1];
      prev = image[i][width-2]; // left
      next = image[i][0]; // right
      if (center == COLOR_WHITE && prev == COLOR_RED) {
        buffer[i][width1] = COLOR_RED;
      } else if (center == COLOR_RED && next == COLOR_WHITE) {
        buffer[i][width1] = COLOR_WHITE;
      } else {
        buffer[i][width1] = center;
      }
    }

    // move blue cars
    for (var j = 0; j < width; j++) {
      // unrolling the loop for performance(?)

      // first row
      var center = buffer[0][j];
      var prev = buffer[height1][j];
      var next = buffer[1][j];

      if (center == COLOR_WHITE && prev == COLOR_BLUE) {
        image[0][j] = COLOR_BLUE;
      } else if (center == COLOR_BLUE && next == COLOR_WHITE) {
        image[0][j] = COLOR_WHITE;
      } else {
        image[0][j] = center;
      }
    

      for (var i = 1; i < height1; i++) {
        center = buffer[i][j];
        prev = buffer[i-1][j];
        next = buffer[i+1][j];
        if (center == COLOR_WHITE && prev == COLOR_BLUE) {
          image[i][j] = COLOR_BLUE;
        } else if (center == COLOR_BLUE && next == COLOR_WHITE) {
          image[i][j] = COLOR_WHITE;
        } else {
          image[i][j] = center;
        }
      }

      // last row
      center = buffer[height1][j];
      prev = buffer[height-2][j];
      next = buffer[0][j];

      if (center == COLOR_WHITE && prev == COLOR_BLUE) {
        image[height1][j] = COLOR_BLUE;
      } else if (center == COLOR_BLUE && next == COLOR_WHITE) {
        image[height1][j] = COLOR_WHITE;
      } else {
        image[height1][j] = center;
      }
    }
  };

  this.makeImage = function () {
    var offset = 0;

    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var pixel = image[i][j];

        if (pixel == COLOR_RED) {
          data[offset] = 255; // red
          data[offset + 1] = 0; // green
          data[offset + 2] = 0; // blue
        } else if (pixel == COLOR_BLUE) {
          data[offset] = 0; // red
          data[offset + 1] = 0; // green
          data[offset + 2] = 255; // blue
        } else {
          data[offset] = 255; // red
          data[offset + 1] = 255; // green
          data[offset + 2] = 255; // blue
        }
        data[offset + 3] = 255; // alpha
        offset += 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
};

window.addEventListener("load", function () {
  var canvas = document.getElementById('maincanvas');
  var width = canvas.width;
  var height = canvas.height;
  var lastCalledTime = Date.now();

  var ctx = canvas.getContext('2d');

  var bml = new BML(ctx, width, height);

  var iterationCount;

  var stop = false;

  function render() {

    if (!stop) {
      bml.step();
      iterationCount++;
      bml.makeImage();

      if (iterationCount % 10 == 0) {
        // count FPS
        var newTime = Date.now();
        var delta = (newTime - lastCalledTime) / 1000;
        lastCalledTime = newTime;
        var fps = 10 / delta;
        document.getElementById('fps').innerHTML = 'FPS: ' + fps.toFixed(0);

        document.getElementById('iteration').innerHTML = iterationCount;
      }
    }
    
    requestAnimation(render);
  }

  var pauseButton = document.getElementById("pauseButton");

  function pause(value) {
    stop = value;
    if (stop) {
      pauseButton.innerText = "Play";
    } else {
      pauseButton.innerText = "Pause";
    }
  }

  function togglePause() {
    pause(!stop);
  }

  pauseButton.addEventListener("click", togglePause);

  var densityRange = document.getElementById("density");
  var densityText = document.getElementById("densityText");

  densityText.innerText = densityRange.value;

  function displayDensity() {
    var newDensity = parseFloat(densityRange.value);
    densityText.innerText = newDensity.toFixed(2);
    return newDensity;
  }

  function updateDensity() {
    var newDensity = displayDensity();
    iterationCount = 0;
    bml.init(newDensity);
    bml.makeImage();
    document.getElementById('iteration').innerHTML = iterationCount;
  }

  var resetButton = document.getElementById("resetButton");
  resetButton.addEventListener("click", updateDensity);

  var stepButton = document.getElementById("stepButton");
  stepButton.addEventListener("click", function () {
    if (!stop) {
      togglePause();
    } else {
      bml.step();
      iterationCount++;
      bml.makeImage();
    }
    document.getElementById('iteration').innerHTML = iterationCount;
  });

  updateDensity();

  densityRange.addEventListener("change", updateDensity);
  densityRange.addEventListener("input", displayDensity);

  requestAnimation(render);
});
