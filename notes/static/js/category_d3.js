// context menu function

//import d3 from 'd3';

// mousedown
// situations:body, node, links 

// need need alter all ECS2015 meth to d3 methods instead

var removeEles = function removeEles(query) {
  var ancestor = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

  var els = ancestor.querySelectorAll(query);

  for (var i = 0; i < els.length; i++) {
      var el = els[i];

      el.parentNode.removeChild(el);
  }
};


var setStyles = function setStyles(el, style) {
  var props = Object.keys(style);

  for (var i = 0, l = props.length; i < l; i++) {
      el.style[props[i]] = style[props[i]];
  }
};

var createElement = function createElement(options) {
  options = options || {};

  var el = document.createElement(options.tag || 'div');

  el.className = options.class || '';

  if (options.style) {
      setStyles(el, options.style);
  }

  return el;
};

var getPixelRatio = function getPixelRatio() {
  return window.devicePixelRatio || 1;
};

var getOffset = function getOffset(el) {
  var offset = el.getBoundingClientRect();

  return {
      left: offset.left + document.body.scrollLeft + parseFloat(getComputedStyle(document.body)['padding-left']) + parseFloat(getComputedStyle(document.body)['border-left-width']),
      top: offset.top + document.body.scrollTop + parseFloat(getComputedStyle(document.body)['padding-top']) + parseFloat(getComputedStyle(document.body)['border-top-width'])
  };
};

var defaults = {
  menuRadius: 100, // the radius of the circular menu in pixels
  selector: 'node', // elements matching this Cytoscape.js selector will trigger cxtmenus
  commands: [// an array of commands to list in the menu or a function that returns the array
    /*
    { // example command
      fillColor: 'rgba(200, 200, 200, 0.75)', // optional: custom background color for item
      content: 'a command name' // html/text content to be displayed in the menu
      contentStyle: {}, // css key:value pairs to set the command's css in js if you want
      select: function(ele){ // a function to execute when the command is selected
        console.log( ele.id() ) // `ele` holds the reference to the active element
      },
      enabled: true // whether the command is selectable
    }
    */
  ], // function( ele ){ return [ /*...*/ ] }, // example function for commands
  fillColor: 'rgba(0, 0, 0, 0.75)', // the background colour of the menu
  activeFillColor: 'rgba(1, 105, 217, 0.75)', // the colour used to indicate the selected command
  activePadding: 20, // additional size in pixels for the active command
  indicatorSize: 24, // the size in pixels of the pointer to the active command
  separatorWidth: 3, // the empty spacing in pixels between successive commands
  spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
  minSpotlightRadius: 24, // the minimum radius in pixels of the spotlight
  maxSpotlightRadius: 38, // the maximum radius in pixels of the spotlight
  openMenuEvents: 'mousedown', // set d3 event to open menu
  itemColor: 'white', // the colour of text in the command's content
  itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
  zIndex: 9999, // the z-index of the ui div
  atMouse: false // draw menu at mouse position
};


var assign = Object.assign != null ? Object.assign.bind(Object) : function (tgt) {
  for (var _len = arguments.length, srcs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    srcs[_key - 1] = arguments[_key];
  }

  srcs.filter(function (src) {
    return src != null;
  }).forEach(function (src) {
    Object.keys(src).forEach(function (k) {
      return tgt[k] = src[k];
    });
  });

  return tgt;
};


