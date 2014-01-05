;(function(window, document, undefined){
  'use strict';
  var MatrixSlider = function(element){
    var root = this,
    childNodes = element.childNodes,
    currentElement = null,
    nextElement = null,
    elementsArray = [],
    tiltStart = 0,
    tiltStop = 0,
    tiltProgress = 0,
    i = 0,
    max = 0;

    root.events = {
      tiltHandler: function(e){
        e.preventDefault();
        root.animate.stop().tilt(this);
      },
      flipHandler: function(){
        document.removeEventListener('mouseup', root.events.flipHandler);
        root.animate.stop().flip(currentElement, root.animate._flipEnergy());
      },
      dropHandler: function(e){
        nextElement = elementsArray[elementsArray.indexOf(currentElement) + 1 === elementsArray.length ? 0 : elementsArray.indexOf(currentElement) + 1];
        root.animate.stop().zIndex(currentElement, 1).zIndex(nextElement, 2).drop(nextElement).reset(currentElement, 100);
        currentElement = nextElement;
      }
    };

    root.animate = {
      id: 0,
      stop: function(){
        if(root.animate.id){
          window.cancelAnimationFrame(root.animate.id);
        }
        return this;
      },
      reset: function(element, delay){
        setTimeout(function(){MatrixSlider.matrix3d.reset(element);}, delay);
        return this;
      },
      zIndex: function(element, n){
        MatrixSlider.matrix3d.zIndex(element, n);
        return this;
      },
      tilt: function(element, existingFrame, existingMatrices){
        var el = element,
        frame = existingFrame || 0,
        duration = 600,
        rotation = 0.15,
        matrices = existingMatrices || {},
        frameMatrixArray = [],
        initialMatrix = matrices.initialMatrix || MatrixSlider.matrix3d.getComputedMatrix(el),
        rY = matrices.rY || MatrixSlider.matrix3d.baseMatrix.slice(0),
        rYfreq = root.animate._easeOut(frame / duration, 6) * (Math.PI * rotation),
        tiltComplete = new CustomEvent('tiltComplete');
        tiltStart = frame === 0 ? new Date().getTime() : tiltStart;
        document.addEventListener('mouseup', root.events.flipHandler, false);
        rY[0] = Math.cos(rYfreq);
        rY[2] = -Math.sin(rYfreq);
        rY[8] = Math.sin(rYfreq);
        rY[10] = Math.cos(rYfreq);
        frameMatrixArray = MatrixSlider.matrix3d.x(initialMatrix, rY);
        if(duration >= frame){
          root.animate._setFrame(el, frameMatrixArray);
          tiltProgress = root.animate._easeOut(frame/ duration) * rotation;
          frame = frame + 1;
          root.animate.id = window.requestAnimationFrame(function(){root.animate.tilt(el, frame, {initialMatrix: initialMatrix, rY: rY});});
        }else{
          window.cancelAnimationFrame(root.animate.id);
          el.dispatchEvent(tiltComplete);
        }
        return this;
      },
      flip: function(element, energy, existingFrame, existingMatrices){
        var el = element,
        frame = existingFrame || 0,
        matrices = existingMatrices || {},
        frameMatrixArray = [],
        initialMatrix = matrices.initialMatrix || MatrixSlider.matrix3d.getComputedMatrix(el),
        rY = matrices.rY || MatrixSlider.matrix3d.baseMatrix.slice(0),
        rYfreq = root.animate._easeOut(frame / energy.duration, 3) * (Math.PI * (energy.rotation + tiltProgress)),
        flipComplete = new CustomEvent('flipComplete');
        rY[0] = Math.cos(rYfreq);
        rY[2] = Math.sin(rYfreq);
        rY[8] = -Math.sin(rYfreq);
        rY[10] = Math.cos(rYfreq);
        frameMatrixArray = MatrixSlider.matrix3d.x(initialMatrix, rY);
        if(energy.duration >= frame){
          root.animate._setFrame(el, frameMatrixArray);
          frame = frame + 1;
          root.animate.id = window.requestAnimationFrame(function(){root.animate.flip(el, energy, frame, {initialMatrix: initialMatrix, rY: rY});});
        }else{
          window.cancelAnimationFrame(root.animate.id);
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
        initialMatrix = matrices.initialMatrix || MatrixSlider.matrix3d.getComputedMatrix(el),
        tZ = matrices.tZ || MatrixSlider.matrix3d.baseMatrix.slice(0);
        tZ[15] = -root.animate._easeOutElastic(frame/duration);
        frameMatrixArray = MatrixSlider.matrix3d.x(initialMatrix, tZ);
        if(1 >= frame/duration){
          root.animate._setFrame(el, frameMatrixArray);
          frame = frame + 1;
          root.animate.id = window.requestAnimationFrame(function(){root.animate.drop(el, frame, {initialMatrix: initialMatrix, tZ: tZ});});
        }else{
          frameMatrixArray[15] = 1;
          root.animate._setFrame(el, frameMatrixArray);
          window.cancelAnimationFrame(root.animate.id);
        }
        return this;
      },
      _flipEnergy: function(){
        var time = 0,
        progress = 0,
        energy = {};
        tiltStop = new Date().getTime();
        time = tiltStop - tiltStart;
        progress = time / 10000;
        energy.duration = Math.floor(progress * 180 + 60);
        energy.rotation = Math.floor(progress * 31) % 2 === 1 ? Math.floor(progress * 31) : Math.floor(progress * 31) + 1;
        return energy;
      },
      _easeOut: function(n, strength){
        var s = strength || 3;
        return Math.pow(n, 1 / s);
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
    };

    for(i = 0, max = childNodes.length; i < max; i++){
      if('#text' !== childNodes[i].nodeName){
        elementsArray.push(childNodes[i]);
      }
    }

    currentElement = elementsArray[0];

    root.animate.zIndex(currentElement, 1).drop(currentElement);

    for(i = 0, max = elementsArray.length; i < max; i++){
      elementsArray[i].addEventListener('mousedown', root.events.tiltHandler, false);
      elementsArray[i].addEventListener('flipComplete', root.events.dropHandler, false);
    }

  };

  MatrixSlider.matrix3d = {
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
        m = MatrixSlider.matrix3d.baseMatrix.slice(0);
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
  };

  if('complete' === document.readyState){
    new MatrixSlider(document.getElementById('slider'));
  }else{
    window.addEventListener('load', function(){
    new MatrixSlider(document.getElementById('slider'));
    }, false);
  }
}(this, document));
