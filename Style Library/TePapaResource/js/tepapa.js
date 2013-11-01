/*
====================
Related content sliders
====================
*/
function setupSliders() {

    // Don't process tabs if we're in edit mode
    if(body.attr('role') == 'application')
        return;

    var tabs = [];
    var currentTab = [];

    var related = gid('related');

    var webParts = $('.columnset > .webpart', related);

    if(!webParts.length)
        return;

    var h3Count = 0;

    webParts.each(function() {
        $(this).children().each(function() {
            if(this.nodeName == 'H3') {
                h3Count++;

                if(currentTab.length)
                    tabs.push(currentTab);

                currentTab = [];
                currentTab.push($(this).clone());
            }
            else {
                currentTab.push($(this).clone());
            }
        });
    });

    if(currentTab.length)
        tabs.push(currentTab);

    var tabContainer = related;

    tabContainer.html('');

    var tabNav = $('<div class="tabs"><div class="columnset"><div class="tab-container"></div></div></div>');
    var panelContainer = $('<div class="panels"><div class="columnset"><div class="pane"></div></div></div>');

    tabContainer.append(tabNav);
    tabContainer.append(panelContainer);

    tabNav = $('.tab-container', tabNav);
    panelContainer = $('.pane', panelContainer);

    for(i = 0; i < tabs.length; i++) {
        var tab = $('<div />').addClass('webpart');

        for(n = 0; n < tabs[i].length; n++) {

            tab.append(tabs[i][n]);
        }

        if(h3Count > 1) {
            tab.find('h3').each(function() {
                var copy = $(this).clone();

                $(this).addClass('rsTmb');
                $(this).after(copy);
            });
        }

        panelContainer.append(tab);
    }

    if(h3Count > 1) {
        $('.panels .columnset .pane', related).royalSlider({
            controlNavigation: 'thumbnails',
            autoHeight: true,
            controlsInside: false,
            arrowsNav: false,
            navigateByClick: false,
            arrowsAutoHide: true,
            thumbs: {
                drag: true,
                arrows: true,
                orientation: 'horizontal',
                spacing: 0,
                autoCenter: false
            }
        });
    }

    $('.columnset', related).each(function() {
        var slider = $(this);

        var tabs = slider.find('.rsNav');

        tabs.find('.rsThumb').each(function() {
            $(this).html('<a>' + $(this).children('h3').html() + '</a>');
        });

        tabNav.append(tabs);
    });
}

