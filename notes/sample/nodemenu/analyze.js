var cxtmenu = function cxtmenu(params) {
    var options = assign({}, defaults, params);
    var cy = this;
    var container = cy.container(); // cyptoscape.js の container: document.getElementById('cy') つまり D3.jsでいうsvgらへん
    var target = void 0;
  
    var data = {
      options: options,
      handlers: [],
      container: createElement({ class: 'cxtmenu' })
    };
  
    var wrapper = data.container;
    var parent = createElement();
    var canvas = createElement({ tag: 'canvas' });
    var commands = [];
    var c2d = canvas.getContext('2d');
    var r = options.menuRadius;
    var containerSize = (r + options.activePadding) * 2;
    var activeCommandI = void 0;
    var offset = void 0;
  
    container.insertBefore(wrapper, container.firstChild);
    wrapper.appendChild(parent);
    parent.appendChild(canvas);
  
    setStyles(wrapper, {
      position: 'absolute',
      zIndex: options.zIndex,
      userSelect: 'none',
      pointerEvents: 'none' // prevent events on menu in modern browsers
    });
  
    // prevent events on menu in legacy browsers
    ['mousedown', 'mousemove', 'mouseup', 'contextmenu'].forEach(function (evt) {
      wrapper.addEventListener(evt, function (e) {
        e.preventDefault();
        // [func(i) for i in [.....]]: と同じ
  
        return false;
      });
    });
  
    setStyles(parent, {
      display: 'none',
      width: containerSize + 'px',
      height: containerSize + 'px',
      position: 'absolute',
      zIndex: 1,
      marginLeft: -options.activePadding + 'px',
      marginTop: -options.activePadding + 'px',
      userSelect: 'none'
    });
  
    canvas.width = containerSize;
    canvas.height = containerSize;
  
    function createMenuItems() {
      removeEles('.cxtmenu-item', parent);
      var dtheta = 2 * Math.PI / commands.length;
      var theta1 = Math.PI / 2;
      var theta2 = theta1 + dtheta;
  
      for (var i = 0; i < commands.length; i++) {
        var command = commands[i];
  
        var midtheta = (theta1 + theta2) / 2;
        var rx1 = 0.66 * r * Math.cos(midtheta);
        var ry1 = 0.66 * r * Math.sin(midtheta);
  
        var item = createElement({ class: 'cxtmenu-item' });
        setStyles(item, {
          color: options.itemColor,
          cursor: 'default',
          display: 'table',
          'text-align': 'center',
          //background: 'red',
          position: 'absolute',
          'text-shadow': '-1px -1px 2px ' + options.itemTextShadowColor + ', 1px -1px 2px ' + options.itemTextShadowColor + ', -1px 1px 2px ' + options.itemTextShadowColor + ', 1px 1px 1px ' + options.itemTextShadowColor,
          left: '50%',
          top: '50%',
          'min-height': r * 0.66 + 'px',
          width: r * 0.66 + 'px',
          height: r * 0.66 + 'px',
          marginLeft: rx1 - r * 0.33 + 'px',
          marginTop: -ry1 - r * 0.33 + 'px'
        });
  
        var content = createElement({ class: 'cxtmenu-content' });
  
        if (command.content instanceof HTMLElement) {
          content.appendChild(command.content);
        } else {
          content.innerHTML = command.content;
        }
  
        setStyles(content, {
          'width': r * 0.66 + 'px',
          'height': r * 0.66 + 'px',
          'vertical-align': 'middle',
          'display': 'table-cell'
        });
  
        setStyles(content, command.contentStyle || {});
  
        if (command.disabled === true || command.enabled === false) {
          content.setAttribute('class', 'cxtmenu-content cxtmenu-disabled');
        }
  
        parent.appendChild(item);
        item.appendChild(content);
  
        theta1 += dtheta;
        theta2 += dtheta;
      }
    }
  
    function queueDrawBg(rspotlight) {
      redrawQueue.drawBg = [rspotlight];
    }
  
    function drawBg(rspotlight) {
      rspotlight = rspotlight !== undefined ? rspotlight : rs;
  
      c2d.globalCompositeOperation = 'source-over';
  
      c2d.clearRect(0, 0, containerSize, containerSize);
  
      // draw background items
      c2d.fillStyle = options.fillColor;
      var dtheta = 2 * Math.PI / commands.length;
      var theta1 = Math.PI / 2;
      var theta2 = theta1 + dtheta;
  
      for (var index = 0; index < commands.length; index++) {
        var command = commands[index];
  
        if (command.fillColor) {
          c2d.fillStyle = command.fillColor;
        }
        c2d.beginPath();
        c2d.moveTo(r + options.activePadding, r + options.activePadding);
        c2d.arc(r + options.activePadding, r + options.activePadding, r, 2 * Math.PI - theta1, 2 * Math.PI - theta2, true);
        c2d.closePath();
        c2d.fill();
  
        theta1 += dtheta;
        theta2 += dtheta;
  
        c2d.fillStyle = options.fillColor;
      }
  
      // draw separators between items
      c2d.globalCompositeOperation = 'destination-out';
      c2d.strokeStyle = 'white';
      c2d.lineWidth = options.separatorWidth;
      theta1 = Math.PI / 2;
      theta2 = theta1 + dtheta;
  
      for (var i = 0; i < commands.length; i++) {
        var rx1 = r * Math.cos(theta1);
        var ry1 = r * Math.sin(theta1);
        c2d.beginPath();
        c2d.moveTo(r + options.activePadding, r + options.activePadding);
        c2d.lineTo(r + options.activePadding + rx1, r + options.activePadding - ry1);
        c2d.closePath();
        c2d.stroke();
  
        theta1 += dtheta;
        theta2 += dtheta;
      }
  
      c2d.fillStyle = 'white';
      c2d.globalCompositeOperation = 'destination-out';
      c2d.beginPath();
      c2d.arc(r + options.activePadding, r + options.activePadding, rspotlight + options.spotlightPadding, 0, Math.PI * 2, true);
      c2d.closePath();
      c2d.fill();
  
      c2d.globalCompositeOperation = 'source-over';
    }
  
    function queueDrawCommands(rx, ry, theta) {
      redrawQueue.drawCommands = [rx, ry, theta];
    }
  
    function drawCommands(rx, ry, theta) {
      var dtheta = 2 * Math.PI / commands.length;
      var theta1 = Math.PI / 2;
      var theta2 = theta1 + dtheta;
  
      theta1 += dtheta * activeCommandI;
      theta2 += dtheta * activeCommandI;
  
      c2d.fillStyle = options.activeFillColor;
      c2d.strokeStyle = 'black';
      c2d.lineWidth = 1;
      c2d.beginPath();
      c2d.moveTo(r + options.activePadding, r + options.activePadding);
      c2d.arc(r + options.activePadding, r + options.activePadding, r + options.activePadding, 2 * Math.PI - theta1, 2 * Math.PI - theta2, true);
      c2d.closePath();
      c2d.fill();
  
      c2d.fillStyle = 'white';
      c2d.globalCompositeOperation = 'destination-out';
  
      var tx = r + options.activePadding + rx / r * (rs + options.spotlightPadding - options.indicatorSize / 4);
      var ty = r + options.activePadding + ry / r * (rs + options.spotlightPadding - options.indicatorSize / 4);
      var rot = Math.PI / 4 - theta;
  
      c2d.translate(tx, ty);
      c2d.rotate(rot);
  
      // clear the indicator
      c2d.beginPath();
      c2d.fillRect(-options.indicatorSize / 2, -options.indicatorSize / 2, options.indicatorSize, options.indicatorSize);
      c2d.closePath();
      c2d.fill();
  
      c2d.rotate(-rot);
      c2d.translate(-tx, -ty);
  
      // c2d.setTransform( 1, 0, 0, 1, 0, 0 );
  
      // clear the spotlight
      c2d.beginPath();
      c2d.arc(r + options.activePadding, r + options.activePadding, rs + options.spotlightPadding, 0, Math.PI * 2, true);
      c2d.closePath();
      c2d.fill();
  
      c2d.globalCompositeOperation = 'source-over';
    }
  
    function updatePixelRatio() {
      var pxr = getPixelRatio();
      var w = containerSize;
      var h = containerSize;
  
      canvas.width = w * pxr;
      canvas.height = h * pxr;
  
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
  
      c2d.setTransform(1, 0, 0, 1, 0, 0);
      c2d.scale(pxr, pxr);
    }
  
    var redrawing = true;
    var redrawQueue = {};
  
    var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function (fn) {
      return setTimeout(fn, 16);
    };
  
    var redraw = function redraw() {
      if (redrawQueue.drawBg) {
        drawBg.apply(null, redrawQueue.drawBg);
      }
  
      if (redrawQueue.drawCommands) {
        drawCommands.apply(null, redrawQueue.drawCommands);
      }
  
      redrawQueue = {};
  
      if (redrawing) {
        raf(redraw);
      }
    };
  
    // kick off
    updatePixelRatio();
    redraw();
  
    var ctrx = void 0,
        ctry = void 0,
        rs = void 0;
  
    var bindings = {
      on: function on(events, selector, fn) {
  
        var _fn = fn;
        if (selector === 'core') {
          _fn = function _fn(e) {
            if (e.cyTarget === cy || e.target === cy) {
              // only if event target is directly core
              return fn.apply(this, [e]);
            }
          };
        }
  
        data.handlers.push({
          events: events,
          selector: selector,
          fn: _fn
        });
  
        if (selector === 'core') {
          cy.on(events, _fn);
        } else {
          cy.on(events, selector, _fn);
        }
  
        return this;
      }
    };
  
    function addEventListeners() {
      var grabbable = void 0;
      var inGesture = false;
      var dragHandler = void 0;
      var zoomEnabled = void 0;
      var panEnabled = void 0;
      var boxEnabled = void 0;
      var gestureStartEvent = void 0;
  
      var restoreZoom = function restoreZoom() {
        if (zoomEnabled) {
          cy.userZoomingEnabled(true);
        }
      };
  
      var restoreGrab = function restoreGrab() {
        if (grabbable) {
          target.grabify();
        }
      };
  
      var restorePan = function restorePan() {
        if (panEnabled) {
          cy.userPanningEnabled(true);
        }
      };
  
      var restoreBoxSeln = function restoreBoxSeln() {
        if (boxEnabled) {
          cy.boxSelectionEnabled(true);
        }
      };
  
      var restoreGestures = function restoreGestures() {
        restoreGrab();
        restoreZoom();
        restorePan();
        restoreBoxSeln();
      };
  
      window.addEventListener('resize', updatePixelRatio);
  
      bindings.on('resize', function () {
        updatePixelRatio();
      }).on(options.openMenuEvents, options.selector, function (e) {
        target = this; // Remember which node the context menu is for
        var ele = this;
        var isCy = this === cy;
  
        if (inGesture) {
          parent.style.display = 'none';
  
          inGesture = false;
  
          restoreGestures();
        }
  
        if (typeof options.commands === 'function') {
          var res = options.commands(target);
          if (res.then) {
            res.then(function (_commands) {
              commands = _commands;
              openMenu();
            });
          } else {
            commands = res;
            openMenu();
          }
        } else {
          commands = options.commands;
          openMenu();
        }
  
        function openMenu() {
          if (!commands || commands.length === 0) {
            return;
          }
  
          zoomEnabled = cy.userZoomingEnabled();
          cy.userZoomingEnabled(false);
  
          panEnabled = cy.userPanningEnabled();
          cy.userPanningEnabled(false);
  
          boxEnabled = cy.boxSelectionEnabled();
          cy.boxSelectionEnabled(false);
  
          grabbable = target.grabbable && target.grabbable();
          if (grabbable) {
            target.ungrabify();
          }
  
          var rp = void 0,
              rw = void 0,
              rh = void 0;
          if (!isCy && ele.isNode() && !ele.isParent() && !options.atMouse) {
            rp = ele.renderedPosition();
            rw = ele.renderedWidth();
            rh = ele.renderedHeight();
          } else {
            rp = e.renderedPosition || e.cyRenderedPosition;
            rw = 1;
            rh = 1;
          }
  
          offset = getOffset(container);
  
          ctrx = rp.x;
          ctry = rp.y;
  
          createMenuItems();
  
          setStyles(parent, {
            display: 'block',
            left: rp.x - r + 'px',
            top: rp.y - r + 'px'
          });
  
          rs = Math.max(rw, rh) / 2;
          rs = Math.max(rs, options.minSpotlightRadius);
          rs = Math.min(rs, options.maxSpotlightRadius);
  
          queueDrawBg();
  
          activeCommandI = undefined;
  
          inGesture = true;
          gestureStartEvent = e;
        }
      }).on('cxtdrag tapdrag', options.selector, dragHandler = function dragHandler(e) {
  
        if (!inGesture) {
          return;
        }
  
        var origE = e.originalEvent;
        var isTouch = origE.touches && origE.touches.length > 0;
  
        var pageX = isTouch ? origE.touches[0].pageX : origE.pageX;
        var pageY = isTouch ? origE.touches[0].pageY : origE.pageY;
  
        activeCommandI = undefined;
  
        var dx = pageX - offset.left - ctrx;
        var dy = pageY - offset.top - ctry;
  
        if (dx === 0) {
          dx = 0.01;
        }
  
        var d = Math.sqrt(dx * dx + dy * dy);
        var cosTheta = (dy * dy - d * d - dx * dx) / (-2 * d * dx);
        var theta = Math.acos(cosTheta);
  
        if (d < rs + options.spotlightPadding) {
          queueDrawBg();
          return;
        }
  
        queueDrawBg();
  
        var rx = dx * r / d;
        var ry = dy * r / d;
  
        if (dy > 0) {
          theta = Math.PI + Math.abs(theta - Math.PI);
        }
  
        var dtheta = 2 * Math.PI / commands.length;
        var theta1 = Math.PI / 2;
        var theta2 = theta1 + dtheta;
  
        for (var i = 0; i < commands.length; i++) {
          var command = commands[i];
  
          var inThisCommand = theta1 <= theta && theta <= theta2 || theta1 <= theta + 2 * Math.PI && theta + 2 * Math.PI <= theta2;
  
          if (command.disabled === true || command.enabled === false) {
            inThisCommand = false;
          }
  
          if (inThisCommand) {
            activeCommandI = i;
            break;
          }
  
          theta1 += dtheta;
          theta2 += dtheta;
        }
  
        queueDrawCommands(rx, ry, theta);
      }).on('tapdrag', dragHandler).on('cxttapend tapend', function () {
        parent.style.display = 'none';
  
        if (activeCommandI !== undefined) {
          var select = commands[activeCommandI].select;
  
          if (select) {
            select.apply(target, [target, gestureStartEvent]);
            activeCommandI = undefined;
          }
        }
  
        inGesture = false;
  
        restoreGestures();
      });
    }
  
    function removeEventListeners() {
      var handlers = data.handlers;
  
      for (var i = 0; i < handlers.length; i++) {
        var h = handlers[i];
  
        if (h.selector === 'core') {
          cy.off(h.events, h.fn);
        } else {
          cy.off(h.events, h.selector, h.fn);
        }
      }
  
      window.removeEventListener('resize', updatePixelRatio);
    }
  
    function destroyInstance() {
      redrawing = false;
  
      removeEventListeners();
  
      wrapper.remove();
    }
  
    addEventListeners();
  
    return {
      destroy: function destroy() {
        destroyInstance();
      }
    };
  };