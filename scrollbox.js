/*
	Scrollbox Plugin for jQuery
	Version: v1.0

	Copyright (C) by Rasso Hilber, BASICS09
	
	Web:    www.basics09.de
	Email:  info@basics09.de
*/

(function($) {

	// defaults
	var defaults = {
		title: "",
		titleHtml: "",
		introHtml: "",
		detailsHtml: "",
		showDetailsButtonHtml: "show details",
		hideDetailsButtonHtml: "hide details",
		imageElements: [],
		marginRight: 0,
		marginBottom: 30,
		openCloseAnimation: "fade",
		onClose: undefined,
		onShowLoading: undefined,
		onHideLoading: undefined,
		onShowRewind: undefined,
		onHideRewind: undefined,
		onMoveToStart: undefined,
		onScrolled: undefined,
		closeButtonHtml: "close",
		nextPostLink : false,
		nextPostHtml : "Next Post",
		behaviour: "overlay",
		container: "body",
		fitToElement: false,
		hideScrollbar: false
	};
	
	// numeric and boolean variables
	var windowWidth,
		windowHeight,
		minHeight = 350,
		savedScrollTop = 0,
		isTouch = !!('ontouchstart' in window),
		allImagesLoaded,
		endReached,
		moveToNextLoadedImage,
		savedTitle,
		adjustUiInterval,
		columnsInterval,
		scrollSpeed,
		scrollInterval,
		nextPostIsLoading,
		uniqueId = "scrollbox",
		uniqueSelector = ".scrollbox",
		lastScrollPosition = 0,
		touchStartX = 0,
        touchStartY = 0,
        scrollX,
        scrollY;
	
	var settings = {};
	
	function open(options){
		
		uniqueId = "scrollbox-" + new Date().getUTCMilliseconds();
		uniqueSelector = "#" + uniqueId;
		
		
		
		// Defaults
		moveToNextLoadedImage = false;
		endReached = false;
		allImagesLoaded = false;
		savedScrollTop = $(window).scrollTop();
		scrollSpeed = 0;
		nextPostIsLoading = false;
		
		$(".scrollbox").remove();
		// merging options and defaults
		$.extend(settings, defaults);
		$.extend(settings, options);
		
		
		
		$(settings.container).append("<div id='"+uniqueId+"' class='scrollbox'><div class='scrollbox-overlay'></div><div class='scrollbox-title'></div><div class='scrollbox-content'><div class='scrollbox-content-inner'><div class='scrollbox-element scrollbox-introduction' ></div></div></div></div>");
		$(uniqueSelector).addClass("visible");
		
		$(".scrollbox-title", uniqueSelector).html(settings.titleHtml);
		$(".scrollbox-introduction", uniqueSelector).html(settings.introHtml);
		
		if(isTouch) {
			$(".scrollbox-content", uniqueSelector).css({
				"overflow": "hidden"
			})
		}
		
		
		introDetailsButton();
		//console.log($(settings.introHtml).find(".details"));
		
		savedTitle = document.title;
		if(settings.title) {
			document.title = savedTitle + " | " + settings.title;
		}
		navigation();
		
		
		$(uniqueSelector).bind('touchstart', function (e) { 
			var touch = getTouches(e)[0];
			touchStartX = touch.pageX;
			touchStartY = touch.pageY;
			
		});
		
		$(uniqueSelector).bind('touchmove', function (e) { 
			
			var touch = getTouches(e)[0];
			var dx = touch.pageX - touchStartX;
            var dy = Math.abs(touch.pageY - touchStartY);
            
            
            
            if(dy < 10) {
	            e.preventDefault();
            }
            
			//
		});
		

		loadImages();
		addAdjustUiLoop();
		
		if(settings.openCloseAnimation == "fade"){
			$(uniqueSelector).css({
				opacity: 0
			}).animate({
				opacity: 1
			}, 200, function(){
				if(settings.behaviour != "inline"){
					$("body").children("div:not(.scrollbox):not(:hidden)").css({
						"visibility": "hidden"
					}).addClass("hidden-by-scrollbox");
					$("html,body").css({
						"overflow": "hidden"
					})
				}
				
				fit();
			})
		} else if(settings.openCloseAnimation == "fromRight") {
			$(uniqueSelector).css({
				"left": $(window).width()
			}).animate({
				"left": 0
			}, 400, function(){
				$("html,body").css({
					"overflow": "hidden"
				})
				fit();
			})
			$("#wrap").css({
				"left": 0
			}).animate({
				"left": -$(window).width()
			}, 400, function(){
				$(this).css({
					"opacity": 0
				});
			});
		}
		fit();
		$(window).bind('orientationchange', fit);
		$(window).bind('resize', fit);
		$(window).bind('scroll', fitScrollBoxPosition);
		$(window).bind('keydown', keyDownHandler);
		scrollInterval = setInterval(scrollBySpeed, 40);
	}
	
	function getTouches(e) {
        if (e.originalEvent) {
            if (e.originalEvent.touches && e.originalEvent.touches.length) {
                return e.originalEvent.touches;
            } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
                return e.originalEvent.changedTouches;
            }
        }
        return e.touches;
    }
	
	
	function close(){
		if(!$(uniqueSelector).length) return;
		
		kill();
		
		if(settings.openCloseAnimation == "fade"){
			$(uniqueSelector).css({
				"top": savedScrollTop
			}).animate({
				opacity: 0
			}, 400, function(){
				$(uniqueSelector).remove();
			});
		} else if(settings.openCloseAnimation == "fromRight") {
			$("#wrap").css({
				"opacity": 1
			}).animate({
				"left": 0
			}, 400)
			$(uniqueSelector).css({
				"top": savedScrollTop
			}).animate({
				"left": $(window).width()
			}, 400, function(){
				$(uniqueSelector).remove();
			})
		}
	}
	function kill(){
		
		$(window).unbind('orientationchange', fit);
		$(window).unbind('resize', fit);
		$(window).unbind('scroll', fitScrollBoxPosition);
		$(window).unbind('keydown', keyDownHandler);
		clearInterval(adjustUiInterval);
		clearInterval(scrollInterval);
		
		if(!$(uniqueSelector).length) return;
	
		$("html,body").css({
			"overflow": "auto"
		});
		$("body").children("div.hidden-by-scrollbox").css({
			"visibility": "visible"
		})
		$(window).scrollTop(savedScrollTop);
		
		document.title = savedTitle;
		if(typeof settings.onClose == "function") {
			settings.onClose();
		}
	}
	
	function introDetailsButton(){
		
		var detailsText = $(settings.detailsHtml).text();
		
		if(detailsText== "undefined" || detailsText.length < 3)
			return;
		
		var $newHtml = $("<div>" + settings.introHtml + "</div>");
		$newHtml.find(".columnize").append("<div class='details-button'><span class='show'>" + settings.showDetailsButtonHtml + "</span><span class='hide'>" + settings.hideDetailsButtonHtml + "</span></div>");
		settings.introHtml = $newHtml.html();
		$(".scrollbox-introduction", uniqueSelector).html($newHtml);
		
		$(document).on("click", uniqueSelector + " .details-button", function(e){
			e.preventDefault();
			$(".scrollbox-introduction", uniqueSelector).toggleClass("details-visible");
			
			if( $(".scrollbox-introduction", uniqueSelector).hasClass("details-visible") ) {
				var $newHtml = $("<div>" + settings.introHtml + "</div>");
				$newHtml.find(".columnize").append(settings.detailsHtml);
				$(".scrollbox-introduction", uniqueSelector).html($newHtml);
			} else {
				$(".scrollbox-introduction", uniqueSelector).html(settings.introHtml);
			}
			
			fit();
		})
	}
	
	
	
	function updateTouchScroll(){
		if (isTouch) {
			setTimeout(function(){
				$('.scrollbox-content-inner', uniqueSelector).touchScroll("update");
			}, 10)
		}
	}
	
	function loadImages() {
		function iterate (i) {
			if (settings.imageElements.length > i) {
				
				var currentSelector = uniqueSelector;
				
				// for testing the loading indication
				// if(i > 2) return false;
				var img = new Image();
				$(img).load(function(){
					// ist die Scrollbox schon geschlossen? dann nichts machen
					if(!$(uniqueSelector).length || currentSelector != uniqueSelector) 
						return false;
						
					$(".scrollbox-content-inner", uniqueSelector).append("<div class='scrollbox-element scrollbox-image'></div>");
					$(".scrollbox-image:last", uniqueSelector).append("<div class='caption'>"+settings.imageElements[i].caption+"</div>");
					$(img).prependTo($(".scrollbox-image:last", uniqueSelector));
					$(img).css({
						opacity: 0
					})
					$(img).disableImageDefaults();
					// give the browser some time to realize there is a new image
					setTimeout(function(){
						$(img).data("origWidth", $(img).width()).data("origHeight", $(img).height());
						fitImageElement($(".scrollbox-element:last", uniqueSelector));
						$(img).animate({
							opacity: 1
						})
						if(moveToNextLoadedImage) {
							moveToElement($(".scrollbox-image:last", uniqueSelector));
							moveToNextLoadedImage = false;
						}
						iterate(i + 1);
					}, 1)
				}).attr({
					src: settings.imageElements[i].href
				});
			} else {
				allImagesLoaded = true;
				appendnextPostLink();
			}
		};
		if(settings.imageElements.length > 0){
			iterate(0);
			showLoading();
		} else {
			allImagesLoaded = true;
			hideLoading();
		}
	};
	function appendnextPostLink(){
		if(!settings.nextPostLink) return;
		$(".scrollbox-content-inner", uniqueSelector).append("<div class='scrollbox-element scrollbox-element-next-link'><a class='next-post-link' href='"+settings.nextPostLink+"' »'>"+settings.nextPostHtml+"</a></div>");
		$(".next-post-link", uniqueSelector).unbind().click(function(e){
			nextPostIsLoading = true;
			$(this).hide();
			showLoading();
		})
		fit();
	}
	/********************************* FITTING *******************************/
	function fit(){
		windowWidth = $(window).width();
		windowHeight = getWindowHeight();
		
		if(settings.fitToElement && settings.fitToElement.length) {
			
			windowWidth = settings.fitToElement.width();
			windowHeight = settings.fitToElement.height();
		}
		
		if(windowHeight < minHeight) {
		 	windowHeight = minHeight;
		}
		fitScrollBoxPosition();
		fitTextElement($(".scrollbox-introduction", uniqueSelector));
		$(".clickArea", uniqueSelector).each(function(){
			$(this).height(windowHeight - $(this).offset().top - 50);
		})
		$(uniqueSelector).find(".scrollbox-image, .scrollbox-element-next-link").each(function(){
			fitImageElement($(this));
		})
	}
	function fitScrollBoxPosition(){
		$(uniqueSelector).css({
			"height": settings.hideScrollbar ? windowHeight + 20 : windowHeight,
			"top": $(window).scrollTop()
		});
	}
	function fitTextElement($element){
		var columnizeElement = $element.find(".columnize");
		if(columnizeElement.length){
			var height = windowHeight - (columnizeElement.offset().top - $(uniqueSelector).offset().top) - settings.marginBottom - 20;
			columnizeElement.columnize({
				height: height,
				minHeight: height,
				dontsplit: "table",
				balanced: false
			});
			var columnWidth = columnizeElement.find(".column:first").width() + parseInt(columnizeElement.find(".column:first").css("margin-left")) + parseInt(columnizeElement.find(".column:first").css("margin-right"));
			var width = columnWidth * columnizeElement.children(".column").length;
			columnizeElement.width(width)
			$($element).width(width);
		}
		fitWidth();
		updateTouchScroll();
		adjustUi();
	}
	function getWindowHeight(){
		return window.innerHeight ? window.innerHeight : $(window).height();
	}
	function fitImageElement($element){
		if($element.position() == null) return false;
		var topOffset = parseInt($element.css("margin-top")) + parseInt($element.css("padding-top"));
		var imageHeight = windowHeight - topOffset - settings.marginBottom;
		$element.css({
			"height": imageHeight
		})
		$image = $element.find("img");
		var ratio = ($image.data('origHeight') / $image.data('origWidth')).toFixed(2);	// Define image ratio
		$element.find("img").css({
			"height": imageHeight,
			"width": imageHeight / ratio
		})
		fitWidth();
		updateTouchScroll();
		adjustUi();
	}
	
	function fitWidth(){
		var $last = $(".scrollbox-element:last", uniqueSelector);
		var width = 0;
		$(".scrollbox-element", uniqueSelector).each(function(){
			var leftPlus = parseInt($(this).css("margin-left")) + parseInt($(this).css("padding-left"));
			var rightPlus = parseInt($(this).css("margin-right")) + parseInt($(this).css("padding-right"));
			var addWidth = $(this).width() + leftPlus + rightPlus;
			width += addWidth;
		})
		width += settings.marginRight;
		if(width > windowWidth + settings.marginRight){
			var addWidth = windowWidth - $last.innerWidth() - settings.marginRight * 2;
			if(addWidth < 0) addWidth = 0;
			width += addWidth;
			addImageNavigation();
		} else {
			removeImageNavigation();
		}
		$(".scrollbox-content-inner", uniqueSelector).css({
			"width": width
		})
	}
	/******************************* ADJUSTING UI ELEMENTS ***************************/
	function adjustUi(){
		if(!$(".scrollbox-element", uniqueSelector).length)
			return false;

		if($(".scrollbox-content-inner", uniqueSelector).width() >= $(uniqueSelector).width() + settings.marginRight) {
			if($(".btnScroll", uniqueSelector).css("display") == "none") {
				$(".btnScroll", uniqueSelector).show();
				if(typeof settings.onShowLoading == "function") {
					settings.onShowLoading();
				}
			}
		} else {
			if($(".btnScroll", uniqueSelector).css("display") == "block") {
				$(".btnScroll", uniqueSelector).hide();
				if(typeof settings.onHideLoading == "function") {
					settings.onHideLoading();
				}
			}
		}
		var $lastElement = $(".scrollbox-element:last", uniqueSelector);
		
		if($lastElement.offset().left + $lastElement.width() > $(uniqueSelector).width()) {
			endReached = false;
			$(".btnScroll", uniqueSelector).removeClass("rewind");
			if(typeof settings.onHideRewind == "function") {
				settings.onHideRewind();
			}
			hideLoading();
		} else {
			endReached = true;
			if(!allImagesLoaded) {
				showLoading();
			} else {
				hideLoading();
				$(".btnScroll", uniqueSelector).addClass("rewind");
				if(typeof settings.onShowRewind == "function") {
					settings.onShowRewind();
				}
			}
		}
		var currentScrollPosition = getScrollPosition();
		
		if(currentScrollPosition > 50) {
			$(".leftClickArea", uniqueSelector).css("visibility", "visible");
		} else {
			$(".leftClickArea", uniqueSelector).css("visibility", "hidden");
		}
		
		var scrollDist = Math.abs(currentScrollPosition - lastScrollPosition);
		if(scrollDist > 100 && typeof settings.onScrolled == "function") {
			settings.onScrolled();
		}
		lastScrollPosition = currentScrollPosition;
		
	}
	function showLoading(){
		$(".btnScroll", uniqueSelector).hide();
		$(".scrollbox-nav .loading", uniqueSelector).show();
		if(typeof settings.onShowLoading == "function") {
			settings.onShowLoading();
		}
	}
	function hideLoading(){
		if(nextPostIsLoading == true) {
			return;
		};
		if($(".scrollbox-nav .loading", uniqueSelector).css("display") != "none"){
			$(".scrollbox-nav .loading", uniqueSelector).hide();
			if(typeof settings.onShowLoading == "function") {
				settings.onHideLoading();
			}
		}
		
	}
	/******************************** NAVIGATION *******************************/
	function navigation(){
		$(uniqueSelector).prepend("<div class='scrollbox-nav'><ul><li><a href='#/' class='btnClose'>" + settings.closeButtonHtml + "</a></li></ul></div>");
		$(".scrollbox-nav ul", uniqueSelector).append("<li><a href='##' class='btnPrev'>prev</a></li><li><a href='##' class='btnNext'>next</a></li>");
		$(".scrollbox-nav ul", uniqueSelector).append("<li><a href='##' class='btnScroll'>scroll <span class='ui'>→</span></a></li>");
		$(".scrollbox-nav ul", uniqueSelector).append("<li><span class='loading'>Lade Bilder...</span></li>");
		$(".scrollbox-nav ul", uniqueSelector).append("<li><a href='##' class='leftClickArea clickArea'><span class='ui'></span>prev</a></li>");
		
		showLoading();

		$(".scrollbox-nav .btnClose", uniqueSelector).click(function(e){
			e.preventDefault();
			close();
		})
		$(".scrollbox-nav .leftClickArea", uniqueSelector).click(function(e){
			e.preventDefault();
			moveToLeft();
		})
		$(".scrollbox-nav .btnScroll", uniqueSelector).click(function(e){
			e.preventDefault();
			computeScrollClick();
		})
		if (isTouch) {
			$('.scrollbox-content-inner', uniqueSelector).touchScroll({
				uniqueSelector: uniqueSelector
			});
		}
		$(".btnScroll", uniqueSelector).hide();
	}
	function computeScrollClick(){
		if(endReached){
			if(allImagesLoaded){
				moveToStart();
			} else {
				moveToNextLoadedImage = true;
				showLoading();
			}
		} else {
			moveToRight();
		}
	}
	function addImageNavigation(){
		$(".scrollbox-image", uniqueSelector).css({
			"cursor": "pointer"
		}).unbind("click").click(function(e){
			considerMovingTo($(this));
		})
	}
	function removeImageNavigation() {
		$(".scrollbox-image", uniqueSelector).css({
			"cursor": "default"
		}).unbind("click");
	}
	function addAdjustUiLoop(){
		adjustUiInterval = setInterval(adjustUi, 100);
	}
	function keyDownHandler(e){
		if(e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
		switch(e.keyCode) {
			case 39: //right
			e.preventDefault();
			increaseScrollSpeed();
			
			break;
			
			case 37: //left
			e.preventDefault();
			decreaseScrollSpeed();
			break;
			
			case 27: // esc
			e.preventDefault();
			close();
			break;
		}
	}
	/******************************** MOVING ************************************/
	function increaseScrollSpeed(){
		scrollSpeed += 150;
	}
	function decreaseScrollSpeed(){
		scrollSpeed -= 150;
	}
	function scrollBySpeed(){
		if(Math.abs(scrollSpeed) < 2) return;
		scrollSpeed += (0-scrollSpeed) / 3;
		$(".scrollbox-content", uniqueSelector).scrollLeft(Math.floor(getScrollPosition() + scrollSpeed));
	}
	function computeElementClick($element){
		scrollSpeed = 0;
		if(endReached && allImagesLoaded) {
			moveToStart();
		} else if($element.offset().left < 150 && $element.offset().left > 0){
			moveToElement($element.next());
		} else {
			moveToElement($element);
		}
	}
	function moveToRight(){
		var $element = false;
		$(".scrollbox-element", uniqueSelector).each(function(){
			var left = $(this).offset().left;
			var width = $(this).width() + 50;
			if(left < $(uniqueSelector).width() && left + width > $(uniqueSelector).width()){
				considerMovingTo($(this));
				return false;
			}
		});
	}
	function moveToLeft(){
		$(".scrollbox-element", uniqueSelector).each(function(){
			var left = $(this).offset().left;
			var width = $(this).width() + 50;
			if(left < 0 && left + width > 0){
				if(width < windowWidth) {
					considerMovingTo($(this));
				} else {
					moveToPosition(getScrollPosition() - windowWidth);
				}
				return false;
			}
		});
	}
	function considerMovingTo($element){
		scrollSpeed = 0;
		var $nextElement = $element.next();
		var elementIsFocused = $element.offset().left < 150;
		var elementExtendsScreen = $element.offset().left + $element.width() > $(uniqueSelector).width();
		if(elementIsFocused && !elementExtendsScreen && $nextElement.length == 0 && allImagesLoaded) {
			// Wenn das Bild focussiert ist, den Bildschirmrand nicht überlappt und alles geladen ist
			moveToStart();
		} else if(elementIsFocused && elementExtendsScreen) {
			// Wenn das Bild focussiert ist und den Bildschirmrand schon überlappt
			moveToPosition(getScrollPosition() + windowWidth);
		} else if(elementIsFocused && $element.offset().left > 0){
			// Wenn das Bild focussiert ist und den Bildschirmrand weder links noch rechts überlappt
			moveToElement($nextElement);
		} else {
			moveToElement($element);
		}
	}
	function moveToStart(){
		if(typeof settings.onMoveToStart == "function") {
			settings.onMoveToStart();
		}
		moveToPosition(0);
	}
	function moveToElement($element){
		moveToPosition(getInlineBlockPosition($element));
	}
	function moveToPosition(targetScrollLeft, s){
		var speed = s;
		if(speed == undefined){
			speed = 500;
		}
		// adding marginLeft
		var marginLeft = getInlineBlockPosition($(".scrollbox-introduction", uniqueSelector));
		targetScrollLeft -= marginLeft;
		// calculating maxScrollLeft
		var maxScrollLeft = $(".scrollbox-content-inner", uniqueSelector).width() - $(uniqueSelector).width() + marginLeft;
		if(targetScrollLeft > maxScrollLeft) targetScrollLeft = maxScrollLeft;
		// animate the scroll position
		if(isTouch){
			$('.scrollbox-content-inner', uniqueSelector).touchScroll("scrollTo", targetScrollLeft, 0, 300);
		} else {
			$(".scrollbox-content", uniqueSelector).animate({
				scrollLeft: targetScrollLeft
			}, speed)
		}
	}
	function getInlineBlockPosition($element){
		// fix for inline-block elements
		var pos = $element.offset().left + getScrollPosition() - $(uniqueSelector).offset().left;
		return pos;
	}
	function getScrollPosition(){
		if(!isTouch){
			return $(".scrollbox-content", uniqueSelector).scrollLeft();
		} else {
			return $(".scrollbox-content-inner", uniqueSelector).touchScroll("getPosition").x;
		}
	}
	
	
	//////////////////////////////////////
	// API
	var methods = {
		init: function(options){
			open(options);
		},
		close: function(){
			close();
		},
		kill: function(){
			kill();
		},
		fit: function(){
			fit();
		}
	}
	
	
	
    // Public method for scrollBox
	$.fn.scrollBox = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.scrollBox');
		}
	};
})(jQuery);


