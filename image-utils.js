/*!
 * jQuery imagesLoaded plugin v1.1.0
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */

(function($, undefined) {

	// $('#my-container').imagesLoaded(myFunction)
	// or
	// $('img').imagesLoaded(myFunction)

	// execute a callback when all images have loaded.
	// needed because .load() doesn't work on cached images

	// callback function gets image collection as argument
	//  `this` is the container

	$.fn.imagesLoaded = function( callback ) {
		var $this = this,
		$images = $this.find('img').add( $this.filter('img') ),
		len = $images.length,
		blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
		loaded = [];

		function triggerCallback() {
			callback.call( $this, $images );
		}

		function imgLoaded( event ) {
			if ( event.target.src !== blank && $.inArray( this, loaded ) === -1 ){
				loaded.push(this);
				if ( --len <= 0 ){
					setTimeout( triggerCallback );
					$images.unbind( '.imagesLoaded', imgLoaded );
				}
			}
		}

		// if no images, trigger immediately
		if ( !len ) {
			triggerCallback();
		}

		$images.bind( 'load.imagesLoaded error.imagesLoaded',  imgLoaded ).each( function() {
			// cached images don't fire load sometimes, so we reset src.
			var src = this.src;
			// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
			// data uri bypasses webkit log warning (thx doug jones)
			this.src = blank;
			this.src = src;
		});
		return $this;
	};
	
	// Disable image Defaults for all images inside the selected element
	
	$.fn.disableImageDefaults = function(){
		var $this = this,
		$images = $this.find('img').add( $this.filter('img') );
		
		$images.removeAttr("alt", "")
		.removeAttr("title", "")
		.css({
			"-webkit-user-select": "none",
			"-moz-user-select":"none"
		})
		$images.bind("contextmenu",function(){
			return false;
		});
		$images.bind("mousedown",function(){
			return false;
		});
	}

	// Fit Images inside a container
	
	$.fn.fitImages = function(options){

		var $el = $(this),
			$images,
			settings;
		
		var defaults = {
			container: $el.parents("div"),
			crop: true,
			centered: true,
			absolute: true,
			width: false,
			height: false
		}
		
		if (options) {
			settings = $.extend(defaults, options); // Pull from both defaults and supplied options
		} else {
			settings = $.extend(defaults);// Only pull from default settings
		}
		
		var container = settings.container,
		 	crop = settings.crop,
			centered = settings.centered,
			absolute = settings.absolute,
			fitWidth = settings.width,
			fitHeight = settings.height;
		
		if(!fitWidth) fitWidth = container.width();
		if(!fitHeight) fitHeight = container.height();
		
		if($el.selector == "img") {
			$images = $el;
		} else {
			$images = $el.find("img");
		}
		
		$images.each(function(){
			fitImage($(this));
		})
		
		
		function fitImage($image){
			var containerRatio = fitWidth / fitHeight;
			var imageRatio = $image.width() / $image.height();

			var firstRatio;
			var secondRatio;

			var origWidth = imgWidth = $image.width();
			var origHeight = imgHeight = $image.height();

			if(crop == true){
				firstRatio = imageRatio;
				secondRatio = containerRatio;
			} else {
				firstRatio = containerRatio;
				secondRatio = imageRatio;
			}
			//
			if (firstRatio < secondRatio) {
				imgWidth = fitWidth;
				imgHeight = imgWidth * origHeight / origWidth;
				$image.css('width', imgWidth);
				$image.css("height", imgHeight);
			} else {
				imgHeight = fitHeight;
				imgWidth = imgHeight * origWidth / origHeight;
				$image.css('height', imgHeight);
				$image.css('width', imgWidth);
			}
			if(centered){
				if(absolute){
					$image.css({
						'position': 'absolute',
						'left': fitWidth / 2 - imgWidth / 2 + 'px',
						'top': fitHeight / 2 - imgHeight / 2 + 'px'
					});
				} else {
					$image.css({
						'position': 'relative',
						'margin-left': fitWidth / 2 - imgWidth / 2 + 'px',
						'margin-top': fitHeight / 2 - imgHeight / 2 + 'px'
					});
				}
			}
		}
		
		
	}

})(jQuery);