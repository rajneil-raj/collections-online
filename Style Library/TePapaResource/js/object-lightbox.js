/*
 *  Implements the client-side logic for the ObjectLightBox page.
 *
 *  flashMode: Valid values are auto, force & disabled.
 *  suppressMessages: Valid values are true & false.
 */
function ObjectLightBox(config) {
    var thisObjectLightBox = this;
    var objectLightBox = $(".object-lightbox");
    config = $.extend({ flashMode: "auto", suppressMessages: true }, config);
    this._config = config;
    this._currentOrientation = window.orientation;
    this._isHighResolutionDisplay = this._getDevicePixelRatio() >= 1.5 || this._getScreenResolution() >= 200;

    this._initializeLayout(objectLightBox, $(".object-lightbox-content"), $(".object-lightbox-zoom"), $(".object-lightbox-thumbnails"), $(".object-lightbox-footer"));
    this._initializeThumbnails();
    this._listenForOrientationChanges();
    if (config.suppressMessages) this._suppressMessages();
    this._initializeLoaderIcon(objectLightBox);

    // Configure Flash
    this._useFlash = false;//config.flashMode === "force" || (config.flashMode === "auto" && this._isAndroidDevice() && this._hasFlashSupport());

    if (config.selectedIrn) {
        $(".object-lightbox-thumbnails li[data-irn=" + config.selectedIrn + "]").addClass("ui-selected");
        this._loadContent(config.selectedIrn, config.selectedCanZoomify, config.selectedZoomPath);
    }

    // Provides access to methods on Z.Viewport that may have obfuscated names.
    this._viewPortHelper = {

        /*
        *   Detect the correct method name for a particular method on ZoomifyViewport.
        *   The name can change between the development and production versions because of minification.
        */
        detectMethodName: function (methodName, minifiedMethodName) {
            var methodNameCache = "_" + methodName;

            if (!this[methodNameCache]) {
                this[methodNameCache] = methodName in Z.Viewport ? methodName : minifiedMethodName;
            }

            return this[methodNameCache];
        },

        getTierScaleAsZoom: function () {
            return Z.Viewport[this.detectMethodName("getTierScaleAsZoom", "z272AsZoom")]();
        },

        scaleTierToZoom: function (imageZoom) {
            return Z.Viewport[this.detectMethodName("scaleTierToZoom", "z355")](imageZoom);
        },

        updateView: function (override) {
            return Z.Viewport[this.detectMethodName("updateView", "z391")](override);
        }

    };
}
ObjectLightBox.prototype = {

    /*
    *   Calculates and sets the sizes of the various elements that make up the light box.
    */
    _initializeLayout: function (objectLightBox, objectLightBoxContent, objectLightBoxZoom, objectLightBoxThumbnails, objectLightBoxFooter) {
        var zoomPaddingAndMarginHeight = objectLightBoxZoom.outerHeight() - objectLightBoxZoom.height();

        this._contentHeight = objectLightBox.height() - objectLightBoxFooter.outerHeight(true);
        objectLightBoxContent.height(this._contentHeight);
        objectLightBoxZoom.width(objectLightBox.width() - objectLightBoxThumbnails.outerWidth(true));
        objectLightBoxZoom.height(this._contentHeight - zoomPaddingAndMarginHeight);
    },

    /*
    *   Set up the thumbnails so that they're selectable.
    */
    _initializeThumbnails: function () {
        var thisObjectLightBox = this;
        var thumbnails = $(".object-lightbox-thumbnails");
        var selectedClassName = "ui-selected";

        thumbnails.click(function (event) {
            var selectedItem = $(event.target).closest("li");

            if (selectedItem.length === 1) {
                thumbnails.children("li").removeClass(selectedClassName);
                selectedItem.addClass(selectedClassName);
                thisObjectLightBox._loadContent(selectedItem.data("irn"), selectedItem.data("canZoomify"), selectedItem.data("zoomPath"));
            }
        });
    },

    _listenForOrientationChanges: function () {

        var thisObjectLightBox = this;

        $(window).bind("message", function (event) {
            thisObjectLightBox._initializeLayout($(".object-lightbox"), $(".object-lightbox-content"), $(".object-lightbox-zoom"), $(".object-lightbox-thumbnails"), $(".object-lightbox-footer"));
            thisObjectLightBox._resizeContent();
        });

    },

    /*
    *   Suppress error messages from HTML 5 Zoomify viewer
    */
    _suppressMessages: function () {

        // When the Zoomify source is minified, the showMessage function is renamed to z366.
        var methodName = Z.Utils.showMessage ? "showMessage" : "z366";

        Z.Utils[methodName] = function () { };
    },

    /*
    *  Loads the specified image into the content pane.
    */
    _loadContent: function (irn, canZoomify, zoomPath) {
        var zoom = $(".object-lightbox-zoom");
        this._canZoomify = canZoomify;

        if (canZoomify) {
            if (this._useFlash)
                this._loadFlashViewer(zoom, zoomPath);
            else
                this._loadHtmlViewer(zoom, zoomPath);
        }
        else
            this._loadImage(zoom, irn);

        // Update Buy Or License link
        if ($("#buyOrLicense").length > 0) {
            var buyOrLicense = $("#buyOrLicense");
            var href = buyOrLicense.attr("href");
            buyOrLicense.attr("href", href.split("=")[0] + "=" + irn);

        }

        this._trackPageHit(irn);
        this._loaderIcon.hide();
    },

    /*
    *  Loads the image in the simplest manner. Just displays the image in an "img" element.
    */
    _loadImage: function (container, irn) {
        var imageHeight = this._contentHeight;

        container.empty();
        container.append($("<img alt='' src='/db_images/objimage.jpg?width=640&height=" + imageHeight + "&irn=" + irn + "' />"));
    },

    /*
    *  Loads the image using the Flash viewer.
    */
    _loadFlashViewer: function (container, zoomPath) {
        var elementName = "zoomifier";
        var viewerPath = "/utils/ZoomifyViewerSmallToolBar.swf";

        container.empty().append($("<div id='" + elementName + "'></div>"));
        swfobject.embedSWF(viewerPath, elementName, "100%", container.height(), "9.0.0", "expressInstall.swf",
                {
                    zoomifyImagePath: zoomPath,
                    zoomifyX: 0.0,
                    zoomifyY: 0.0,
                    zoomifyZoom: -1,
                    zoomifyToolbar: 1,
                    zoomifyNavWindow: 0
                }
            );
    },

    /*
    *  Loads the image using the HTML 5 viewer.
    */
    _loadHtmlViewer: function (container, zoomPath) {

        var thisObjectLightBox = this;

        /*
        *   Implements our custom tool bar for the HTML 5 Zoomify viewer.
        */
        function ToolBar(config) {

            var thisToolBar = this;
            this._config = config;
            this._isZooming = false;
            this._buildToolBar();
        }
        ToolBar.prototype = {

            /*
            *   Add support for a touch screen.
            */
            enableTouchSupport: function () {
                this._zoomInButton.bind("touchstart", $.proxy(this._zoomStart("in"), this));
                this._zoomInButton.bind("touchend", $.proxy(this._zoomStop, this));
                this._zoomOutButton.bind("touchstart", $.proxy(this._zoomStart("out"), this));
                this._zoomOutButton.bind("touchend", $.proxy(this._zoomStop, this));
            },

            reset: function () {
         
            },

            _zoomStop: function (event) {
                if (this._isZooming) {
                    this._config.zoomify.Viewport.zoom("stop");
                    this._isZooming = false;
                    event.preventDefault();
                }
            },

            _zoomStart: function (zoomAction) {
                var thisToolBar = this;

                return function (event) {
                    thisToolBar._isZooming = true;
                    thisToolBar._config.zoomify.Viewport.zoom(zoomAction);
                    thisToolBar._triggerZooming();
                    event.preventDefault();
                };
            },

            _zooming: function () {
                if (this._isZooming) {
                    this._triggerZooming();
                }
            },

            _triggerZooming: function () {
                window.setTimeout($.proxy(this._zooming, this), this._config.zoomStepInterval);
            },

            _panStart: function (direction) {
                var thisToolBar = this;

                return function (event) {
                    thisToolBar._config.zoomify.Viewport.pan(direction);
                    event.preventDefault();
                };
            },

            _panStop: function (stopCommand) {
                var thisToolBar = this;

                return function (event) {
                    thisToolBar._config.zoomify.Viewport.pan(stopCommand);
                    event.preventDefault();
                };
            },

            _preventDefault: function (event) {
                event.preventDefault();
            },

            _buildToolBar: function () {
                var createToolBar = function () {

                    var toolBar = $("<div class='object-lightbox-toolbar'></div>");

                    if (thisToolBar._config.isTouchDevice) {
                        toolBar.addClass("touch-device");
                    }

                    if (thisToolBar._config.isHighResolutionDisplay) {
                        toolBar.addClass("high-resolution-display");
                    }

                    return toolBar;
                };

                var createButton = function (className, mousedown, mouseup, click) {
                    var button = $("<a type=\"button\" class=\"btn " + className + "\">&nbsp;</a>");

                    if (mousedown) button.mousedown(mousedown);
                    if (mouseup) button.mouseup(mouseup);
                    if (click) button.click(click);

                    return button;
                };

                var createZoomOutButton = function () {
                    return createButton("zoom-out", thisToolBar._zoomStart("out"), $.proxy(thisToolBar._zoomStop, thisToolBar));
                };

                var createZoomInButton = function () {
                    return createButton("zoom-in", thisToolBar._zoomStart("in"), $.proxy(thisToolBar._zoomStop, thisToolBar));
                };

                var createPanButton = function (direction, stopCommand) {
                    return $("<button type='button' class='pan-" + direction.toLowerCase() + "'></button>")
                    .mousedown($.proxy(thisToolBar._panStart(direction.toLowerCase()), thisToolBar))
                    .mouseup($.proxy(thisToolBar._panStop(stopCommand), thisToolBar));
                };

                var thisToolBar = this;

                this._toolBar = createToolBar();
                this._zoomOutButton = createZoomOutButton();
                this._zoomInButton = createZoomInButton();
                this._toolBar
                    .append(this._zoomOutButton)
                    .append(this._zoomInButton)
                    .append(this._resetButton);
            },

            getElement: function () {
                return this._toolBar;
            }

        };

        if (!Z.Viewer) {
            // Create the Zoomify Viewer & our tool bar

            this._toolBar = new ToolBar(
                {
                    zoomify: Z,
                    skinPath: this._config.skinPath,
                    zoomStepInterval: 30,
                    isHighResolutionDisplay: this._isHighResolutionDisplay,
                    isTouchDevice: Modernizr.touch
                });

            // Build the Zoomify Viewer
            // The tool bar must be added to the DOM before sizing the zoomifier div
            var elementName = "zoomifier";
            var zoomifier = $("<div id='" + elementName + "'></div>");
            var toolBar = this._toolBar.getElement();

            container.empty().append(zoomifier);
            $('.object-lightbox-footer').prepend(toolBar);

            zoomifier.width(container.width());
            zoomifier.height(container.height());// - toolBar.outerHeight(true));
            Z.showImage(elementName, zoomPath, "zLogoVisible=0&zFullPageVisible=0&zToolbarVisible=0");

            // Add touch support 
            // (Must be added after elements added to DOM)
            if (Modernizr.touch) this._toolBar.enableTouchSupport();

        } else {
            // Load a new image into the existing Zoomify viewer
            Z.Viewer.setImagePath(zoomPath);
            this._toolBar.reset();
        }
    },

    _createLoaderIcon: function () {
        return $("<span class='object-lightbox-loading-icon' />");
    },

    _initializeLoaderIcon: function (objectLightBox) {
        this._loaderIcon = this._createLoaderIcon();
        objectLightBox.append(this._loaderIcon);
        this._loaderIcon.position({ of: objectLightBox });
    },

    _trackPageHit: function (irn) {
        // Google Analytics tracking
        var url = 'ObjectLightbox.aspx?oid=' + this._config.oid + '&irn=' + irn;
        try {
            var pageTracker = _gat._getTracker('UA-2633618-2');

            pageTracker._setDomainName('.tepapa.govt.nz');
            pageTracker._trackPageview(url);
        }
        catch (err) {
        }
    },

    /*
    *   Returns the device pixel ratio, if available, otherwise null.
    */
    _getDevicePixelRatio: function () {
        return "devicePixelRatio" in window ? window.devicePixelRatio : null;
    },

    /*
    *   Returns the resolution of the screen in DPI. If the resolution cannot be detected, null is returned.
    */
    _getScreenResolution: function () {
        var resolutionIs = function (dpi) {
            return Modernizr.mq("screen and (min-resolution: " + dpi + "dpi)") && Modernizr.mq("screen and (max-resolution: " + dpi + "dpi)");
        };

        for (var counter = 1; counter < 500; counter++) {
            if (resolutionIs(counter)) return counter;
        }

        return null;
    },

    _isAndroidDevice: function () {
        return navigator.userAgent.toLowerCase().indexOf("android") > -1;
    },

    _hasFlashSupport: function () {
        return swfobject.getFlashPlayerVersion().major >= 9;
    },

    _resizeContent: function () {
        var zoom = $(".object-lightbox-zoom");

        if (this._canZoomify) {
            if (this._useFlash)
                this._resizeFlashViewer(zoom);
            else
                this._resizeHtmlViewer(zoom);
        }
    },

    _resizeFlashViewer: function (container) {
        var zoomifier = container.children("object");

        // Has both the attribute and style set
        zoomifier.attr("height", container.height());
        zoomifier.height(container.height());
    },

    _resizeHtmlViewer: function (container) {

        // Resize the Zoomify element
        var width = container.width();
        var height = container.height() - this._toolBar._toolBar.outerHeight(true);
        var zoomifier = container.children("#zoomifier");
        zoomifier.width(width);
        zoomifier.height(height);

        Z.Viewer.setSizeAndPosition(width, height, 0, 0, true);
    }

};