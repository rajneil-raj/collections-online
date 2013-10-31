/*
 *
 */
var Pager = {

    _layoutContainer:   null,
    _history:           window.History,

    _classIgnore:       'pager-ignore',
    _classBound:        'pager-enabled',

    _classPageNew:      'page-enter',
    _classPageCurrent:  'page-current',
    _classPageOld:      'page-exit',

    // For browsers with CSS transitions, sync with CSS animation time
    _animationTime:     200,

    _callbacks:         [],

    _mainMenu:          null,
    _body:              null,

    _pageTitle:         '',

    /*
     *
     */
    init: function() {
        var self = Pager;

        self._layoutContainer = gid('layout');
        self._mainMenu = gid('menu');
        self._pageTitle = gtn('title').html();
        self._body = gtn('body');

        // Don't ajax load pages if we're on older browsers
        if(!self._history.enabled || ($.browser.msie && parseInt($.browser.version) < 9))
            return;

        self._history.Adapter.bind(window, 'statechange', self._stateChange);

        self._bindLinks();
    },

    /*
     *
     */
    _bindLinks: function() {
        var self = Pager;

        var links = gtn('a');

        for(i in links) {
            // Ignore any links already processed
            if(links[i].className && (links[i].className.indexOf(self._classIgnore) != -1 || links[i].className.indexOf(self._classBound) != -1)) {
                continue;
            }
            
            if(!links[i].href || (links[i].href && links[i].href.indexOf('#') != -1)) {
                links[i].className += ' ' + self._classIgnore;
                continue;
            }

            // Relative links or absolute links on the same domain
            if(links[i].href[0] == '/' || links[i].href.indexOf(location.host) != -1) {

                new MBP.fastButton(links[i], function(e) {

                    self._history.pushState({}, null, this.href);

                    if(e.preventDefault)
                        e.preventDefault();
                    else
                        e.returnValue = false;

                    return false;
                });

                links[i].className += ' ' + self._classBound;
                continue;
            }

            // Most likely an unusable link
            links[i].className += ' ' + self._classIgnore;
        }
    },

    /*
     *
     */
    _stateChange: function() {
        var self = Pager;

        var state = self._history.getState();

        Menu.toggleMenu({label: 'stateChange'}, 'close');
        
        self._loadPage(state.url);
    },

    /*
     *
     */
    _setActiveLink: function(url) {
        var self = Pager;

        $('a[href].pager-enabled', self._mainMenu).each(function() {
            var button = $(this);

            if(url.indexOf(button.attr('href')) != -1)
                button.parent().addClass('current');
            else
                button.parent().removeClass('current');
        });
    },

    /*
     *
     */
    _loadPage: function(url) {
        var self = Pager;

        $.ajax(url, {
            success: function(data, status, xhr) {

                switch(status) {
                    case 'success':
                        var pageBuffer = $(data);

                        var newPage = $('#layout .page-current', pageBuffer);

                        // Copy the page title
                        var title = $('h1:first', pageBuffer).text() || 'Home';
                        document.title = ($.trim(title) + ' - ' + self._pageTitle);

                        // Copy the breadcrumbs over
                        var breadCrumb = $('#breadcrumb', pageBuffer);
                        gid('breadcrumb').html(breadCrumb.html());

                        // Set the new page up for entry
                        newPage.removeClass(self._classPageCurrent).addClass(self._classPageNew);

                        // Send off the old page
                        var currentPage = self._layoutContainer.children();

                        currentPage.removeClass(self._classPageCurrent).addClass(self._classPageOld);

                        self._layoutContainer.append(newPage);

                        if(Modernizr.csstransforms3d && Modernizr.csstransitions) {
                            setTimeout(function() {
                                currentPage.remove();

                                newPage.removeClass(self._classPageNew);

                                self._runCallbacks(url);

                            }, self._animationTime);
                        }
                        else {
                            currentPage.remove();
                            
                            newPage.removeClass(self._classPageNew);

                            self._runCallbacks(url);
                        }                  
                    break;
                }
            },
            error: function() {

            }
        });
    },

    /*
     *
     */
    _runCallbacks: function(url) {
        var self = Pager;

        self._body.removeClass('white black home');

        for(i in self._callbacks) {
            if(typeof self._callbacks[i] == 'function') {
                self._callbacks[i](url);
            }
        }

        self._bindLinks();
        self._setActiveLink(url);
    },

    /*
     *
     */
    onPageLoad: function(method) {
        this._callbacks.push(method);
    }
};