/*
====================
Navigation
====================
*/
(function(Menu, $, undefined) {

    Menu.inMenu         = false;

    Menu.Modes          = {
        MENU:       'panel-menu',
        SEARCH:     'panel-search',
        SHARE:      'panel-share',
        MAP:        'panel-map',
        TOUR:       'panel-tour'
    };

    var panelMode           = Menu.Modes.MENU;

    var menuClass           = 'has-menu';

    var activeMenu          = null;
    var previousMenu        = null;
    var currentDepth        = 0;

    var body                = null;
    var panelContainer      = null;
    var panelDismisser      = null;
    var contentContainer    = null;
    var panels              = {};
    var w                   = $(window);

    var desktopShare        = null;

    var menuTrigger         = 'header a.menu, header a.share, header a.search, header a.map-menu, header a.tour-menu';

    Menu.init = function() {
        body                = gtn('body');
        panelContainer      = gid('panel');
        panelDismisser      = gid('dismiss');
        contentContainer    = gid('container');
        desktopShare        = gqs('header ul.share-menu');

        // Set up menu triggers
        var triggers = gqs(menuTrigger);

        if(!triggers.length)
            return;

        for(i = 0; i < triggers.length; i++) {
            new MBP.fastButton(triggers[i], Menu.toggleMenu);
        }

        // Close menu hotspot
        new MBP.fastButton(panelDismisser.get(0), Menu.toggleMenu);

        // Preselect 
        for(m in Menu.Modes) {
            panels[Menu.Modes[m]] = $('div.' + Menu.Modes[m], panelContainer);

            var links = $('a[rel]', panels[Menu.Modes[m]]);

            for(i = 0; i < links.length; i++) {
                new MBP.fastButton(links[i], Menu.changeDepth);
            }
        }

        activeMenu = panels[panelMode].find('> div > ul.active:first-child');
    };

    Menu.changeDepth = function(e, ref, mode) {
        if(typeof mode != 'undefined')
            setMode(mode);

        if(typeof ref == 'undefined') {
            var target = $(e.target || e.srcElement);
            var ref = target.attr('rel');
        }

        // Check if we're already on the requested menu
        if(activeMenu.attr('id') == ref)
            return;

        targetMenu = panels[panelMode].find('> div > ul#' + ref);

        var newDepth = targetMenu.data('depth');

        targetMenu.removeClass('previous-left').removeClass('previous-right').addClass('active');
        activeMenu.removeClass('active').addClass('previous-' + ((currentDepth < newDepth) ? 'left' : 'right'));

        previousMenu = activeMenu;
        activeMenu = targetMenu;        

        currentDepth = activeMenu.data('depth');
    };

    Menu.toggleMenu = function(e, direction) {
        var target = $(e.target || e.srcElement);

        // Desktop share menu
        if(displayMode == displayModes.DESKTOP && target.hasClass('share')) {
            desktopShare.toggle();

            if(e.preventDefault)
                e.preventDefault();
            else
                e.returnValue = false;

            e.cancelBubble = true;

            return false;
        }

        if(typeof direction != 'undefined')
            Menu.inMenu = (direction == 'open');
        else
            Menu.inMenu = !Menu.inMenu;

        if(Menu.inMenu) {
            // Set the appropriate panel to show
            if(target.hasClass('share'))
                panelMode = Menu.Modes.SHARE;
            else if(target.hasClass('search'))
                panelMode = Menu.Modes.SEARCH;
            else if(target.hasClass('map-menu'))
                panelMode = Menu.Modes.MAP;
            else if(target.hasClass('tour-menu'))
                panelMode = Menu.Modes.TOUR;
            else
                panelMode = Menu.Modes.MENU;            

            body.addClass(menuClass);
            openMenu();
        }
        else {
            body.removeClass(menuClass);
            closeMenu();
        }

        if(e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;
    };

    function setMode(mode) {
        // Toggle the appropriate panel
        for(m in Menu.Modes) {
            panels[Menu.Modes[m]].removeClass('panel-active');
        }

        panels[mode].addClass('panel-active');

        panelMode = mode;
    }

    function openMenu() {
        setMode(panelMode);

        activeMenu = panels[panelMode].find('> div > ul.active');

        if(activeMenu.data('depth') > 0)
            panels[panelMode].find('> div > ul[data-depth=0]:first-child').addClass('previous-left');

        // If there's no active menu depth set, select the first item
        if(!activeMenu.length) {
            activeMenu = panels[panelMode].find('> div > ul:first-child').addClass('active');
        }

        // Calculate the width
        var targetWidth = ((displayMode == displayModes.MOBILE) ? w.width() - 60 : 300) + 'px';

        panelContainer.width(targetWidth);

        // Move the content
        if(Modernizr.csstransforms3d)
            contentContainer.css('transform', 'translate3d(-' + targetWidth + ', 0px, 0px)');
        else
            contentContainer.css('left', '-' + targetWidth);

        panelDismisser.css('left', '-' + targetWidth);
    }

    function closeMenu() {
        if(Modernizr.csstransforms3d)
            contentContainer.css('transform', 'translate3d(0px, 0px, 0px)');
        else
            contentContainer.css('left', '0px');
    }

}(window.Menu = window.Menu || {}, jQuery));

/*
====================
Map
====================
*/
(function(Map, $, undefined) {

    var mapClass            = 'has-map';
    var panelClass          = 'has-map-panel';

    Map.inMap               = false;
    Map.inPanel             = false;

    var body                = null; 
    var contentcontainer    = null;
    var wrapper             = null;
    var mapContainer        = null;
    var menuPanel;
    var infoPanel           = null;
    var scroller            = null;
    var title               = null;

    var w                   = $(window);

    var outside             = null;

    var numFloors           = 6;
    var floors              = {};
    var activeFloor         = null;
    var map                 = null;

    var tilePattern         = '/Style Library/TePapaResource/css/img/map/tiles/{floor}/tiles_{z}_{x}-{y}.png';
    var markerPath          = '/Style Library/TePapaResource/css/img/map/markers/';

    var mapStartLinks       = '#start-map';

    Map.init = function() {
        var buttons = gqs(mapStartLinks);

        // If there are no links to open the map on the page, drop out
        if(!buttons.length)
            return;

        wrapper         = gid('interactive-map');

        // If there's no map container, we're probably not on a map page
        if(!wrapper.length)
            return;
        body                = gtn('body');
        mapContainer        = gid('map-container');
        outside             = gqs('#container > header, footer, #sitemap, .page-current > .columnset');
        contentcontainer    = gid('container');
        menuPanel           = gqs('#panel .panel-map');
        infoPanel           = gid('info-panels');
        scroller            = $('.scroll-container', infoPanel);
        title               = gid('level-title');

        for(i = 0; i < buttons.length; i++) {
            new MBP.fastButton(buttons[i], Map.open);
        }

        new MBP.fastButton(gqs('a.icon.minimize').get(0), Map.close);
        new MBP.fastButton($('a.icon.panel-close', infoPanel).get(0), hidePanel);

        new MBP.fastButton(title.get(0), Menu.toggleMenu);

        $('a[data-level]', menuPanel).each(function() {
            new MBP.fastButton($(this).get(0), showLevel);
        });

        w.smartresize(function() {

            if(Map.inPanel)
                hidePanel();

            setSize();
        });
    };

    function buildLayers() {
        for(i = 1; i <= numFloors; i++) {
            floors['level' + i] = [
                L.tileLayer(tilePattern, {
                    floor:          i,
                    maxZoom:        4,
                    attribution:    '',
                    detectRetina:   true,
                    noWrap:         true
                })
            ];
        }

        $('.info-panel', wrapper).each(function() {
            var floor   = $(this).data('floor');
            var lat     = $(this).data('lat');
            var lng     = $(this).data('lng');
            var image   = $(this).data('icon');

            var icon = L.icon({
                iconUrl:        'Style Library/TePapaResource/css/img/map/markers/' + image,
                iconRetinaUrl:  'Style Library/TePapaResource/css/img/map/markers/' + image,
                iconSize:       [70, 70]
            });

            floors['level' + floor].push(
                L.marker([lat, lng], {
                    panel: $(this).attr('id'),
                    icon: icon
                })
                .on('click', showPanel)
            );
        });

        for(i = 1; i <= numFloors; i++) {
            var group = L.layerGroup(floors['level' + i]);

            floors['level' + i] = group;
        }
    }

    function setSize() {
        if(Map.inMap) {
            contentcontainer.css('min-height', w.height());
            wrapper.css('min-height', w.height());
            mapContainer.css('min-height', w.height() - 50);
            infoPanel.css('height', w.height() - 50);
            scroller.height(infoPanel.height());

            if(map != null)
                map.invalidateSize();
        }
    }

    Map.open = function(e) {
        Map.inMap = true;

        setSize();

        outside.hide();

        initMap();

        body.addClass(mapClass);
    };

    Map.close =function(e) {
        body.removeClass('has-map');

        contentcontainer.css('min-height', 'auto');
        wrapper.css('min-height', 'auto');
        mapContainer.css('min-height', 'auto');

        outside.show();

        body.removeClass(mapClass);

        Map.inMap = false;
    };

    function showPanel(e) {
        var target = (e.target) ? e.target : e.srcElement;

        if(displayMode == displayModes.MOBILE) {
            mapContainer.css('width', 20);
            infoPanel.css('width', w.width() - 20);
        }
        else {
            mapContainer.css('width', w.width() - 300);
        }

        map.invalidateSize();

        $('.info-panel', infoPanel).removeClass('panel-active');
        $('#' + target.options.panel, infoPanel).addClass('panel-active');

        infoPanel.show();

        map.panTo(target._latlng);
        map.setZoom(2);

        // Return to the top if we're scrolled
        scroller.scrollTop(0);

        Map.inPanel = true;

        body.addClass(panelClass);
    }

    function hidePanel() {
        $('.info-panel', infoPanel).removeClass('panel-active');
        infoPanel.hide();

        mapContainer.css('width', 'auto');
        map.invalidateSize();

        Map.inPanel = false;

        body.removeClass(panelClass);
    }

    function showLevel(e) {
        var target = $((e.target) ? e.target : e.srcElement);

        var level = target.data('level');

        if(map.hasLayer(floors['level' + level])) {
            Menu.toggleMenu({label: 'showLevel'}, 'close');
            return;
        }

        title.text('Level ' + level);

        map.addLayer(floors['level' + level]);

        map.removeLayer(activeFloor);

        activeFloor = floors['level' + level];

        hidePanel();

        Menu.toggleMenu({label: 'showLevel'}, 'close');
    }

    function initMap() {
        if(map != null) {
            setTimeout(function() {
                map.invalidateSize();
                map.fitWorld();
            }, 0);
            return;
        }

        buildLayers();

        activeFloor = floors.level1;

        map = L.map('map-container', {
            layers:     [floors.level1]
        });

        setTimeout(function() {
            map.fitWorld();
        }, 0);

        map.attributionControl.setPrefix('');

        /*
        map.on('click', function(e) {
            console.log('data-lat="' + e.latlng.lat + '" data-lng="' + e.latlng.lng + '"');
        });
        */
    }

}(window.Map = window.Map || {}, jQuery));

/*
====================
Interactive Tour
====================
*/
(function(Tour, $, undefined) {

    var mapClass        = 'has-map';
    var panelClass      = 'has-map-panel';

    Tour.inTour     = false;

    var body            = null; 
    var wrapper         = null;
    var contentContainer= null;
    var mapContainer    = null;
    var overflow        = null;
    var infoPanel       = null;
    var dirPanel        = null;
    var scroller        = null;
    var title           = null;
    var stepCount       = null;
    var menuPanel       = null;

    var w               = $(window);

    var outside         = null;

    var currentStep     = 0;
    var numSteps        = 0;
    var steps           = [];
    var floors          = {};
    var numFloors       = 6;
    var activeFloor     = null;
    var activeStep      = null;

    var map             = null;

    var tilePattern     = '/Style Library/TePapaResource/css/img/map/tiles/{floor}/tiles_{z}_{x}-{y}.png';
    var markerPath      = '/Style Library/TePapaResource/css/img/map/markers/';

    var tourStartLinks  = '#start-tour';

    Tour.init = function() {
        var buttons = gqs(tourStartLinks);

        // If there are no links to open the map on the page, drop out
        if(!buttons.length)
            return;

        wrapper             = gid('interactive-map');

        // If there's no map container, we're probably not on a map page
        if(!wrapper.length)
            return;

        body                = gtn('body');
        contentContainer    = gid('container');
        mapContainer        = gid('tour-map-container');
        outside             = gqs('#container > header, footer, #sitemap, .page-current > .columnset');
        title               = gid('level-title');
        infoPanel           = gid('directions-panel');
        dirPanel            = gid('directions-container');
        stepCount           = gid('step');
        menuPanel           = gqs('#panel .panel-tour');
        overflow            = $('article', wrapper);    
        scroller            = gid('directions-scroll');

        for(i = 0; i < buttons.length; i++) {
            new MBP.fastButton(buttons[i], Tour.open);
        }

        new MBP.fastButton(gqs('a.icon.minimize').get(0), Tour.close);

        new MBP.fastButton(title.get(0), Menu.toggleMenu);

        new MBP.fastButton(gqs('a.icon.next').get(0), Tour.nextStep);
        new MBP.fastButton(gqs('a.icon.previous').get(0), Tour.previousStep);
        new MBP.fastButton($('a.icon.panel-close', infoPanel).get(0), Tour.toggleDirections);
        new MBP.fastButton(gid('show-directions').get(0), Tour.toggleDirections);

        // Watch for window resizes
        w.smartresize(setSize);

        w.bind('keyup', Tour.keyboardNav);
    };

    Tour.toggleDirections = function() {
        if(w.width() < 830) {
            infoPanel.width(w.width() - 20);
            infoPanel.toggle();
        }
        else {
            infoPanel.width(400);
            infoPanel.show();
        }

        map.invalidateSize();
    };

    Tour.open = function() {
        Tour.inTour = true;
        outside.hide();

        initMap();

        setSize();

        body.addClass(mapClass);
    };

    Tour.close = function() {
        body.removeClass('has-map');

        contentContainer.css('min-height', 'auto');
        wrapper.css('min-height', 'auto');

        outside.show();

        body.removeClass(mapClass);

        Tour.inTour = false;
    };

    function setSize() {
        if(Tour.inTour) {
            contentContainer.css('min-height', w.height());
            wrapper.css('min-height', w.height());
            overflow.css('height', w.height() - 130);
            infoPanel.css('height', w.height() - 50);
            scroller.css('height', w.height() - 50);
            mapContainer.css('height', Math.ceil(w.height() / 3));

            if(w.width() < 830)
                infoPanel.width(w.width() - 20);
            else {
                infoPanel.width(400);
                infoPanel.show();
            }

            if(map != null)
                map.invalidateSize();
        }
    }

    function initMap() {
        if(map != null) {
            setTimeout(function() {
                map.invalidateSize();
                map.setView([0, 0], 1);

                if(currentStep == 0)
                    setStep(1);
            }, 0);
            return;
        }

        buildSteps();

        activeFloor = floors.level1;

        map = L.map('tour-map-container', {
            layers:     [floors.level1]
        });

        map.attributionControl.setPrefix('');

        setTimeout(function() {
            map.invalidateSize();
            map.setView([0, 0], 1);

            if(currentStep == 0)
                setStep(1);
        }, 0);
    }

    function showLevel(level) {
        if(map.hasLayer(floors['level' + level])) {
            return;
        }

        title.text('Level ' + level);

        map.addLayer(floors['level' + level]);

        map.removeLayer(activeFloor);

        activeFloor = floors['level' + level];
    }

    function buildSteps() {

        var navContainers = [];

        // Floor tiles
        for(i = 1; i <= numFloors; i++) {
            floors['level' + i] = [
                L.tileLayer(tilePattern, {
                    floor:          i,
                    maxZoom:        4,
                    attribution:    '',
                    detectRetina:   true,
                    noWrap:         true
                })
            ];

            navContainers[i] = gid('nav-tour-l' + i);
        }

        numSteps = 0;

        $('.tour-article', wrapper).each(function() {
            var floor   = $(this).data('floor');
            var lat     = $(this).data('lat');
            var lng     = $(this).data('lng');
            var image   = $(this).data('icon');

            var icon = L.icon({
                iconUrl:        markerPath + image,
                iconRetinaUrl:  markerPath + image,
                iconSize:       [70, 70]
            });

            var directions = $('.article-directions', $(this));

            steps.push({
                step:           (numSteps + 1),
                level:          floor,
                node:           $(this),
                directions:     directions.clone(),
                marker:         L.marker([lat, lng], { icon: icon })
            });

            directions.remove();

            var navRow = $(document.createElement('li'));
            var navLink = $(document.createElement('a')).data('step', numSteps + 1);
            navLink.text($(this).find('h1').text());

            navRow.append(navLink);

            new MBP.fastButton(navLink.get(0), function(e) {
                var button = $(e.target || e.srcElement);

                Tour.showStep(button.data('step'));
                Menu.toggleMenu({}, 'close');
            });

            navContainers[floor].append(navRow);

            numSteps++;
        });

        for(i = 1; i <= numFloors; i++) {
            var group = L.layerGroup(floors['level' + i]);

            floors['level' + i] = group;
        }
    }

    Tour.showStep = function(step) {
        setStep(step);
    };

    function setStep(step) {
        step = Math.max(step, 1);
        step = Math.min(numSteps, step);
        
        currentStep = step;

        stepCount.text(step + ' / ' + numSteps);

        showTourStep(step);
    }

    Tour.keyboardNav = function(e) {

        switch(e.keyCode) {
            case 37: // Left
            case 38: // Up
            Tour.previousStep();
            break;

            case 39: // Right
            case 40: // Down
            Tour.nextStep();
            break;
        }
    }

    function showTourStep(step) {

        activeStep = steps[step - 1];

        // Show the article
        $('.tour-article', wrapper).removeClass('active-article');
        activeStep.node.addClass('active-article');

        dirPanel.html(activeStep.directions);

        // Show the floor
        showLevel(activeStep.level);

        // Sync the menu to the floor
        Menu.changeDepth({}, 'nav-tour-l' + activeStep.level, Menu.Modes.TOUR);

        // Show the marker
        activeFloor.eachLayer(function(layer) {
            if(!layer._url)
                activeFloor.removeLayer(layer);
        });

        activeFloor.addLayer(activeStep.marker);

        map.panTo(activeStep.marker.getLatLng());

        // Resize figure captions to match the images
        $('figure', activeStep.node).each(function (i) {
            $(this).find('figcaption').css('max-width', $(this).find('img').width());
        });
    }

    Tour.nextStep = function() {
        setStep(currentStep + 1);
    };

    Tour.previousStep = function() {
        setStep(currentStep - 1);
    };

}(window.Tour = window.Tour || {}, jQuery));

/*
====================
Entry Point
====================
*/
var TePapa;

// Monitoring the current layout mode
var displayModes = {
    MOBILE:     0,
    TABLET:     1,
    DESKTOP:    2
};

var displayMode     = displayModes.DESKTOP;
var oldDisplayMode  = displayMode;

var gid, gtn, gqs;
var body, html, w;

/*
 * Executed after every page load (including ajax pages). 
 */
function pageLoad(url) {

    TePapa.Masonry.init();
    
	context = '#search'; //Trying to not conflict with any other searches
	submitSearch = function(e){
		console.log('submit');
	    if(e){
	    	e.preventDefault();
	    }
	    location.href = '/tpsearch/results.aspx?k=' + $('#search-query', context).attr('value');
	}
	$('#search-query', context).keyup(function(e){
	    e.preventDefault();
	    if(e.keyCode == 13){
	        submitSearch();
	    }
	});
	
	$('#search-submit', context).click(submitSearch);    

    // Placeholders for older browsers
    $('[placeholder]').defaultValue();
    
    $('.ie8 #search > input[type=text]').bind({
        focus: function() {
            $(this).parent().width(190);
        },
        blur: function() {
            $(this).parent().width(70);
        }
    });

    // Adjust figure sizes
    gtn('figure').each(function (i) {
        var figure = $(this);
        figure.find('img').one('load', function() {
            figure.find('figcaption').css('max-width', $(this).width());
        }).each(function() {
            if(this.complete) 
                $(this).load();
        }); 
    }); 

    // add scrolling to tables
    gqs('article table').wrap('<div class="scroll table-scroll" />');

    gqs('.accordion h2').click(function(e) {
        $(this).toggleClass('open');
    });
    
    gid('whats-on-cover').royalSlider({
        autoHeight: false,
        arrowsNav: true,
        autoScaleSlider: true, 
        autoScaleSliderWidth: 400,     
        autoScaleSliderHeight: 300,
        controlsInside: false,
        controlNavigation: 'bullets',
        fadeinLoadedSlide: false,
        keyboardNavEnabled: true,       
        loop: true,
        imageAlignCenter: false,
        imageScaleMode: 'fit',
        imageScalePadding: 0,
        navigateByClick: false,
        numImagesToPreload:2,
        transitionSpeed: 600,
        slidesSpacing: 0,
        sliderDrag: true
    });
    
    var sponsors = gqs('.sponsors');

    if(sponsors.length){
        sponsors.royalSlider({
            arrowsNav: false,
            autoPlay: {
                delay: 3000,
                enabled: true
            },
            controlNavigation: 'none',
            fadeinLoadedSlide: true,
            loop: true,
            keyboardNavEnabled: false,
            transitionSpeed: 500,
            transitionType: 'fade'
        });
    }

    gqs('a.toggle').each(function() {
        new MBP.fastButton($(this).get(0), function(e) {

            gid($(e.target || e.srcElement).attr('rel')).toggle();
        });
    });

    TePapa.Directions.init();

    Map.init();
    Tour.init();

    // Tabs
    setupSliders();

    var dateSelect = gid('filter-date');

    if(dateSelect.length) {
        var lowerLimit = -90;
        var upperLimit = 365;
        var yearOffset = (new Date().getYear() < 1000) ? 1900 : 0;

        function pad(val) {
            var pad = '00';

            return (pad + val).slice(-pad.length);
        }

        var selectDay   = $('select.select-day',    dateSelect);
        var selectMonth = $('select.select-month',  dateSelect);
        var selectYear  = $('select.select-year',   dateSelect);

        var urlDate = document.location.href.match(/calendardate=([0-9]+)\/([0-9]+)\/([0-9]+)/);
        var urlType = document.location.href.match(/eventtype=([a-z]+)/);

        var today = new Date();

        var todayDay    = today.getDate();
        var todayMonth  = today.getMonth() + 1;
        var todayYear   = today.getYear() + yearOffset; 

        if(urlDate) {
            var chosenDay   = parseInt(urlDate[1]);
            var chosenMonth = parseInt(urlDate[2]);
            var chosenYear  = parseInt(urlDate[3]);
        }
        else {
            var chosenDay   = today.getDate();
            var chosenMonth = today.getMonth() + 1;
            var chosenYear  = today.getYear() + yearOffset; 
        }

        selectDay.val(pad(chosenDay));
        selectMonth.val(pad(chosenMonth));

        var startDate = new Date();
        startDate.setDate(lowerLimit + todayDay);

        var endDate = new Date();
        endDate.setDate(upperLimit + todayDay);

        for(y = (startDate.getYear() + yearOffset); y <= endDate.getYear() + yearOffset; y++) {
            var option = $(document.createElement('option'));
            option.val(y);
            option.text(y);
            selectYear.append(option);
        }

        selectYear.val(chosenYear);

        new MBP.fastButton($('button', dateSelect).get(0), function(e) {

            var selectedDate = new Date(selectYear.val(), selectMonth.val() - 1, selectDay.val(), 0, 0, 0, 0);

            var delta = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));

            if(delta > upperLimit) 
                selectedDate = endDate;
            else if(delta < lowerLimit)
                selectedDate = startDate;

            var dateString = pad(selectedDate.getDate()) + '/' + pad(selectedDate.getMonth() + 1) + '/' + (selectedDate.getYear() + yearOffset);

            selectDay.val(pad(selectedDate.getDate()));
            selectMonth.val(pad(selectedDate.getMonth() + 1));

            document.location.href = 'EventsCalendar.aspx?calendardate=' + dateString + ((urlType) ? '&eventtype=' + urlType[1] : '');

            if(e.preventDefault)
                e.preventDefault();
            else
                e.returnValue = false;

            return false;
        });
    }
}

