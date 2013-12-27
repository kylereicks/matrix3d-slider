;(function(window, document, undefined){
  'use strict';
  var matrixSlider = function(element){
    var childNodes = element.childNodes,
    childElements = [],
    tiltHandler = function(e){
      e.preventDefault();
      animate.stop().tilt(this);
    },
    flipHandler = function(e){
      animate.stop().flip(this);
    },
    dropHandler = function(e){
      animate.stop().reset(this).drop(childElements[childElements.indexOf(this) + 1 === el ? 0 : childElements.indexOf(this) + 1]);
    };
    for(var i = 0, nl = childNodes.length; i < nl; i++){
      if('#text' !== childNodes[i].nodeName){
        childElements.push(childNodes[i]);
      }
    }
    animate.drop(childElements[0]);
    for(var j = 0, el = childElements.length; j < el; j++){
      childElements[j].addEventListener('mousedown', tiltHandler, false);
      childElements[j].addEventListener('tiltComplete', flipHandler, false);
      childElements[j].addEventListener('flipComplete', dropHandler, false);
    }
  },
  animate = {
    id: 0,
    stop: function(){
      if(animate.id){
        window.cancelAnimationFrame(animate.id);
      }
      return this;
    },
    reset: function(element){
      matrix3d.reset(element);
      return this;
    },
    tilt: function(element, existingFrame, existingMatrices){
      var el = element,
      frame = existingFrame || 0,
      duration = 35,
      matrices = existingMatrices || {},
      frameMatrixArray = [],
      initialMatrix = matrices.initialMatrix || matrix3d.getComputedMatrix(el),
      rY = matrices.rY || matrix3d.baseMatrix.slice(0),
      rYfreq = Math.pow(frame / duration, 0.48),
      tiltComplete = new CustomEvent('tiltComplete');
      rY[0] = Math.cos(frame * ((Math.PI / 180) / rYfreq));
      rY[2] = -Math.sin(frame * ((Math.PI / 180) / rYfreq));
      rY[8] = Math.sin(frame * ((Math.PI / 180) / rYfreq));
      rY[10] = Math.cos(frame * ((Math.PI / 180) / rYfreq));
      frameMatrixArray = matrix3d.x(initialMatrix, rY);
      if(duration >= frame){
        animate._setFrame(el, frameMatrixArray);
        frame = frame + 1;
        animate.id = window.requestAnimationFrame(function(){animate.tilt(el, frame, {initialMatrix: initialMatrix, rY: rY});});
      }else{
        window.cancelAnimationFrame(animate.id);
        el.dispatchEvent(tiltComplete);
      }
      return this;
    },
    flip: function(element, existingFrame, existingMatrices){
      var el = element,
      frame = existingFrame || 0,
      duration = 210,
      matrices = existingMatrices || {},
      frameMatrixArray = [],
      initialMatrix = matrices.initialMatrix || matrix3d.getComputedMatrix(el),
      rY = matrices.rY || matrix3d.baseMatrix.slice(0),
      rYfreq = animate._easeInOut(frame/duration),
      flipComplete = new CustomEvent('flipComplete');
      rY[0] = Math.cos(frame * ((Math.PI / 180) / rYfreq));
      rY[2] = Math.sin(frame * ((Math.PI / 180) / rYfreq));
      rY[8] = -Math.sin(frame * ((Math.PI / 180) / rYfreq));
      rY[10] = Math.cos(frame * ((Math.PI / 180) / rYfreq));
      frameMatrixArray = matrix3d.x(initialMatrix, rY);
      if(duration >= frame){
        animate._setFrame(el, frameMatrixArray);
        frame = frame + 1;
        animate.id = window.requestAnimationFrame(function(){animate.flip(el, frame, {initialMatrix: initialMatrix, rY: rY});});
      }else{
        window.cancelAnimationFrame(animate.id);
        el.dispatchEvent(flipComplete);
      }
      return this;
    },
    drop: function(element, existingFrame, existingMatrices){
      var el = element,
      frame = existingFrame || 0,
      duration = 100,
      matrices = existingMatrices || {},
      frameMatrixArray = [],
      initialMatrix = matrices.initialMatrix || matrix3d.getComputedMatrix(el),
      tZ = matrices.tZ || matrix3d.baseMatrix.slice(0);
      tZ[15] = -animate._easeOutElastic(frame/duration);
      frameMatrixArray = matrix3d.x(initialMatrix, tZ);
      if(1 >= frame/duration){
        animate._setFrame(el, frameMatrixArray);
        frame = frame + 1;
        animate.id = window.requestAnimationFrame(function(){animate.drop(el, frame, {initialMatrix: initialMatrix, tZ: tZ});});
      }else{
        frameMatrixArray[15] = 1;
        animate._setFrame(el, frameMatrixArray);
        window.cancelAnimationFrame(animate.id);
      }
      return this;
    },
    _easeInOut: function(n){
      var q = 0.48 - n / 1.04,
      Q = Math.sqrt(0.1734 + q * q),
      x = Q - q,
      X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
      y = -Q - q,
      Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
      t = X + Y + 0.5;
      return (1 - t) * 3 * t * t + t * t * t;
    },
    _easeOutElastic: function(n){
      return Math.pow(2, -10 * n) * Math.sin((n - 0.075) * (2 * Math.PI) / 0.3) + 1;
    },
    _setFrame: function(element, frameMatrixArray){
      var frameMatrix = 'matrix3d(' + frameMatrixArray + ')';
      element.style['-webkit-transform'] = frameMatrix;
      element.style['-moz-transform'] = frameMatrix;
      element.style['-o-transform'] = frameMatrix;
      element.style['-ms-transform'] = frameMatrix;
      element.style.transform = frameMatrix;
    }
  },
  matrix3d = {
    baseMatrix: [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ],
    reset: function(element){
      element.style['-webkit-transform'] = null;
      element.style['-moz-transform'] = null;
      element.style['-o-transform'] = null;
      element.style['-ms-transform'] = null;
      element.style.transform = null;
    },
    getComputedMatrix: function(element){
      var computedStyle = window.getComputedStyle(element),
      m = computedStyle.transform || computedStyle['-webkit-transform'] || computedStyle['-moz-transform'] || computedStyle['-o-transform'] || computedStyle['-ms-transform'],
      ml = m.length;
      if('matrix3d' === m.substr(0, 8)){
        m = m.substr(8).replace(/[\(\)]/g, '').split(',');
        for(var i = 0; i < ml; i++){
          m[i] = +m[i];
        }
      }else if('matrix(' === m.substr(0, 7)){
        m = m.substr(6).replace(/[\(\)]/g, '').split(',');
        for(var j = 0; j < ml; j++){
          m[j] = +m[j];
        }
        m = [
          m[0], m[1], 0, 0,
          m[2], m[3], 0, 0,
          0, 0, 1, 0,
          m[4], m[5], 0, 1
        ];
      }else{
        m = matrix3d.baseMatrix.slice(0);
      }
      return m;
    },
    translateOrigin: function(element, x, y){
      var el = element,
      initialOrigin = {},
      newOrigin = '',
      computedStyle = window.getComputedStyle(el);
      initialOrigin.string = computedStyle['transform-origin'] || computedStyle.transformOrigin || computedStyle['-webkit-transform-origin'] || computedStyle['-moz-transform-origin'] || computedStyle['-o-transform-origin'] || computedStyle['-ms-transform-origin'];
      initialOrigin.array = initialOrigin.string.split(' ');
      initialOrigin.x = +initialOrigin.array[0].substr(0, initialOrigin.array[0].length - 2);
      initialOrigin.y = +initialOrigin.array[1].substr(0, initialOrigin.array[1].length - 2);
      newOrigin = (initialOrigin.x + x) + 'px ' + (initialOrigin.y + y) + 'px';
      el.style['-webkit-transform-origin'] = newOrigin;
      el.style['-moz-transform-origin'] = newOrigin;
      el.style['-o-transform-origin'] = newOrigin;
      el.style['-ms-transform-origin'] = newOrigin;
      el.style['transform-origin'] = newOrigin;
      el.style.transformOrigin = newOrigin;
    },
    x: function(a, b){
      return [
        a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12],
        a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13],
        a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
        a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],
        a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12],
        a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13],
        a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14],
        a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],
        a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12],
        a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13],
        a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14],
        a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],
        a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12],
        a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13],
        a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14],
        a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15]
      ];
    }
  },
  utilities = {
    randomRange: function(start, end, random){
      var rand = random || Math.random();
      return Math.floor(rand * (end - start + 1) + start);
    }
  },
  init = function(){
    this.run = true;
    matrixSlider(document.getElementById('slider'));
  };
  if(window.addEventListener){
    window.addEventListener('load', init, false);
  }else if(window.attachEvent){
    window.attachEvent('onload', init);
  }
  if('complete' === document.readyState && !init.run){
    init();
  }
}(this, document));