/*
  Columnize Plugin for jQuery
  Version: v0.10

  Copyright (C) 2008-2010 by Lutz Issler

  Systemantics GmbH
  Am Lavenstein 3
  52064 Aachen
  GERMANY

  Web:    www.systemantics.net
  Email:  hello@systemantics.net

  This plugin is distributed under the terms of the
  GNU Lesser General Public license. The license can be obtained
  from http://www.gnu.org/licenses/lgpl.html.

*/

(function() {
	var cloneEls = new Object();
	var numColsById = new Object();
	var uniqueId = 0;

	function _layoutElement(elDOM, settings, balance) {
		// Some semi-global variables
		var colHeight;
		var colWidth;
		var col;
		var currentColEl;
		var cols = new Array();
		var colNum = 0;
		var colSet = 0;

		var el = jQuery(elDOM);

		// Save numCols property for this element
		// (needed for pagination)
		numColsById[elDOM.id] = settings.columns;

		// Remove child nodes
		el.empty();

		// Macro function (with side effects)
		function _newColumn() {
			colNum++;

			// Add a new column
			col = document.createElement("DIV");
			col.className = settings.column;
			el.append(col);
			currentColEl = col;
			colWidth = jQuery(col).width();
			cols.push(col);

			// Add the same subnode nesting to the new column
			// as there was in the old column
			for (var j=0; j<subnodes.length; j++) {
				newEl = subnodes[j].cloneNode(false);
				if (j==0 || innerContinued) {
					jQuery(newEl).addClass(settings.continued);
				}
				currentColEl.appendChild(newEl);
				currentColEl = newEl;
			}
		}

		// Returns the margin-bottom CSS property of a certain node
		function _getMarginBottom(currentColEl) {
			var marginBottom = parseInt(jQuery(currentColEl).css("marginBottom"));
			if (marginBottom.toString()=='NaN'){
				marginBottom = 0;
			}
			var currentColElParents = jQuery(currentColEl).parents();
			for (var j=0; j<currentColElParents.length; j++) {
				if (currentColElParents[j]==elDOM) {
					break;
				}
				var curMarginBottom = parseInt(jQuery(currentColElParents[j]).css("marginBottom"));
				if (curMarginBottom.toString()!='NaN'){
					marginBottom = Math.max(marginBottom, curMarginBottom);
				}
			}
			return marginBottom;
		}

		// Advance to next sibling on el or a parent level
		function _skipToNextNode() {
			while (currentEl && currentColEl && !currentEl.nextSibling) {
				currentEl = currentEl.parentNode;
				currentColEl = currentColEl.parentNode;
				var node = subnodes.pop();
				// Hack: delete the previously saved HREF
				if (node=="A") {
					href = null;
				}
			}
			if (currentEl) {
				currentEl = currentEl.nextSibling;
			}
		}

		// Take the height from the element to be layouted
		var maxHeight = settings.height
			? settings.height
			: parseInt(el.css("maxHeight"));
		if (balance || isNaN(maxHeight) || maxHeight==0) {
			// We are asked to balance the col lengths
			// or cannot get the column length from the container,
			// so chose a height that will produce >numCols< columns
			col = document.createElement("DIV");
			col.className = settings.column;
			jQuery(col).append(jQuery(cloneEls[elDOM.id]).html());
			el.append(col);
			var lineHeight = parseInt(el.css("lineHeight"));
			if (!lineHeight) {
				// Assume a line height of 120%
				lineHeight = Math.ceil(parseInt(el.css("fontSize"))*1.2);
			}
			colHeight = Math.ceil(jQuery(col).height()/settings.columns);
			if (colHeight%lineHeight>0) {
				colHeight += lineHeight;
			}
			elDOM.removeChild(col);
			if (maxHeight>0 && colHeight>maxHeight) {
				// Balance only to max-height
				colHeight = maxHeight;
			}
		} else {
			colHeight = maxHeight;
		}

		// Take the minimum height into account
		var minHeight = settings.minHeight
			? settings.minHeight
			: parseInt(el.css("minHeight"));
		if (minHeight) {
			colHeight = Math.max(colHeight, minHeight);
		}

		// Start with first child of the initial node
		var currentEl = cloneEls[elDOM.id].children(":first")[0];
		var subnodes = new Array();
		var href = null;
		var lastNodeType = 0;
		_newColumn();
		if (colHeight==0 || colWidth==0) {
			// We cannot continue with zero height or width
			return false;
		}
		while (currentEl) {
			if (currentEl.nodeType==1) {
				// An element node
				var newEl;
				var $currentEl = jQuery(currentEl);
				if ($currentEl.hasClass("dontSplit")
					|| $currentEl.is(settings.dontsplit)) {
					// Don't split this node. Instead, clone it completely
					var newEl = currentEl.cloneNode(true);
					currentColEl.appendChild(newEl);
					if (col.offsetHeight>colHeight) {
						// The column gets too long, start a new colum
						_newColumn();
					}
					_skipToNextNode();
				} else {
					// Clone the node and append it to the current column
					var newEl = currentEl.cloneNode(false);
					currentColEl.appendChild(newEl);
					if (col.offsetHeight-_getMarginBottom(currentColEl)>colHeight) {
						// The column gets too long, start a new colum
						currentColEl.removeChild(newEl);
						var toBeInsertedEl = newEl;
						_newColumn();
						currentColEl.appendChild(toBeInsertedEl);
						newEl = toBeInsertedEl;
					}
					if (currentEl.firstChild) {
						subnodes.push(currentEl.cloneNode(false));
						currentColEl = newEl;
						currentEl = currentEl.firstChild;
					} else {
						_skipToNextNode();
					}
				}
				lastNodeType = 1;
			} else if (currentEl.nodeType==3) {
				// A text node
				var newEl = document.createTextNode("");
				currentColEl.appendChild(newEl);
				// Determine the current bottom margin
				var marginBottom = _getMarginBottom(currentColEl);
				// Append word by word
				var words = currentEl.data.split(" ");
				for (var i=0; i<words.length; i++) {
					if (lastNodeType==3) {
						newEl.appendData(" ");
					}
					newEl.appendData(words[i]);
					currentColEl.removeChild(newEl);
					currentColEl.appendChild(newEl);
					if (col.offsetHeight-marginBottom>colHeight) {
						// el column is full
						// Remove the last word
						newEl.data = newEl.data.substr(0, newEl.data.length-words[i].length-1);

						// Remove the last node if empty
						var innerContinued;
						if (jQuery(currentColEl).text()=="") {
							jQuery(currentColEl).remove();
							innerContinued = false;
						} else {
							innerContinued = true;
						}

						// Start a new column
						_newColumn();

						// Add a text node at the bottom level
						// in order to continue the column
						newEl = document.createTextNode(words[i]);
						currentColEl.appendChild(newEl);
					}
					lastNodeType = 3;
				}
				_skipToNextNode();
				lastNodeType = 0;
			} else {
				// Any other node (comments, for instance)
				_skipToNextNode();
				lastNodeType = currentEl.nodeType;
			}
		}
		return cols;
	};

	jQuery.fn.columnize = function(settings) {
		settings = jQuery.extend({
			column: "column",
			continued: "continued",
			columns: 2,
			balance: true,
			height: false,
			minHeight: false,
			cache: true,
			dontsplit: ""
		}, settings);
		this.each(function () {
			var jthis = jQuery(this);

			var id = this.id;
			if (!id) {
				// Get a new id
				id = "jcols_"+uniqueId;
				this.id = id;
				uniqueId++;
			}

			if (!cloneEls[this.id] || !settings.cache) {
				cloneEls[this.id] = jthis.clone(true);
			}

			// Layout the columns
			var cols = _layoutElement(this, settings, settings.balance);
			if (!cols) {
				// Layout failed, restore the object's contents
				jthis.append(cloneEls[this.id].children().clone(true));
			}
		});
		return this;
	}
})();


