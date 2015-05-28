(function ($) {
    "use strict";

    var IMAGE_SELECTOR = 'img.image-contain, img.image-cover';
    var IMAGE_POLYFILL_CLASS = 'image-polyfill';
    var IMAGE_POLYFILL_SELECTOR = '.' + IMAGE_POLYFILL_CLASS;
    // thanks to: http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
    var TRANSPARENT_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

    var $document = $(document);

    // first check support
    var testElement = document.createElement('img');
    $.support.objectFit = 'objectFit' in testElement.style;
    $.support.objectPosition = 'objectPosition' in testElement.style;
    $.support.backgroundSize = 'backgroundSize' in testElement.style;
    $.support.mutationObserver = 'MutationObserver' in window;
    $.support.addEventListener = 'addEventListener' in document;
    testElement = null;

    if ($.support.objectFit) {
        $('html').addClass('objectfit');
    }

    if ($.support.objectFit && $.support.objectPosition) {
        return; // full support detected
    }

    if (!$.support.backgroundSize) {
        $('html').addClass('no-backgroundsize'); // add modernizr class (for the case it isn't there)
        return; // it's hopeless
    }

    $document.on('ready.image.position update.image.position', function (e) {
        var $target = $(e.target);
        var $images = $target.is(IMAGE_SELECTOR) ? $target : $target.find(IMAGE_SELECTOR);

        // if an element has the polyfill already just check it
        $images.filter(IMAGE_POLYFILL_SELECTOR).trigger('check.image.position');

        // only apply polyfill to objects which haven't yet
        $images.not(IMAGE_POLYFILL_SELECTOR).each(function () {
            var $image = $(this).addClass(IMAGE_POLYFILL_CLASS);

            var checkChanges = function () {
                // the check is simple: if the image src is not our transparent git, it was set by someone
                // if so, then set the background image to that src and replace the main image with the transparent gif
                var imageSrc = $image.prop('src');
                if (imageSrc === TRANSPARENT_IMAGE_SRC) {
                    return;
                }

                $image.css({backgroundImage: 'url("' + imageSrc + '")'});
                $image.prop({src: TRANSPARENT_IMAGE_SRC});
            };

            // initial check if the image should be modified
            checkChanges();

            // use mutation observer as the quickest way to find changes and apply them to our fake
            if ($.support.mutationObserver) {
                var observer = new MutationObserver(checkChanges);
                observer.observe($image[0], {attributes: true});
            } else if ($.support.addEventListener) {
                // this alternative uses deprecated mutation events
                // it allows this polyfill to get more performance in IE 9–10
                // however they should never be used in browsers which support MutationObserver
                $image[0].addEventListener('DOMAttrModified', checkChanges);
            }

            // as a fallback way: use the load event. It won't help us find direct changes to the element
            // but at least changes to the src will work with a little delay
            $image.on('load.image.position check.image.position', checkChanges);
        });
    });

    // use image load as a trick to find images after they have loaded (better late than never)
    if ($.support.addEventListener) {
        // thanks to http://stackoverflow.com/a/24611104/1973256 for the idea of using capture
        document.addEventListener('load', function (e) {
            $(e.target).filter(IMAGE_SELECTOR).trigger('update.image.position');
        }, true);
    }

})(jQuery);