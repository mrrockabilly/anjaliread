(function ($) {

	let isSingular = false;
	let currentLanguage = "en";

	function isSmallScreen() {
		if ((screen.width < 480) || (screen.height < 480)) {
			return true;
		}
		return false;
	}

	function redirection() {
		let loc = window.location.href;
		let path = "entry/" + loc.split("entry/")[1];
		let newLoc = false;
		if (isSingular) {
			newLoc = rootUrl + "#/" + path;
		}
		if (newLoc && !isSmallScreen()) {
			window.location.href = newLoc;
		}
	}
	redirection();

	var windowH = $(window).height(),
		windowW = $(window).width(),
		lastWindowH = -1,
		lastWindowW = -1,
		hashElements = [],
		savedHash,
		scrollY,
		lastScrollTop = 0,
		bigScreenTreated = false,
		focusing = false,
		isTouch = !!('ontouchstart' in window),
		entryHeight;


	$(document).ready(function () {

		jQuery.extend(verge);

		fit();

		$(window).resize(fit);
		$(window).scroll(scrolling);

		fit();


		$("#wrap").css({
			"visibility": "visible"
		})

		hash();
		buttons();

		if (!isSingular) {
			bigScreenStuff();
		}
		iPhoneHideAddressBar();
	})

	function scrolling() {
		adjustHashByScrollPosition();
	}
	function adjustHashByScrollPosition() {
		if ("scroll" == hashElements[0]) {
			var focusedElement = $("#" + hashElements[1]);
			if (!focusedElement.length)
				return;

			var focusedOffset = Math.abs(focusedElement.offset().top - $(document).scrollTop());
			if (focusedOffset < 100)
				focusedElement.addClass("is-focused");

			if (focusedOffset > 100 && focusedElement.hasClass("is-focused")) {
				window.location.hash = "/";
				focusedElement.removeClass("is-focused");
			}

		}
	}


	function iPhoneHideAddressBar() {
		setTimeout(function () {
			if (isTouch && $(window).scrollTop() <= 1) {
				$("#wrap").css({
					"min-height": $(window).height() + 1
				})
				$(window).scrollTop(1);
			}
		}, 0);
	}

	function bigScreenStuff() {
		if (isSmallScreen() || bigScreenTreated)
			return;

		bigScreenTreated = true;

		internalLinks();
		singleSlider();
		//mousewheel();
	}

	function singleSlider() {
		if (!$(".current").length || $(".current .scrollbox").length)
			return;

		var elements = [];
		$(".current .image").each(function () {
			elements.push({
				href: $(this).find("a.src").attr("href"),
				caption: $(this).find(".caption").text()
			});
		})

		var introHtml = $(".current .description").html();
		savedHash = window.location.hash;

		$("body").scrollBox("kill");

		var nextPostLink = getNextProjectData().link;
		var nextPostText = getNextProjectData().text;

		$("body").scrollBox({
			title: "",
			titleHtml: "",
			introHtml: "<div class='columnize'>" + introHtml + "</div>",
			imageElements: elements,
			marginRight: 40,
			marginBottom: 40,
			closeButtonHtml: "<span class='ui'>" + (currentLanguage == "de" ? "zurück" : "close") + "</span>",
			behaviour: "inline",
			container: ".entry.current",
			onShowLoading: onShowLoading,
			onHideLoading: onHideLoading,
			onShowRewind: onShowRewind,
			onHideRewind: onHideRewind,
			nextPostLink: nextPostLink,
			onScrolled: onScrollboxScrolled,
			nextPostHtml: "<div class='next-post-inner'><div class='text'>Next: " + nextPostText + "</div><div class='ui'></div></div>",
			fitToElement: $(".entry.current"),
			hideScrollbar: true
		})

		$(".scrollbox .next-post-link").unbind().click(function (e) {
			e.stopPropagation();
		});

		fit();

	}

	function onScrollboxScrolled() {
		focusElement($(".entry.current"));

	}

	function getNextProjectData() {
		var next = $(".entry.current").next(".entry");
		if (next.length) {
			return {
				link: next.find(".permalink").attr("href"),
				text: next.find("h2").text()
			};
		}
		return {
			link: "#/scroll/footer",
			text: "Contact"
		};
	}


	function mousewheel() {
		$(document).on('mousewheel', '.scrollbox', function (event, delta, deltaX, deltaY) {
			if (Math.abs(deltaX) > 15) {
				focusElement($(".entry.current"));
			} else if (Math.abs(deltaY) > 15) {
				focusing = false;
				$("html,body").stop(true);
			}
		});
	}

	function srollPosition() {
		function animationLoop() {
			window.requestAnimationFrame(animationLoop);
			var scrollTop = $(document).scrollTop();

			var currentPos = $(".entry.current").position().top;
			var scrollDist = Math.abs(currentPos - scrollTop);



			if (scrollDist < 100) {
				scrollTop += (currentPos - scrollTop) / 6;
				$(document).scrollTop(scrollTop);
			}
			//lastScrollTop = targetPos;
		}
		animationLoop();
	}


	function onShowLoading() {
		$(".scroll-project").hide();
		$(".loading-project").show();
	}
	function onHideLoading() {
		$(".scroll-project").show();
		$(".loading-project").hide();
	}

	function onShowRewind() {
		$(".scroll-project").addClass("rewind");
	}

	function onHideRewind() {
		$(".scroll-project").removeClass("rewind");
	}

	function onMoveToStart() {
		nextProject();
	}


	function nextProject() {
		var current = $(".entry.current");
		var next = current.next(".entry");
		if (next.length) {
			window.location.hash = next.find("a.permalink").attr("href");
		} else {
			window.location.hash = "#/scroll/footer";
		}
	}
	function prevProject() {
		var current = $(".entry.current");
		var prev = current.prev(".entry");
		if (prev.length) {
			window.location.hash = prev.find("a.permalink").attr("href");
		} else {
			window.location.hash = "#/scroll/splash";
		}
	}

	function buttons() {
		$(document).on("click", ".button.view-projects, .header-text", function () {
			//moveToElement($(".entry:first"));
			window.location.hash = "/scroll/entries/";
		})

		$(document).on("click", ".scroll-project", function () {
			$(".scrollbox-nav .btnScroll").click();
		})
		$(document).on("click", ".next-project", function () {
			nextProject();
		})
		$(document).on("click", ".prev-project", function () {
			prevProject();
		})

		$(document).on("click", ".close-project", function () {
			window.location.href = "##";
		})

		$(document).on("click", ".scrollbox-image", function () {
			focusElement($(".entry.current"));
		})

	}


	function internalLinks() {
		$(".permalink:not(.treated)").each(function () {
			$(this).addClass("treated");
			var href = $(this).attr("href");
			href = href.split("/entry/")[1];
			$(this).attr("href", "#/entry/" + href);
		})
	}


	function hash() {
		$(window).bind("hashchange", function (e) {
			e.preventDefault();
			reactToAddress();
		})
		reactToAddress();
	}

	function reactToAddress() {
		var hash = window.location.hash;
		if (hash.indexOf("#") == -1) hash = "#";
		//hash = hash.split("?")[0];
		hash = hash.split("#")[1];
		if (hash.indexOf("/") == 0) hash = hash.substr(1);
		hashElements = hash.split("/");

		switch (hashElements[0]) {

			case "entry":
				clearSingle();
				loadSingle(hashElements[1]);
				break;

			case "scroll":
				clearSingle();
				focusElement($("#" + hashElements[1]));
				break;


			default:
				clearSingle();
				break;

		}
	}

	function clearSingle() {
		focusing = false;
		$("body").scrollBox("kill");
		$(".entry.current").removeClass("current").css("height", "").find(".scrollbox").remove();
		$(".projects-nav").hide();
		fit();
	}

	function loadSingle(slug) {

		$("[data-slug=" + slug + "]").addClass("current");

		if (!$(".entry.current").length)
			return;

		$(".projects-nav").show().prependTo(".entry.current");

		//fit();

		focusElement($(".entry.current"));

		fitEntry($(".entry.current"));

		setTimeout(singleSlider, 350);

	}

	function fitEntry(entry) {
		if (!entry.length)
			return;


		var isFirst = entry.index() == 0;
		var isLast = entry.index() == $(".entry").length - 1;

		if (isFirst || isLast) {
			entry.height(windowH - entryHeight / 2);
		} else {
			entry.height(windowH - entryHeight);
		}

		var entryOffset = Math.abs(entry.position().top - $(document).scrollTop());
		if (!focusing && entryOffset < windowH / 2) {
			var targetPos = entry.position().top;
			if (!isFirst)
				targetPos -= entryHeight / 2;
			$(document).scrollTop(targetPos);
		}


	}

	function focusElement(element) {

		if (focusing)
			return;

		focusing = true;

		var targetPos = element.position().top + 2;

		if (element.hasClass("entry") && element.index() > 0) {
			targetPos -= entryHeight / 2;
		}


		$("html,body").stop(true).animate({
			"scrollTop": targetPos
		}, 300, function () {
			focusing = false;
		})
	}

	function moveToElement(element) {

		focusing = true;

		$("html,body").stop(true).animate({
			"scrollTop": element.position().top + 2
		}, 1200, "easeInOutQuart", function () {
			focusing = false;
		})

	}





	function fit() {
		windowW = $(window).width();
		windowH = $(window).height();

		entryHeight = $(".entry header:first").height();

		bigScreenStuff();


		$("#splash, #footer").height(windowH);
		if ($("#splash").height() < 420) {
			$("#splash").height(420)
		}
		if ($("#footer").height() < $(".footer-text").height()) {
			$("#footer").height($(".footer-text").height() + 50);
		}

		scrolling();

		var windowHeightChanged = windowH != lastWindowH;
		var windowWidthChanged = windowW != lastWindowW;

		lastWindowH = windowH;
		lastWindowW = windowW;


		var current = $(".entry.current");

		if (!focusing && current.length && windowHeightChanged) {
			fitEntry(current);
		}


	}

})(jQuery);

(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
			|| window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function (callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function () { callback(currTime + timeToCall); },
				timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function (id) {
			clearTimeout(id);
		};
}());