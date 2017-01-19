/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2017, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	// Helper vars and functions.
	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	// From https://davidwalsh.name/javascript-debounce-function.
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};
	
	// Check if clip-path is supported. From http://stackoverflow.com/a/30041538.
	function areClipPathShapesSupported() {
		var base = 'clipPath',
			prefixes = [ 'webkit', 'moz', 'ms', 'o' ],
			properties = [ base ],
			testElement = document.createElement( 'testelement' ),
			attribute = 'polygon(50% 0%, 0% 100%, 100% 100%)';

		// Push the prefixed properties into the array of properties.
		for ( var i = 0, l = prefixes.length; i < l; i++ ) {
			var prefixedProperty = prefixes[i] + base.charAt( 0 ).toUpperCase() + base.slice( 1 ); // remember to capitalize!
			properties.push( prefixedProperty );
		}

		// Iterate over the properties and see if they pass two tests.
		for ( var i = 0, l = properties.length; i < l; i++ ) {
			var property = properties[i];

			// First, they need to support clip-path (IE <= 11 does not)...
			if ( testElement.style[property] === '' ) {

				// Second, we need to see what happens when we try to create a CSS shape...
				testElement.style[property] = attribute;
				if ( testElement.style[property] !== '' ) {
					return true;
				}
			}
		}
		return false;
	};

	// From http://www.quirksmode.org/js/events_properties.html#position
	function getMousePos(e) {
		var posx = 0, posy = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x : posx, y : posy }
	}

	// Returns a random number between min and max (inclusive).
	function getRandom(min, max) {
		return Math.random() * (max - min + 1) + min;
	}

	// Check for clip-path support.
	const isClipPathSupported = areClipPathShapesSupported();

	/**
	 * FragmentsFx obj.
	 */
	function FragmentsFx(el, options) {
		this.el = el;
		this.options = extend({}, this.options);
		extend(this.options, options);
		// Preload the element´s background image.
		var self = this;
		imagesLoaded(this.el, { background: true }, function() { self._init(); });
	}

	/**
	 * FragmentsFx default options.
	 */
	FragmentsFx.prototype.options = {
		// Number of fragments.
		fragments: 25, 
		// The boundaries of the fragment translation (pixel values).
		boundaries: {x1: 100, x2: 100, y1: 50, y2: 50},
		// The area of the fragments in percentage values (clip-path).
		// We can also use random values by setting options.area to "random".
		area: 'random',
		/* example with 4 fragments (percentage values)
		[{top: 80, left: 10, width: 3, height: 20},{top: 2, left: 2, width: 4, height: 40},{top: 30, left: 60, width: 3, height: 60},{top: 10, left: 20, width: 50, height: 6}]
		*/
		// If using area:"random", we can define the area´s minimum and maximum values for the clip-path. (percentage values)
		randomIntervals: {
			top: {min: 0,max: 90},
			left: {min: 0,max: 90},
			// Either the width or the height will be selected with a fixed value (+- 0.1) for the other dimension (percentage values).
			dimension: {
				width: {min: 10,max: 60, fixedHeight: 1.1},
				height: {min: 10,max: 60, fixedWidth: 1.1}
			}
		},
		parallax: false,
		// Range of movement for the parallax effect (pixel values).
		randomParallax: {min: 10, max: 150}
	};

	/**
	 * Init. Create the layout and initialize/bind events.
	 */
	FragmentsFx.prototype._init = function() {
		// The dimensions of the main element.
		this.dimensions = {width: this.el.offsetWidth, height: this.el.offsetHeight};
		// The source of the main image.
		this.imgsrc = this.el.style.backgroundImage.replace('url(','').replace(')','').replace(/\"/gi, "");;
		// Render all the fragments defined in the options.
		this._layout();
		// Init/Bind events
		this._initEvents();
	};

	/**
	 * Init/Bind events.
	 */
	FragmentsFx.prototype._initEvents = function() {
		const self = this;

		// Parallax movement.
		if( this.options.parallax ) {
			this.mousemoveFn = function(ev) {
				requestAnimationFrame(function() {
					// Mouse position relative to the document.
					const mousepos = getMousePos(ev),
						// Document scrolls.
						docScrolls = {left : document.body.scrollLeft + document.documentElement.scrollLeft, top : document.body.scrollTop + document.documentElement.scrollTop},
						bounds = self.el.getBoundingClientRect(),
						// Mouse position relative to the main element (this.el).
						relmousepos = { x : mousepos.x - bounds.left - docScrolls.left, y : mousepos.y - bounds.top - docScrolls.top };

					// Movement settings for the animatable elements.
					for(var i = 0, len = self.fragments.length; i <= len-1; ++i) {
						const fragment = self.fragments[i],
							t = fragment.getAttribute('data-parallax'),
							transX = t/(self.dimensions.width)*relmousepos.x - t/2,
							transY = t/(self.dimensions.height)*relmousepos.y - t/2;

							fragment.style.transform = fragment.style.WebkitTransform = 'translate3d(' + transX + 'px,' + transY + 'px,0)';
					}
				});
			};
			this.el.addEventListener('mousemove', this.mousemoveFn);

			this.mouseleaveFn = function(ev) {
				requestAnimationFrame(function() {
					// Movement settings for the animatable elements.
					for(var i = 0, len = self.fragments.length; i <= len-1; ++i) {
						const fragment = self.fragments[i];
						fragment.style.transform = fragment.style.WebkitTransform = 'translate3d(0,0,0)';
					}
				});
			};
			this.el.addEventListener('mouseleave', this.mouseleaveFn);
		}

		// Window resize - Recalculate clip values and translations.
		this.debounceResize = debounce(function(ev) {
			// total elements/configuration
			const areasTotal = self.options.area.length;
			// Recalculate dimensions.
			self.dimensions = {width: self.el.offsetWidth, height: self.el.offsetHeight};
			// recalculate the clip/clip-path and translations
			for(var i = 0, len = self.fragments.length; i <= len-1; ++i) {
				self._positionFragment(i, self.fragments[i].querySelector('.fragment__piece'));
			}
		}, 10);
		window.addEventListener('resize', this.debounceResize);
	};

	/**
	 * Renders all the fragments defined in the FragmentsFx.prototype.options
	 */
	FragmentsFx.prototype._layout = function() {
		// Create the fragments and add them to the DOM (append it to the main element).
		this.fragments = [];
		for (var i = 0, len = this.options.fragments; i < len; ++i) {
			const fragment = this._createFragment(i);
			this.fragments.push(fragment);
		}
	};

	/**
	 * Create a fragment.
	 */
	FragmentsFx.prototype._createFragment = function(pos) {
		var fragment = document.createElement('div');
		fragment.className = 'fragment';
		// Set up a random number for the translation of the fragment when using parallax (mousemove).
		if( this.options.parallax ) {
			fragment.setAttribute('data-parallax', getRandom(this.options.randomParallax.min,this.options.randomParallax.max));
		}
		// Create the fragment "piece" on which we define the clip-path configuration and the background image.
		var piece = document.createElement('div');
		piece.style.backgroundImage = 'url(' + this.imgsrc + ')';
		piece.className = 'fragment__piece';
		piece.style.backgroundImage = 'url(' + this.imgsrc + ')';
		this._positionFragment(pos, piece);
		fragment.appendChild(piece);
		this.el.appendChild(fragment);
		
		return fragment;
	};

	FragmentsFx.prototype._positionFragment = function(pos, piece) {
		const isRandom = this.options.area === 'random',
			  data = this.options.area[pos],
			  top = isRandom ? getRandom(this.options.randomIntervals.top.min,this.options.randomIntervals.top.max) : data.top,
			  left = isRandom ? getRandom(this.options.randomIntervals.left.min,this.options.randomIntervals.left.max) : data.left;

		// Select either the width or the height with a fixed value for the other dimension.
		var width, height;

		if( isRandom ) {
			if(!!Math.round(getRandom(0,1))) {
				width = getRandom(this.options.randomIntervals.dimension.width.min,this.options.randomIntervals.dimension.width.max);
				height = getRandom(Math.max(this.options.randomIntervals.dimension.width.fixedHeight-0.1,0.1), this.options.randomIntervals.dimension.width.fixedHeight+0.1);
			}
			else {
				height = getRandom(this.options.randomIntervals.dimension.width.min,this.options.randomIntervals.dimension.width.max);
				width = getRandom(Math.max(this.options.randomIntervals.dimension.height.fixedWidth-0.1,0.1), this.options.randomIntervals.dimension.height.fixedWidth+0.1);
			}
		}
		else {
			width = data.width;
			height = data.height;
		}

		if( !isClipPathSupported ) {
			const clipTop = top/100 * this.dimensions.height,
				  clipLeft = left/100 * this.dimensions.width,
				  clipRight = width/100 * this.dimensions.width + clipLeft,
				  clipBottom = height/100 * this.dimensions.height + clipTop;

			piece.style.clip = 'rect(' + clipTop + 'px,' + clipRight + 'px,' + clipBottom + 'px,' + clipLeft + 'px)';
		}
		else {
			piece.style.WebkitClipPath = piece.style.clipPath = 'polygon(' + left + '% ' + top + '%, ' + (left + width) + '% ' + top + '%, ' + (left + width) + '% ' + (top + height) + '%, ' + left + '% ' + (top + height) + '%)';
		}

		// Translate the piece.
		// The translation has to respect the boundaries defined in the options.
		const translation = {
				x: getRandom(-1 * left/100 * this.dimensions.width - this.options.boundaries.x1, this.dimensions.width - left/100 * this.dimensions.width + this.options.boundaries.x2 - width/100 * this.dimensions.width),
				y: getRandom(-1 * top/100 * this.dimensions.height - this.options.boundaries.y1, this.dimensions.height - top/100 * this.dimensions.height + this.options.boundaries.y2 - height/100 * this.dimensions.height)
			  };

		piece.style.WebkitTransform = piece.style.transform = 'translate3d(' + translation.x + 'px,' + translation.y +'px,0)';
	};

	window.FragmentsFx = FragmentsFx;

})(window);