//var d3 = require('d3');
var cxtmenu = function cxtmenu(params, element) {
  
    // assign : it seems like code set params as options if variable is given, otherwise sets defaults.
  var options = assign({}, defaults, params);
  //　options : menuRadius, activePadding, zIndex, activePadding, itemColor, itemTextShadowColor

  // cy = cyptoscape
  // in the html, cxtmenu is exported and overrid cyptoscape, then this return cyptoscape
  // normarl this return global object, window object is global obj in browser
  var cy = this;
  var container = element; // expect DOM obj 
  // cy.container() : get the html DOM elemnt in which the graph is visualised. a null value is returned if the instance is headless.
  // var container = cy.container();
  var target = void 0;

  var data = {
    options: options,
    handlers: [],
    container:function() { return createElement({ class: 'cxtmenu' }) }// create class 
    //container: 
  };
  var tags = {
    wrapper:'cxtmenu',
    parent:'div',
    canvas:'canvas'
  }

  var wrapper = container.insert(data.container,':first-child');
  //var parent = createElement(); // create div tag
  var parent = wrapper.append('div');
  //var canvas = createElement({ tag: 'canvas' });  // create canvas
  var canvas = parent.append('canvas');  // or svg
  var commands = [];
  var c2d = canvas.node().getContext('2d');
  var r = options.menuRadius;
  var containerSize = (r + options.activePadding) * 2;
  var activeCommandI = void 0;
  var offset = void 0;

  console.log(container);
  console.log(this); // undefind
  console.log(wrapper); // .cxtmenu 

  //container.insertBefore(wrapper, container.firstChild);
  //wrapper.appendChild(parent);

  setStyles(wrapper, {
    position: 'absolute',
    zIndex: options.zIndex,
    userSelect: 'none',
    pointerEvents: 'none' // prevent events on menu in modern browsers
  });

  // prevent events on menu in legacy browsers
  ['mousedown', 'mousemove', 'mouseup', 'contextmenu'].forEach(function (evt) {
    wrapper.on(evt, function (e) {
      e.preventDefault();

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


  // alter c2d with canvas.node.getContext("2d") 
  function drawBg(rspotlight) {
    rspotlight = rspotlight !== undefined ? rspotlight : rs;
    // c2d = createElement({ tag: 'canvas' }).getContext('2d')
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

  // change to svg
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

  // binding cxt and core and set evnet handler
  // selector : element
  var bindings = {
    on: function on(events, selector, fn) {
      // fn: function to apply to event

      var _fn = fn;
      if (selector === 'core') {
        _fn = function _fn(e) {  // e is event object contain many methods
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

      // alter to svg
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

  // wrapper = cyptospace.Container(): Get the HTML DOM element in which the graph is visualised.
  function destroyInstance() {
    redrawing = false;

    removeEventListeners();

    wrapper.remove();
  }

  // basically flow of program: 
  // updatePixel() -> restart() -> addEventListeners() -> return {destory:...}
  addEventListeners();
  console.log(container);

  return {
    destroy: function destroy() {
      destroyInstance();
    }
  };
};




// おそらくノード上の処理は全てrestartが請け負ってる
//　わからなかった部分の憶測として.on()で加えられた要素は一度加えられたらそのままhtml上で処理される？ javascript ではなのでrestart（）で
// 上のとうりhtml にはeventrigger/handdler機能がある


// 

// neo4j setting and generate nodes and links datasets
//var neo4j = require('neo4j-driver');


var driver = new neo4j.v1.driver(
  "bolt://neo4j:test@localhost:7687",
  neo4j.v1.auth.basic('', '')
);

//import cxtmenu from "./cxtmenu.js";

// set up initial  and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
// maybe should initialize nodes through node.js and js driver   

// ノードはidとreflexive の設定　lsastId の更新　links


//const nodes = [
//  { id: 0, reflexive: false },
//  { id: 1, reflexive: true },
//  { id: 2, reflexive: false }
//];
//let lastNodeId = 2;
//const links = [
//  { source: nodes[0], target: nodes[1], left: false, right: true },
//  { source: nodes[1], target: nodes[2], left: false, right: true }
//];
const nodes = [];
let lastNodeId = 0;
const links = [];
var session = driver.session()
session
  .run('MATCH (n:Categories), l = (n:Categories)-[rel]->() RETURN n, l ')
  .then( result=> {
    result.records.forEach( record => {
      console.log(record.get('n'));
      var node = {
        // id: uuid() uuid not in JSes6
        id : lastNodeId++,  // possible to proceed push id num into dic then proceed addtion process by set ++ after variable
        name: record.get('n').properties.category_name,
        reflexive: ''
        
      };

      if (record.get('n').properties.reflexive == 'false'){
        node.reflexive = false;
      }else{
        node.reflexive = true;
      }
      nodes.push(node);
      var link = {
        start:record.get('l').start.properties.category_name,
        end:record.get('l').end.properties.category_name
      }
      console.log(nodes,link);
    });
    session.close();
    driver.close();
    restart();
  })
  .catch( error => {
    console.log(error);
  });

// confirm inside of nodes
const wait = (sec) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, sec*1000);
    //setTimeout(() => {reject(new Error("エラー！"))}, sec*1000);
  });
};

async function checknodes() {
  try {
    await wait(10); // ここで10秒間止まります
    console.log(nodes)
    // ここに目的の処理を書きます。

  } catch (err) {
    console.error(err);
  }
}

mchecknodes();





// set up SVG for D3
// use D3 v5
//cosider to user d3-force for simulating physical directed force 

// svg ないでクリックで新しいノード作成部分を見つける

// ノードを複数消す時にforぶんが最初のselectedNodeの０indexから数えて偶数が削除できない
// .attr を使った処理でuncaugth error .attr がd3.js の中の.setAttarがfunctionではないとエラーが出る。

// django　とのデータ連携。: js の関数化と引数の入レルところ

const width = window.outerWidth;
const height = window.outerHeight;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select('body')
  .append('svg')
  .on('contextmenu', () => {
    d3.event.preventDefault();
    var cxt = function cxt(){
      var cy = this; // return whole html tags
      return cy
    };
    console.log(cxt());
    console.log('contextmenu!');

  })  // definition contextmenu = right click event
  .attr('width', width)
  .attr('height', height);


// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150)) 
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tick);  //tick はupdate用途？

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links
// <svg><defs>get this</dfs></svg> svg:defs
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
// ここでの<g>群は別々のまとまり
let path = svg.append('svg:g').selectAll('path');  // path : class for describing links
let circle = svg.append('svg:g').selectAll('g'); // node in <g></g>

// mouse event vars
// let selectedNode = null;
// let selectedNode = null;
let selectedNode = [];
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d) => {
    // const　で宣言して変数を作る
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = d.left ? 17 : 12;
    const targetPadding = d.right ? 17 : 12;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    // return で.attr で入れる実数を返す
    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old links
  path.exit().remove();

  // add new links
  path = path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode.splice(selectedNode.indexOf(d),1);
      restart();
    })
    .merge(path);

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', (d) => (selectedNode.indexOf(d) >= 0) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed('reflexive', (d) => d.reflexive);

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', (d) => (selectedNode.indexOf(d) >= 0) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id)).darker().toString())
    .classed('reflexive', (d) => d.reflexive)
    .on('mouseover', function (d) {
      // if (!mousedownNode || d === mousedownNode) return; // ここがおかしいので反応しない
      // if (d === selectedNode) return;
      if (selectedNode.indexOf(d) >= 0 ) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.3)');
    })
    .on('mouseout', function (d) {
      // if (!mousedownNode || d === mousedownNode) return;　// ここがおかしいので反応しない　!down || down てことは全部のノード　作者はどのような状況の時preventしたかったか？
      // おそらくクリックしてるのに　だと思うけど必要ない気がする　つまりクリックした時はpreventさせるべき？
      // てことでdown時prevent
      // if (d === selectedNode) return;
      if (selectedNode.indexOf(d) >= 0 ) return;
      // 
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      //selectedNode = (mousedownNode ===　selectedNode) ? null : mousedownNode; // if down === selected: selected = null else down
      // 課題：ドラッグ中はtransform とselected させないようにする
      if (selectedNode.indexOf(mousedownNode) >= 0 ){
        unselecte = selectedNode.indexOf(mousedownNode);
        selectedNode.splice(unselecte,1)
      }else{
        selectedNode.unshift(mousedownNode);
      }
      selectedLink = null;

      // if (selectedNode.indexOf(mousedownNode) >= 0){}

      // reposition drag line ここでドラック線を動的に生成している
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      // if (d === selectedNode) {
      var needle =  d3.select(this);
      if (selectedNode.indexOf(d) >= 0 ){
        d3.select(this).attr('transform', ''); // .attr を使うとuncaught error functionと間違えられてerrorが出る
        // その関係でdragline の更新が行われず動的に表現できなかった。
        //needle.attr('transform', '');
      }else{
        //d3.select(this).attr('transform', '1.5');
        needle.attr('transform', '1.3');
      }; // このやり方だと複数個選択することができないので　辞書を作るべき
      restart();
    })
    .on('mouseup', function (d) {
      if (!mousedownNode) return;


      // needed by FF　多分ここでドラッグせん確定？
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        links.push({ source, target, left: !isRight, right: isRight });
      }

      // select new link
      selectedLink = link;
      selectedNode.splice(selectedNode.indexOf(d),1);
      restart();
    });

  // show node name
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    .text((d) => d.name);// nodeのなまえ, node:featre:name

  circle = g.merge(circle);

  // set the graph in motion
  force
    .nodes(nodes)
    //.force('center', d3.forceCenter(width / 2, height / 2))
    .force('link').links(links);

  force.alphaTarget(0.3).restart();
}