(function(TePapa, $, undefined) {

    var w, d;
    TePapa.isMobile     = false;

    TePapa.isIEMobile   = false;
    TePapa.isAndroid    = false;
    TePapa.isIOS        = false;

    TePapa.Masonry = {
        container:      [],
        itemSelector:   'li.event',
        instance:       {},

        init: function() {
            TePapa.Masonry.container = gqs('.event-list');

            TePapa.Masonry.recalculate();

            TePapa.Masonry.instance = TePapa.Masonry.container.masonry({
                itemSelector:   TePapa.Masonry.itemSelector,
                isFitWidth:     false,
                columnWidth:    function(containerWidth) {
                    var numColumns = (displayMode > displayModes.MOBILE) ? 3 : 1;

                    return Math.floor(containerWidth / numColumns);
                }
            });

            TePapa.Masonry.container.css('visibility', 'visible');
        },

        // Set explicit sizes for the tiles
        recalculate: function() {
            var numColumns = (!TePapa.isMobile) ? 3 : 1;
            var mobileHeight = 300;

            var columWidth = Math.floor(TePapa.Masonry.container.width() / numColumns);
            var featuredWidth = (!TePapa.isMobile) ? columWidth * 2 : columWidth;
            var featuredHeight = (!TePapa.isMobile) ? 468 : mobileHeight;

            $(TePapa.Masonry.itemSelector, TePapa.Masonry.container).each(function() {
                $(this).css({
                    width:  ($(this).hasClass('featured') ? featuredWidth : columWidth),
                    height: ($(this).hasClass('featured') ? featuredHeight : (TePapa.isMobile) ? mobileHeight : 234)
                });
            });
        }
    };

    TePapa.Scrollers = {
        containers:  [],
        instances:   [],

        init: function() {
            TePapa.Scrollers.containers = gqs('.scroll');

            TePapa.Scrollers.check();
        },

        check: function() {
            if(!TePapa.Scrollers.containers.length)
                return;

            // If the breadcrumbs are overflowing, make the rightmost crumbs visible
            if(displayMode < displayModes.DESKTOP && !TePapa.isIOS && !TePapa.isIEMobile) {
                
                TePapa.Scrollers.containers.each(function() {
                    var instance = new iScroll($(this).get(0), { hScrollbar: false, vScrollbar: false, vScroll: false, hScroll: true });
                    instance.scrollTo(-$('ul', $(this)).width(), 0);

                    TePapa.Scrollers.instances.push(instance);
                });
            }
            else {
          
                if(TePapa.Scrollers.instances.length) {
                    for(i in TePapa.Scrollers.instances) {
                        TePapa.Scrollers.instances[i].destroy();
                        TePapa.Scrollers.instances[i] = null;
                    }

                    TePapa.Scrollers.instances = [];

                    // iScroll doesn't remove its CSS properly
                    if(!Modernizr.csstransforms3d) {
                        $('ul', TePapa.Scrollers.containers).css({
                            position: 'relative',
                            left: 0
                        });
                    }
                }
            }
        }
    };

    TePapa.Directions = {

        directionsService:  null,
        directionsDisplay:  null,
        targetAddress:      'Te Papa Museum, Wellington',
        directionMode:      google.maps.TravelMode.DRIVING,
        startAddress:       '',
        stepContainer:      null,
        form:               null,
        map:                null,

        init: function() {
            TePapa.Directions.form = gid('calculate-directions');

            if(!TePapa.Directions.form.length)
                return;

            TePapa.Directions.map = new google.maps.Map(document.getElementById("directions-map"), {
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                center: new google.maps.LatLng(-41.290448, 174.782159)
            });

            TePapa.Directions.startAddress = $('#directions-from', TePapa.Directions.form);

            TePapa.Directions.stepContainer = $('.directions-steps', TePapa.Directions.form);

            if(!TePapa.Directions.directionsService) {
                TePapa.Directions.directionsService = new google.maps.DirectionsService();

                TePapa.Directions.directionsDisplay = new google.maps.DirectionsRenderer();
                TePapa.Directions.directionsDisplay.setMap(TePapa.Directions.map);
            }

            $('a[data-mode]', TePapa.Directions.form).each(function() {
                new MBP.fastButton($(this).get(0), TePapa.Directions.setMode);
            });

            TePapa.Directions.form.submit(function(e) {
                e.preventDefault();

                TePapa.Directions.calculate();
            });
        },

        setMode: function(e) {
            var target = $(e.target || e.srcElement);

            target.parent().siblings().removeClass('current');
            target.parent().addClass('current');

            var mode = google.maps.TravelMode.DRIVING;

            switch(target.data('mode')) {
                case 'walk':
                    mode = google.maps.TravelMode.WALKING;
                break;

                case 'car':
                    mode = google.maps.TravelMode.DRIVING;
                break;

                case 'bus':
                    mode = google.maps.TravelMode.TRANSIT;
                break;

                case 'bike':
                    mode = google.maps.TravelMode.BICYCLING;
                break;
            }

            TePapa.Directions.directionMode = mode;

            if(TePapa.Directions.startAddress.val())
                TePapa.Directions.calculate();
        },

        calculate: function() {
            var request = {
                origin:         TePapa.Directions.startAddress.val(),
                destination:    TePapa.Directions.targetAddress,
                travelMode:     TePapa.Directions.directionMode
            };

            TePapa.Directions.startAddress.removeClass('error');

            $('button', TePapa.Directions.form).addClass('loading');

            TePapa.Directions.directionsService.route(request, function(response, status) {

                if(response && response.Mb) {
                    var modeName = (response.Mb.travelMode[0] + response.Mb.travelMode.slice(1).toLowerCase());

                    TePapa.Directions.stepContainer.removeClass('hide');
                    $('h5', TePapa.Directions.stepContainer).text(modeName + ' directions to Te Papa Museum');
                }

                var errorMessage = $('.alert-error', TePapa.Directions.stepContainer);
                var stepList = $('ol', TePapa.Directions.stepContainer);

                stepList.html('');

                if(status == 'OK' && response.routes.length) {
                    errorMessage.addClass('hide');

                    TePapa.Directions.directionsDisplay.setDirections(response);

                    for(i = 0; i < response.routes[0].legs[0].steps.length; i++) {
                        var step = $(document.createElement('li')).html(response.routes[0].legs[0].steps[i].instructions);

                        stepList.append(step);
                    }
                }
                else {
                    errorMessage.removeClass('hide');
                    TePapa.Directions.startAddress.addClass('error');
                }

                $('button', TePapa.Directions.form).removeClass('loading');
            });
        }
    };

    /*
     * Attempts to detect which media query the CSS is using
     */
    TePapa.init = function() {
        w       = $(window);
        d       = $(document);
        body    = gtn('body');

        detectDevice();
        detectDisplayMode();

        // Run only on resize stop
        w.smartresize(onResize);

        d.ready(onLoad);
    }

    function detectDevice() {
        var ua = navigator.userAgent;

        if(ua.match(/IEMobile/)) {
            TePapa.isIEMobile = true;
            body.addClass('ie-mobile');
        }
        else if(ua.match(/Android/)) {
            TePapa.isAndroid = true;
            body.addClass('android');
        }
        else if(ua.match(/iPhone/) || ua.match(/iPad/)) {
            TePapa.isIOS = true;
            body.addClass('ios');
        }
    }

    function onResize() {
        detectDisplayMode();

        TePapa.Masonry.recalculate();
        TePapa.Masonry.instance.masonry('reload');

        // Resize figure captions to match the images
        gtn('figure').each(function (i) {
            $(this).find('figcaption').css('max-width', $(this).find('img').width());
        });
    }

    function onLoad() {
        Menu.init();

        /*
        Pager.init();
        Pager.onPageLoad(pageLoad);
        */

        TePapa.Scrollers.init();

        gtn('body').click(function() {
            if(displayMode < displayModes.DESKTOP)
                return;

            gqs('header ul.share-menu').hide();
        });

        // Set the startup image
        MBP.startupImage();

        pageLoad(document.location.href);

        body.addClass('loaded');            
    }

    function onModeChange() {     
        TePapa.Scrollers.check();

        w.trigger('displayModeChange');
    }

    /*
     * Attempts to detect which media query the CSS is using
     */
    function detectDisplayMode() {
        if(w.width() < 568)
            displayMode = displayModes.MOBILE;
        else if(w.width() < 980)
            displayMode = displayModes.TABLET;
        else
            displayMode = displayModes.DESKTOP;

        // Detect display mode changes
        if(oldDisplayMode != displayMode) {
            oldDisplayMode = displayMode;

            if(displayMode == displayModes.DESKTOP)
                Menu.toggleMenu({label: 'detectDisplayMode'}, 'close');
            
            onModeChange();
        }

        TePapa.isMobile = (displayMode == displayModes.MOBILE);

        // Refresh the scroller on resize
        setTimeout(function () {
            if(TePapa.Scrollers.intance != null)
                TePapa.Scrollers.intance.refresh();
        }, 0);
    }

}(window.TePapa = window.TePapa || {}, jQuery));


