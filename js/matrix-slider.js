;(function(window, document, undefined){
  'use strict';
  var matrixSlider = function(element){
    var childNodes = element.childNodes,
    childElements = [];
    for(var i = 0, nl = childNodes.length; i < nl; i++){
      if('#text' !== childNodes[i].nodeName){
        vars.elementsArray.push(childNodes[i]);
      }
    }
    vars.currentElement = vars.elementsArray[0];
    animate.zIndex(vars.currentElement, 1).drop(vars.currentElement);
    for(var j = 0, el = vars.elementsArray.length; j < el; j++){
      vars.elementsArray[j].addEventListener('mousedown', events.tiltHandler, false);
      vars.elementsArray[j].addEventListener('flipComplete', events.dropHandler, false);
    }
  },
  vars = {
    currentElement: null,
    nextElement: null,
    elementsArray: [],
    tiltStart: 0,
    tiltStop: 0,
    tiltProgress: 0
  },
  events = {
    tiltHandler: function(e){
      e.preventDefault();
      animate.stop().tilt(this);
    },
    flipHandler: function(){
      document.removeEventListener('mouseup', events.flipHandler);
      animate.stop().flip(vars.currentElement, animate._flipEnergy());
    },
    dropHandler: function(e){
      vars.nextElement = vars.elementsArray[vars.elementsArray.indexOf(vars.currentElement) + 1 === vars.elementsArray.length ? 0 : vars.elementsArray.indexOf(vars.currentElement) + 1];
      animate.stop().zIndex(vars.currentElement, 1).zIndex(vars.nextElement, 2).drop(vars.nextElement).reset(vars.currentElement, 100);
      vars.currentElement = vars.nextElement;
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
    reset: function(element, delay){
      setTimeout(function(){matrix3d.reset(element);}, delay);
      return this;
    },
    zIndex: function(element, n){
      matrix3d.zIndex(element, n);
      return this;
    },
    tilt: function(element, existingFrame, existingMatrices){
      var el = element,
      frame = existingFrame || 0,
      duration = 600,
      rotation = 0.25,
      matrices = existingMatrices || {},
      frameMatrixArray = [],
      initialMatrix = matrices.initialMatrix || matrix3d.getComputedMatrix(el),
      rY = matrices.rY || matrix3d.baseMatrix.slice(0),
      rYfreq = animate._easeOut(frame / duration) * (Math.PI * rotation),
      tiltComplete = new CustomEvent('tiltComplete');
      vars.tiltStart = frame === 0 ? new Date().getTime() : vars.tiltStart;
      document.addEventListener('mouseup', events.flipHandler, false);
      rY[0] = Math.cos(rYfreq);
      rY[2] = -Math.sin(rYfreq);
      rY[8] = Math.sin(rYfreq);
      rY[10] = Math.cos(rYfreq);
      frameMatrixArray = matrix3d.x(initialMatrix, rY);
      if(duration >= frame){
        animate._setFrame(el, frameMatrixArray);
        vars.tiltProgress = animate._easeOut(frame/ duration) * rotation;
        frame = frame + 1;
        animate.id = window.requestAnimationFrame(function(){animate.tilt(el, frame, {initialMatrix: initialMatrix, rY: rY});});
      }else{
        window.cancelAnimationFrame(animate.id);
        el.dispatchEvent(tiltComplete);
      }
      return this;
    },
    flip: function(element, energy, existingFrame, existingMatrices){
      var el = element,
      frame = existingFrame || 0,
      matrices = existingMatrices || {},
      frameMatrixArray = [],
      initialMatrix = matrices.initialMatrix || matrix3d.getComputedMatrix(el),
      rY = matrices.rY || matrix3d.baseMatrix.slice(0),
      rYfreq = energy.ease(frame / energy.duration) * (Math.PI * (energy.rotation + vars.tiltProgress)),
      flipComplete = new CustomEvent('flipComplete');
      rY[0] = Math.cos(rYfreq);
      rY[2] = Math.sin(rYfreq);
      rY[8] = -Math.sin(rYfreq);
      rY[10] = Math.cos(rYfreq);
      frameMatrixArray = matrix3d.x(initialMatrix, rY);
      if(energy.duration >= frame){
        animate._setFrame(el, frameMatrixArray);
        frame = frame + 1;
        animate.id = window.requestAnimationFrame(function(){animate.flip(el, energy, frame, {initialMatrix: initialMatrix, rY: rY});});
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
    _flipEnergy: function(){
      var time = 0,
      progress = 0,
      energy = {};
      vars.tiltStop = new Date().getTime();
      time = vars.tiltStop - vars.tiltStart;
      progress = time / 10000;
      energy.duration = Math.floor(progress * 180 + 60);
      energy.rotation = Math.floor(progress * 31) % 2 === 1 ? Math.floor(progress * 31) : Math.floor(progress * 31) + 1;
      if(1 === energy.rotation){
        energy.ease = animate._easeInOut;
      }else{
        energy.ease = animate._easeOut;
      }
      return energy;
    },
    _easeOut: function(n){
      return Math.pow(n, (1 / 6));
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
      element.style.zIndex = null;
    },
    zIndex: function(element, n){
      element.style.zIndex = n;
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