// fix: need to conbine cxtmenu and create node with connecting neo4j
function mousedown() {　
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;  
  // 式がないreturnはwhileでいうbreak みたいな
  // そのまま下の式を実行しないで終了する。

  // insert new node at point
  const point = d3.mouse(this);
  const node = { id: ++lastNodeId, reflexive: false, x: point[0], y: point[1] }; 
  nodes.push(node);
  // push() メソッドは、配列の末尾に 1 つ以上の要素を追加することができます。また戻り値として新しい配列の要素数を返します。

  restart();
  console.log(this);
  console.log(cxtmenu({},svg).container);
  
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true); // ctrl というクラスをつける
    return;
  }

  if ((selectedNode.length==0) && !selectedLink) return;

  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // deblete
      if (selectedNode !== null) {
        // 偶数だけが削除されない
        //nodes.splice(nodes.indexOf(selectedNode), 1);
        for (let selectednode of selectedNode){
        //for (const node of nodes){
          console.log(nodes.length, selectedNode.length) // 根本的にfor段階で5,4,3と止まってる
          // 最初の数を起点として偶数がやはり飛ばされていることがわかった。
          if (selectedNode.indexOf(selectednode) >= 0){
            console.log(nodes.length);
            console.log(selectedNode.length);
            console.log(selectedNode.indexOf(selectednode))
            // 5つ洗濯した時5,4,3,と返したので偶数以外
            nodes.splice(nodes.indexOf(selectednode),1);
            selectedNode.splice(selectedNode.indexOf(selectednode),1);
            spliceLinksForNode(selectednode);
          }else{
            console.log('exception')
          }
        };
      } else if (selectedLink) {
        links.splice(links.indexOf(selectedLink), 1);
      }
      selectedLink = null;
      //selectedNode = null;
      restart();
      break;
    case 66: // B
      if (selectedLink) {
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      restart();
      break;
    case 76: // L
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      restart();
      break;
    case 82: // R
      if (selectedNode) {
        // toggle node reflexivity
        selectedNode.reflexive = !selectedNode.reflexive;
      } else if (selectedLink) {
        // set link direction to right only
        selectedLink.left = false;
        selectedLink.right = true;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

// app starts here
// svg : svg tag in body
svg.on('mousedown', mousedown)  // mousedown : 
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();