$(function(){

    // Native DOM calls are faster than jQuery
    gid = function(id) {
        return $(document.getElementById(id));
    };

    gtn  = function(tag) {
        return $(document.getElementsByTagName(tag));
    };
    
    gqs = function(query) {
        if(typeof document.querySelectorAll != 'function')
            return $(query);
        else
            return $(document.querySelectorAll(query));
    }


    // Home page slider
    var cover = gid('cover');

    if (cover.length) {

        html = gtn('html');
        w    = $(window);
        body = gtn('body');

        cover.royalSlider({
            arrowsNav: true,
            autoScaleSlider: true, 
            autoScaleSliderWidth: 400,     
            autoScaleSliderHeight: 300,
            controlsInside: false,
            controlNavigation: 'bullets',
            fadeinLoadedSlide: false,
            keyboardNavEnabled: true,       
            loop: true,
            imageAlignCenter: false,
            imageScaleMode: 'fit',
            imageScalePadding: 0,
            navigateByClick: false,
            numImagesToPreload: 3,
            transitionSpeed: 600,
            slidesSpacing: 0,
            sliderDrag: true
        });
    
        cover.css('visibility', 'visible');

        var slider = cover.data('royalSlider');
        
        if(html.hasClass('ie8') || html.hasClass('ie7')) {
            function coverResize() {
                if(w.height() < 900) {
                    $('#cover, header').css('max-width', '1024px');
                    $('#cover').css('margin-top', '-240px');
                    
                } else if(w.width() > 1440) {
                	$('#cover, header').css('max-width', '1024px');
                	$('#cover').css('margin-top', '-240px');
                } else {
                    $('#cover, header').css('max-width', '1600px');
                }
            }

            w.smartresize(function() {
                coverResize();
            });

            w.trigger('resize');
        }
        
        function checkSlideColour() {
            var black = slider.currSlide.holder.find('.rsContent').hasClass('black');

            if(black) {
                body.addClass('black').removeClass('white');
            } 
            else {
                body.addClass('white').removeClass('black');
            }

            $('.rsActiveSlide', cover).removeClass('rsActiveSlide');

            slider.currSlide.holder.addClass('rsActiveSlide');  
        }
        checkSlideColour();
        slider.ev.on('rsAfterContentSet', checkSlideColour);
        slider.ev.on('rsBeforeAnimStart', checkSlideColour);
    }

    TePapa.init();
});
