/*
====================
Object Viewer
====================
*/
(function(Viewer, $, undefined) {

    var zoomContainer = null;
    var thumbnails = null;

    Viewer.init = function() {
        viewContainer       = gqs('.object-lightbox');

        if(!viewContainer.length)
            return;

        body                = gtn('body');

        zoomContainer       = viewContainer.find('.object-lightbox-zoom');
        contentContainer    = gqs('.object-lightbox-content');
        w                   = $(window);
        outside             = gqs('#container > header, #container > footer, #sitemap');
        enlargeButton       = gqs('.object-lightbox-toolbar');

        new MBP.fastButton(document.getElementById('zoom-close'), Viewer.closeZoom);
        //new MBP.fastButton(enlargeButton[0], Viewer.enlargeImage);

        Viewer.slider = gid('viewer-carousel').royalSlider({
            autoHeight: false,
            arrowsNav: false,
            autoScaleSlider: false, 
            controlsInside: false,
            controlNavigation: false,
            addActiveClass: true,
            keyboardNavEnabled: true,       
            loop: true,
            imageAlignCenter: true,
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
            controlNavigation: 'thumbnails'
        }).data('royalSlider');

        if(Viewer.slider.numSlides) {
            if(Viewer.slider.numSlides > 1)
                viewContainer.addClass('with-thumbnails');
            else
                viewContainer.find('.rsThumbs').hide();
        }

        // Move the thumbnails out into the main container 
        thumbsContainer = viewContainer.find('.rsThumbs').prependTo(viewContainer);

        // Set up the zoom event
        Viewer.slider.ev.on('rsSlideClick', Viewer.enlargeImage);
        Viewer.slider.ev.on('rsAfterSlideChange', Viewer.setEnlargable);
        Viewer.slider.ev.on('rsBeforeAnimStart', Viewer.closeZoom);

        Viewer.setEnlargable();
    };

    Viewer.setEnlargable = function() {
        var thumb = viewContainer.find('.rsThumb:nth-child(' + (Viewer.slider.currSlideId + 1) + ') img');

        if(thumb.data('can-zoomify'))
            enlargeButton.fadeIn('fast');
        else
            enlargeButton.fadeOut('fast');
    };

    Viewer.enlargeImage = function(e) {
        var thumb = viewContainer.find('.rsThumb:nth-child(' + (Viewer.slider.currSlideId + 1) + ') img');

        if(thumb.data('can-zoomify'))
            Viewer.zoomifyImage(thumb.data('zoom-path'));

        if(e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;

        e.cancelBubble = true;

        return false;
    };

    Viewer.zoomifyImage = function(zoomPath) {        

        Viewer.openFullScreen();

        if(!Z.Viewer) {
            Z.showImage('zoomifier', zoomPath, 'zLogoVisible=0&zFullPageVisible=0&zToolbarVisible=0&zMinZoom=20&zInitialZoom=40&zNavigatorVisible=0&zDebug=0'); // &zCanvas=0
            
            setTimeout(function() {
                Z.initialize();
                
                setTimeout(function() {
                    //Z.Viewport.zoomAndPanToView(null, null, 0.2);
                }, 100);
            }, 500);
        }
        else {
            Z.Viewer.setImagePath(zoomPath);

            setTimeout(function() {
                //Z.Viewport.zoomAndPanToView(null, null, 0.2);
            }, 100);
        }

        viewContainer.addClass('in-zoom');
        zoomContainer.show();
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

        outside.hide();
        body.addClass('has-zoom');

        if(displayMode < displayModes.DESKTOP) {
            gid('zoomifier').width(w.width()).height(w.height());

            contentContainer.height(w.height());
            viewContainer.height(w.height());
            zoomContainer.height(w.height());
        }

        w.scrollTop(0);
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

