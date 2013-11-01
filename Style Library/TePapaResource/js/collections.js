/*
====================
Object Viewer
====================
*/
(function(Viewer, $, undefined) {

    var zoomContainer = null;
    var thumbnails = null;

    var inZoom = false;
    var isZooming = false;

    var originalHTML = '';

    var slideData = [];

    Viewer.init = function() {
        viewContainer       = gqs('.object-lightbox');

        if(!viewContainer.length)
            return;

        body                = gtn('body');

        zoomContainer       = viewContainer.find('.object-lightbox-zoom');
        contentContainer    = gqs('.object-lightbox-content');
        w                   = $(window);
        outside             = gqs('#container > header, #container > footer, #sitemap, #search-container, article > *:not(.object-lightbox), .object-lightbox-footer, .object-lightbox-content');
        toolbar             = gqs('.object-lightbox-toolbar');
        btnZoomIn           = gqs('.btn.btn-zoom-in');
        btnZoomOut          = gqs('.btn.btn-zoom-out');
        btnZoomReset        = gqs('.btn.btn-zoom-reset');

        // Index the slides
        gqs('#viewer-carousel .rsImg img').each(function() {
            slideData.push({
                irn:        $(this).data('irn'),
                canZoom:    $(this).data('can-zoomify'),
                path:       $(this).data('zoom-path')
            });
        });

        btnZoomIn.on('mousedown touchstart', Viewer.enlargeImage);
        btnZoomIn.on('mouseup touchend', Viewer.stopZooming);

        btnZoomOut.on('mousedown touchstart', Viewer.shrinkImage);
        btnZoomOut.on('mouseup touchend', Viewer.stopZooming);

        new MBP.fastButton(btnZoomReset[0], Viewer.closeZoom);

        originalHTML = gid('viewer-carousel').html();

        Viewer.createSlider();

        w.smartresize(function() {
            if(!Modernizr.touch)
                Viewer.closeZoom();
        });

        // Recreate the carousel when we change breakpoints, because it behaves differently
        w.on('displayModeChange', function() {
            Viewer.closeZoom();
            Viewer.createSlider();
        });
    };

    Viewer.createSlider = function() {

        if(Viewer.slider && Viewer.slider.destroy)
            Viewer.slider.destroy();

        viewContainer.removeClass('with-thumbnails');
        gid('viewer-carousel').removeClass().addClass('royalSlider rsDefault').html(originalHTML);
        viewContainer.find('.rsThumbs').remove();

        setTimeout(function() { 
            Viewer.slider = gid('viewer-carousel').royalSlider({
                autoHeight: false,
                arrowsNav: false,
                autoScaleSlider: false, 
                controlsInside: false,
                controlNavigation: false,
                addActiveClass: true,
                keyboardNavEnabled: true,       
                loop: true,
                imageScaleMode: 'fit',
                imageScalePadding: 0,
                navigateByClick: false,
                numImagesToPreload: 2,
                transitionSpeed: 600,
                slidesSpacing: 0,
                sliderDrag: true,
                fadeinLoadedSlide: true,
                thumbs: {
                    orientation: 'vertical',
                    spacing: 10,
                    firstMargin: true
                },
                controlNavigation: (displayMode > displayModes.MOBILE) ? 'thumbnails' : 'bullets'
            }).data('royalSlider');

            if(Viewer.slider.numSlides > 1 && displayMode > displayModes.MOBILE)
                viewContainer.addClass('with-thumbnails');

            // Move the thumbnails out into the main container 
            thumbsContainer = viewContainer.find('.rsThumbs').prependTo(viewContainer);

            // Set up the zoom event
            Viewer.slider.ev.on('rsSlideClick', Viewer.enlargeImage);
            Viewer.slider.ev.on('rsAfterSlideChange', Viewer.setEnlargable);
            Viewer.slider.ev.on('rsBeforeAnimStart', function() {
                if(!Modernizr.touch)
                    Viewer.closeZoom();
            });

            Viewer.setEnlargable();
        }, 100);
    };

    Viewer.setEnlargable = function() {
        if(slideData[Viewer.slider.currSlideId].canZoom)
            toolbar.fadeIn('fast');
        else
            toolbar.fadeOut('fast');
    };

    Viewer.zoomStep = function(e) {

        Viewer.enlargeImage();

        setTimeout(Viewer.stopZooming, 200);

        if(e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;

        e.cancelBubble = true;

        return false;
    };

    Viewer.stopZooming = function(e) {

        if(isZooming) {
            Z.Viewport.zoom('stop');
            isZooming = false;
        }

        if(e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;

        e.cancelBubble = true;

        return false;
    };

    Viewer.enlargeImage = function(e) {

        if(inZoom) {
            if(!isZooming) {
                Z.Viewport.zoom('in');
                isZooming = true;
            }

            return;
        }

        var slide = slideData[Viewer.slider.currSlideId];

        if(slide.canZoom && slide.path)
            Viewer.zoomifyImage(slide.path);

        if(e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;

        e.cancelBubble = true;

        inZoom = true;

        return false;
    };

    Viewer.shrinkImage = function() {

        if(!isZooming) {
            Z.Viewport.zoom('out');
            isZooming = true;
        }
    };

    Viewer.zoomifyImage = function(zoomPath) {        

        viewContainer.addClass('in-zoom');
        zoomContainer.show();

        Viewer.openFullScreen();

        if(!Z.Viewer) {
            Z.showImage('zoomifier', zoomPath, 'zLogoVisible=0&zFullPageVisible=0&zToolbarVisible=0&zMinZoom=0&zInitialZoom=30&zNavigatorVisible=0&zDebug=0&zClickPan=0'); // &zCanvas=0
            
            setTimeout(function() {
                Z.initialize();
            }, 500);
        }
        else {
            Z.Viewer.setImagePath(zoomPath);
        }
    };

    Viewer.open = function(e) {
        zoomContainer.hide();

        var item    = $(this);

        var path    = item.data('zoom-path');
        var canZoom = item.data('can-zoomify');
        var irn     = item.data('irn');

        Viewer.zoomifyImage(path);
    };

    Viewer.closeZoom = function() {

        zoomContainer.hide();
        viewContainer.removeClass('in-zoom');

        outside.show();
        body.removeClass('has-zoom');

        contentContainer.css('height', 'auto');
        viewContainer.css('height', 'auto');
        zoomContainer.css('height', 'auto');

        inZoom = false;
    };

    Viewer.selectByIrn = function(irn) {

        for(var i = 0; i < Viewer.thumbnails.length; i++) {
            if($(Viewer.thumbnails[i]).data('irn') == irn) {
                var path = $(Viewer.thumbnails[i]).data('zoom-path');

                Viewer.zoomifyImage(path);

                return;
            }
        }
    };

    Viewer.openFullScreen = function() {

        body.addClass('has-zoom');

        if(displayMode == displayModes.MOBILE) {
            outside.hide();

            gid('zoomifier').width(w.width()).height(w.height());

            contentContainer.height(w.height());
            viewContainer.height(w.height());
            zoomContainer.height(w.height());

             w.scrollTop(0);
        }
        else {
            gid('zoomifier').width(gid('zoomifier').width()).height(gid('zoomifier').height());
        }
    }

}(window.Viewer = window.Viewer || {}, jQuery));



/*
====================
Object Viewer
====================
*/
(function(Collections, $, undefined) {

    Collections.init = function() {

        Collections.slider = gid('collection-projects').royalSlider({
            autoHeight: false,
            arrowsNav: true,
            autoHeight: true,
            controlsInside: false,
            controlNavigation: 'bullets',
            addActiveClass: true,
            keyboardNavEnabled: true,       
            loop: true,
            imageScalePadding: 0,
            navigateByClick: false,
            numImagesToPreload: 2,
            transitionSpeed: 600,
            slidesSpacing: 0,
            sliderDrag: true,
            fadeinLoadedSlide: true
        }).data('royalSlider');
    };

}(window.Collections = window.Collections || {}, jQuery));


$(function(){
    
    Viewer.init();
    Collections.init();
});