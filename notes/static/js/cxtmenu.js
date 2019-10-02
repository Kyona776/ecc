// context menu function

import d3 from 'd3';

// mousedown
// situations:body, node, links 

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

var cxtmenu = function cxtmenu(param){
  d3 = this;
  options = Object.assign(defaults, params);

}

export default cxtmenu();