/*

	TouchScroll Plugin for jQuery
	Copyright (C) by Paul Neave (neave.com) and Rasso Hilber (basics09.de)

*/



(function($) {

	// Define default scroll settings
	var defaults = {
		y: 0,
		x: 0,
		scrollHeight: 0,
		scrollWidth: 0,
		vScroll: false,
		hScroll: true,
		elastic: !navigator.userAgent.match(/android/i),
		momentum: true,
		elasticDamp: 0.6,
		elasticTime: 50,
		reboundTime: 400,
		momentumDamp: 0.9,
		momentumTime: 300,
		iPadMomentumDamp: 0.95,
		iPadMomentumTime: 1200,
		touchTags: ['select', 'input', 'textarea'],
		uniqueSelector: ".scrollbox"
	};

	// Define methods
	var methods = {

		init: function(options) {
			return this.each(function() {

				var self = this;
				self.scrollOptions = {};
				$.extend(self.scrollOptions, defaults);
				$.extend(self.scrollOptions, options);

				// Prevent double-init, just update instead
				if ( !! this._init) {
				 	return this.update();
				}
				this._init = true;

				// Define element variables
				var $this = $(this),
				scrollY = -self.scrollOptions.y,
				scrollX = -self.scrollOptions.x,
				touchY = 0,
				touchX = 0,
				movedY = 0,
				movedX = 0,
				pollY = 0,
				pollX = 0,
				height = 0,
				width = 0,
				maxHeight = 0,
				maxWidth = 0,
				scrollHeight = 0,
				scrollWidth = 0,
				scrolling = false,
				bouncing = false,
				moved = false,
				timeoutID,
				isiPad = !!navigator.platform.match(/ipad/i),
				hasMatrix = 'WebKitCSSMatrix' in window,
				has3d = hasMatrix && 'm11' in new WebKitCSSMatrix(),
				updateInterval;

				
				// Keep bottom of scroll area at the bottom on resize
				var update = this.update = function() {
					if(!$(".scrollbox-element:last", self.scrollOptions.uniqueSelector).length) {
						return false;
					}
					if (self.scrollOptions.hScroll) {
						self.scrollOptions.vScroll = false;
						// width setup
						width = $this.parent().width();
						scrollWidth = $this.width();
						maxWidth = width - scrollWidth;
					}

					if (self.scrollOptions.vScroll) {
						// height setup
						height = $this.parent().height();
						scrollHeight = $this.height();
						maxHeight = height - scrollHeight;
					}
					
					clearTimeout(timeoutID);
					clampScroll(false);
				};
				updateInterval = setInterval(update, 2000);
				// Set up initial variables
				update();

				// Set up transform CSS
				$this.css({
					'-webkit-transition-property': '-webkit-transform',
					'-webkit-transition-timing-function': 'cubic-bezier(0,0,0.2,1)',
					'-webkit-transition-duration': '0',
					'-webkit-transform': cssTranslate(scrollX, scrollY)
				});

				// Listen for screen size change event
				window.addEventListener('onorientationchange' in window ? 'orientationchange': 'resize', update, false);

				// Listen for touch events
				$this.bind('touchstart.touchScroll', touchStart);
				$this.bind('touchmove.touchScroll', touchMove);
				$this.bind('touchend.touchScroll touchcancel.touchScroll', touchEnd);
				$this.bind('webkitTransitionEnd.touchScroll', transitionEnd);

				// Set the position of the scroll area using transform CSS
				var setPosition = this.setPosition = function(x, y) {
					scrollX = x;
					scrollY = y;
					$this.css('-webkit-transform', cssTranslate(scrollX, scrollY));
				};
				// Transform using a 3D translate if available
				function cssTranslate(x, y) {
					return 'translate' + (has3d ? '3d(': '(') + x + 'px,' + y + 'px' + (has3d ? ',0)': ')');
				}

				// Set CSS transition time
				function setTransitionTime(time) {
					time = time || '0';
					$this.css('-webkit-transition-duration', time + 'ms');
				}

                // Get the actual pixel position made by transform CSS
				function getPosition() {
					if (hasMatrix) {
						var transform = window.getComputedStyle($this[0]).webkitTransform;
						if ( !! transform && transform !== 'none') {
							var matrix = new WebKitCSSMatrix(transform);
							return {
								x: matrix.e,
								y: matrix.f
							};

						}
					}
					return {
						x: scrollX,
						y: scrollY
					};
				}

				// Expose getPosition API
				this.getPosition = function() {
					return getPosition();
				};

				// Bounce back to the bounds after momentum scrolling
				function reboundScroll() {
					if (scrollX > 0 && scrollY > 0) {
						scrollTo(0, 0, self.scrollOptions.reboundTime);
					} else if (scrollX > 0) {
						scrollTo(0, scrollY, self.scrollOptions.reboundTime);
					} else if (scrollY > 0) {
						scrollTo(scrollX, 0, self.scrollOptions.reboundTime);
					} else if (scrollX < maxWidth && scrollY < maxHeight) {
						scrollTo(maxWidth, maxHeight, self.scrollOptions.reboundTime);
					} else if (scrollX < maxWidth) {
						scrollTo(maxWidth, scrollY, self.scrollOptions.reboundTime);
					} else if (scrollY < maxHeight) {
						scrollTo(scrollX, maxHeight, self.scrollOptions.reboundTime);
					}
				}

                // Stop everything once the CSS transition in complete
				function transitionEnd() {
					if (bouncing) {
						bouncing = false;
						reboundScroll();
					}
					clearTimeout(timeoutID);
				}

				// Limit the scrolling to within the bounds
				function clampScroll(poll) {
					if (!hasMatrix || bouncing) {
						return;
					}

					var oldX = pollX;
					pollX = getPosition().x;

					var oldY = pollY;
					pollY = getPosition().y;

					if (pollX > 0 || pollY > 0) {
						if (self.scrollOptions.elastic) {
							// Slow down outside top bound
							bouncing = true;
							scrollX = (pollX > 0) ? 0: pollX;
							scrollY = (pollY > 0) ? 0: pollY;
							momentumScroll(pollX - oldX, pollY - oldY, self.scrollOptions.elasticDamp, 1, width, height, self.scrollOptions.elasticTime);
						} else {
							// Stop outside top bound
							var x = (pollX > 0) ? 0: pollX;
							var y = (pollY > 0) ? 0: pollY;
							setTransitionTime(0);
							setPosition(x, y);
						}
					} else if (pollX < maxWidth || pollY < maxHeight) {
						if (self.scrollOptions.elastic) {
							// Slow down outside bottom bound
							bouncing = true;
							scrollX = (pollX > maxHeight) ? maxHeight: pollX;
							scrollY = (pollY > maxHeight) ? maxHeight: pollY;
							momentumScroll(pollX - oldX, pollY - oldY, self.scrollOptions.elasticDamp, 1, width, height, self.scrollOptions.elasticTime);
						} else {
							// Stop outside bottom bound
							var x = (pollX > maxWidth) ? maxWidth: pollX;
							var y = (pollY > maxHeight) ? maxHeight: pollY;
							setTransitionTime(0);
							setPosition(x, y);
						}
					} else if (poll) {
						// Poll the computed position to check if element is out of bounds
						timeoutID = setTimeout(clampScroll, 20, true);
					}
				}

                // Animate to a position using CSS
				var scrollTo = this.scrollTo = function(destX, destY, time) {
					if(destX > 0) {
						destX = 0;
					} else if(destX < maxWidth) {
						destX = maxWidth;
					}
					if(destY > 0) {
						destY = 0;
					} else if(destY < maxHeight) {
						destY = maxHeight;
					}
					
					if (destX === scrollX && destY === scrollY) {
						return;
					}

					moved = true;
					setTransitionTime(time);
					setPosition(destX, destY);
				}

				// Perform a momentum-based scroll using CSS
				function momentumScroll(dxin, dyin, k, minDist, maxDistX, maxDistY, t) {
					var adx = Math.abs(dxin),
					ady = Math.abs(dyin),
					dx = 0,
					dy = 0;

                    // Calculate the total distance
                    while (adx > 0.1) {
                        adx *= k;
                        dx += adx;
                    }
                    while (ady > 0.1) {
                        ady *= k;
                        dy += ady;
                    }

                    // Limit to within min and max distances
                    if (dx > maxDistX) {
                        dx = maxDistX;
                    }
                    if (dy > maxDistY) {
                        dy = maxDistY;
                    }
                    if (dx > minDist) {
                        if (dxin < 0) {
                            dx = -dx;
                        }

                        dx += scrollX;

                        // If outside the bounds, don't go too far
                        if (width > 0) {
                            if (dx > width * 2) {
                                dx = width * 2;
                            } else if (dx < maxWidth - width * 2) {
                                dx = maxWidth - width * 2;
                            }
                        }
                    }
                    if (dy > minDist) {
                        if (dyin < 0) {
                            dy = -dy;
                        }

                        dy += scrollY;

                        // If outside the bounds, don't go too far
                        if (height > 0) {
                            if (dy > height * 2) {
                                dy = height * 2;
                            } else if (dy < maxHeight - height * 2) {
                                dy = maxHeight - height * 2;
                            }
                        }
                    }
                    if (Math.abs(dx) > minDist || Math.abs(dy) > minDist) {
                        // Perform scroll
                        scrollTo(Math.round(dx), Math.round(dy), t);
                    }
                    clampScroll(true);
                }

                // Get the touch points from this event
                function getTouches(e) {
                    if (e.originalEvent) {
                        if (e.originalEvent.touches && e.originalEvent.touches.length) {
                            return e.originalEvent.touches;
                        } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
                            return e.originalEvent.changedTouches;
                        }
                    }
                    return e.touches;
                }

                // Dispatches a fake mouse event from a touch event
                function dispatchMouseEvent(name, touch, target) {
                    var e = document.createEvent('MouseEvent');
                    e.initMouseEvent(name, true, true, touch.view, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
                    target.dispatchEvent(e);
                }

                // Find the root node of this target
                function getRootNode(target) {
                    while (target.nodeType !== 1) {
                        target = target.parentNode;
                    }
                    return target;
                }

                // Perform a touch start event
                function touchStart(e) {
                    // Allow certain HTML tags to receive touch events
                    if ($.inArray(e.target.tagName.toLowerCase(), self.scrollOptions.touchTags) !== -1) {
                        return;
                    }

                    // Stop the default touches
                    //e.preventDefault();
                    //e.stopPropagation();
                    

                    var touch = getTouches(e)[0];

                    // Dispatch a fake mouse down event
                    dispatchMouseEvent('mousedown', touch, getRootNode(touch.target));

                    scrolling = true;
                    moved = false;
                    movedX = 0;
                    movedY = 0;

                    clearTimeout(timeoutID);
                    setTransitionTime(0);

                    // Check scroll position
                    if (self.scrollOptions.momentum) {
                        var x = getPosition().x;
                        var y = getPosition().y;
                        if (x !== scrollX || y !== scrollY) {
                            setPosition(x, y);
                            moved = true;
                        }
                    }

                    touchX = touch.pageX - scrollX;
                    touchY = touch.pageY - scrollY;
                }

                // Perform a touch move event
                function touchMove(e) {
                    if (!scrolling) {
                        return;
                    }

                    var dx = getTouches(e)[0].pageX - touchX;
                    var dy = getTouches(e)[0].pageY - touchY;

                    // Elastic-drag or stop when moving outside of boundaries
                    if (dx > 0) {
                        if (self.scrollOptions.elastic) {
                            dx /= 2;
                        } else {
                            dx = 0;
                        }
                    } else if (dx < maxWidth) {
                        if (self.scrollOptions.elastic) {
                            dx = (dx + maxWidth) / 2;
                        } else {
                            dx = maxWidth;
                        }
                    }
                    if (dy > 0) {
                        if (self.scrollOptions.elastic) {
                            dy /= 2;
                        } else {
                            dy = 0;
                        }
                    } else if (dy < maxHeight) {
                        if (self.scrollOptions.elastic) {
                            dy = (dy + maxHeight) / 2;
                        } else {
                            dy = maxHeight;
                        }
                    }

                    if (self.scrollOptions.hScroll) {
                        movedX = dx - scrollX;
                    } else {
                        dx = 0;
                    }
                    if (self.scrollOptions.vScroll) {
                        movedY = dy - scrollY;
                    } else {
                        dy = 0;
                    }

                    moved = true;
                    setPosition(dx, dy);
                }

                // Perform a touch end event
                function touchEnd(e) {
                    if (!scrolling) {
                        return;
                    }

                    scrolling = false;

                    if (moved) {
                        // Ease back to within boundaries
                        if ((scrollX > 0 || scrollX < maxWidth) || (scrollY > 0 || scrollY < maxHeight)) {
                            reboundScroll();
                        } else if (self.scrollOptions.momentum) {
                            // Free scroll with momentum
                            momentumScroll(movedX, movedY, isiPad ? self.scrollOptions.iPadMomentumDamp: self.scrollOptions.momentumDamp, 40, 2000, 2000, isiPad ? self.scrollOptions.iPadMomentumTime: self.scrollOptions.momentumTime);
                        }
                    } else {
                        var touch = getTouches(e)[0],
                        target = getRootNode(touch.target);

                        // Dispatch fake mouse up and click events if this touch event did not move
                        dispatchMouseEvent('mouseup', touch, target);
                        dispatchMouseEvent('click', touch, target);
                    }
                }

            });
        },

		update: function() {
			return this.each(function() {
				this.update();
			});
		},

		getPosition: function() {
			var p = false;
			this.each(function() {
				p = {
					x: -this.getPosition().x,
					y: -this.getPosition().y
				}
			});
			return p;
		},

		setPosition: function(x, y) {
			return this.each(function() {
				this.setPosition( - x, -y);
			});
		},

		scrollTo: function(x, y, time) {
			return this.each(function() {
				this.scrollTo( - x, -y, time);
			});
		}
	};

    // Public method for touchScroll
	$.fn.touchScroll = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.touchScroll');
		}
	};

})(jQuery);