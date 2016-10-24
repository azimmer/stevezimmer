(function () {
    'use strict';
    /**
     * modified from version 4.12.7 of video.js library
     * https://github.com/videojs/video.js/blob/stable/src/js/xhr.js
     */
    function XHR(requestUrl, requestMethod, data, callback, timeout) {
        requestMethod = requestMethod || 'GET';
        callback = callback || function () {};
        var request, abort;

        function onError(error) {
            clearTimeout(abort);
            callback(error, request, (request.response || request.responseText));
        }

        function onSuccess() {
            clearTimeout(abort);
            callback(null, request, (request.response || request.responseText));
        }

        var Xhreq = window.XMLHttpRequest;
        if (typeof Xhreq === 'undefined') {
            try {
                Xhreq = new window.ActiveXObject('Msxml2.XMLHTTP.6.0');
            }
            catch (error1) {
                try {
                    Xhreq = new window.ActiveXObject('Msxml2.XMLHTTP.3.0');
                }
                catch (error2) {
                    try {
                        Xhreq = new window.ActiveXObject('Msxml2.XMLHTTP');
                    }
                    catch (error3) {
                        throw new Error('Browser does not support Ajax requests');
                    }
                }
            }
        }

        function parseUrl(url) {
            var div = document.createElement('div');
            div.innerHTML = '<a href="' + url + '"></a>';
            var a = div.firstChild;
            div.setAttribute('style', 'display:none;position:absolute;');
            //some older browsers require the anchor be added to the DOM
            //before they can parse the properties we need
            document.body.appendChild(div);
            var details = {
                'protocol': a.protocol,
                'host': a.host
            };
            //strip out any standard ports that IE9 adds to the host property
            if (details.protocol === 'http:') {
                details.host = details.host.replace(/:80$/, '');
            }
            if (details.protocol === 'https:') {
                details.host = details.host.replace(/:443$/, '');
            }
            document.body.removeChild(div);
            return details;
        }

        request = new Xhreq();
        request.uri = requestUrl;
        var urlInfo = parseUrl(requestUrl);
        //check cross domain in an IE8 friendly way (doesn't know location.origin)
        var crossOrigin = (urlInfo.protocol + urlInfo.host) !== window.location.protocol +
            window.location.host;
        //if XMLHTTPRequest2 not available
        if (crossOrigin && window.XDomainRequest &&
            !('withCredentials' in request)) {
            request = new window.XDomainRequest();
            request.onload = onSuccess;
            request.onerror = onError;
            //blank handlers for IE9 bugs:
            // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
            request.onprogress = function () {};
            request.ontimeout = function () {};
        }
        else {
            var fileUrl = urlInfo.protocol === 'file:' || window.location.protocol === 'file:';

            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    if (request.timedout) {
                        return onError('timeout');
                    }
                    if (request.status === 200 ||
                        (fileUrl && request.status === 0)) {
                        onSuccess();
                    }
                    else {
                        onError();
                    }
                }
            };

            if (typeof timeout === 'number') {
                abort = setTimeout(function () {
                    if (request.readyState !== 4) {
                        request.timedout = true;
                        request.abort();
                    }
                }, timeout);
            }
        }

        try {
            request.open(requestMethod, requestUrl, true);
        }
        catch (error) {
            return onError(error);
        }
        if (requestMethod === 'POST') {
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        try {
            request.send(data);
        }
        catch (error) {
            return onError(error);
        }

        return request;
    }

    function Dimensions (width, height) {
        width = parseInt(width);
        height = parseInt(height);
        this.width = function Dimensions_width () {
            return width;
        };
        this.height = function Dimensions_height () {
            return height;
        };
        this.area = function Dimensions_area () {
            return width * height;
        };
    }

    function Box(top, left, width, height) {
        top = top || 0;
        left = left || 0;
        width = width || 0;
        height = height || 0;
        //inherit Dimension's getters and area
        Dimensions.call(this, width, height);
        this.top = function () {
            return top;
        };
        this.left = function () {
            return left;
        };
        this.bottom = function () {
            return this.top() + this.height();
        };
        this.right = function () {
            return this.left() + this.width();
        };
    }
    Box.fromElement = function (element) {
        var top = element.offsetTop,
            left = element.offsetLeft,
            width = element.offsetWidth,
            height = element.offsetHeight;
        while (element.offsetParent) {
            element = element.offsetParent;
            top += element.offsetTop;
            left += element.offsetLeft;
        }
        return new Box(top, left, width, height);
    };

    function Viewport() {
        //inherit Box but override top, left, width, height
        Box.call(this);
        var doc = window.document;
        this.top = function () {
            return window.pageYOffset;
        };
        this.left = function () {
            return window.pageXOffset;
        };
        this.width = function () {
            return window.innerWidth ||
                doc.documentElement.clientWidth ||
                doc.body.clientWidth;
        };
        this.height = function () {
            return window.innerHeight ||
                doc.documentElement.clientHeight ||
                doc.body.clientHeight;
        };
    }

    function px(val) {
        return val + 'px';
    }

    var openSection,
        sections,
        SINGLE_OPEN_SECTION = 0,
        // MULTI_OPEN_SECTIONS = 1, // alternative option to SINGLE_OPEN_SECTION
        //means that opening a section closes current open section
        mode = SINGLE_OPEN_SECTION;

    /**
     * Section class - each section contains a header and an article.
     * Object manages logic to do with opening/closing articles.
     * @param {String} id Element's id attribute.
     * @param {Boolean} initialState [optional] flag setting this element as open.
     */
    var Section = function (id, banner) {
        this.element = document.getElementById(id);
        if (typeof banner === 'undefined') {
            this.isOpen = true;
            this.banner = null;
        }
        else {
            this.isOpen = false;
            this.banner = banner;
        }
        if (this.isOpen) {
            openSection = id;
        }
        var self = this,
            nav = document.querySelector('#' + id + ' > nav'),
            article = document.querySelector('#' + id + ' > article'),
            navHeight,
            headerBg = this.element.querySelector('.wrapper');

        this.setArticleHeight = function () {
            this.articleHeight = article.getBoundingClientRect().height;
            article.style.height = (this.isOpen) ? px(this.articleHeight) : 0;
        };
        this.setArticleHeight();

        function transitionOn() {
            var transition = 'height 300ms ease-out';
            article.style['-webkit-transition'] = transition;
            article.style['-moz-transition'] = transition;
            article.style['-ms-transition'] = transition;
            article.style['-o-transition'] = transition;
            article.style.transition = transition;
        }

        setTimeout(function () {
            transitionOn();
        }, 0);

        this.initBackground = function (url, w, h) {
            headerBg.style.backgroundRepeat = 'repeat';
            headerBg.style.backgroundSize = w + 'px ' + h + 'px';
            headerBg.style.backgroundImage = 'url(img/' + url + '.jpg)';
        };

        this.open = function () {
            if (mode === SINGLE_OPEN_SECTION) {
                if (openSection !== id) {
                    sections[openSection].close();
                }
            }
            else {
                //only in the banner case do we automatically close that section
                //when a different section opens
                if (openSection !== id &&
                    openSection === 'banner' &&
                    id !== 'banner') {
                    sections[openSection].close();
                }
            }
            openSection = id;
            this.isOpen = true;
            article.style.height = px(this.articleHeight);
        };

        this.close = function (fromClick) {
            if (fromClick &&
                openSection === id &&
                this.banner !== null) {
                this.banner.open();
            }
            this.isOpen = false;
            article.style.height = 0;
            resizeHandler();
        };

        function navHandler(e) {
            if (self.isOpen) {
                self.close(true);
            }
            else {
                self.open();
            }
            resizeHandler();
        }

        nav.addEventListener('click', navHandler, false);

        this.setNavHeight = function (h) {
            navHeight = h;
            nav.style.height = px(h);
            // not sure I recall what this was for...
            //var dif = Math.floor(Math.abs(h - svgHeight) / 2);
        };
    };

    var content = document.getElementById('content'),
        banner = new Section('banner'),
        numSections = 7,
        maxNavHeight = 124;

    sections = {
        'banner': banner,
        'services': new Section('services', banner),
        'rates': new Section('rates', banner),
        'contact': new Section('contact', banner),
        'directions': new Section('directions', banner),
        'credentials': new Section('credentials', banner),
        'family': new Section('family', banner)
    };

    /*
     * Randomly chooses 7 backgrounds from the list and sets them
     * as each header tile.
     */
    (function setBgs() {
        var bgs = {
            'maple_striped': [248],
            'maple_flame_tiled': [626],
            'maple_birdseye_tiled': [646],
            'paint_flakes_rust': [373],
            'river_tiled': [668],
            'wood_burl_tiled': [596],
            'decay': [740],
            'cream_onyx_tiled': [746],
            'natural_stone_tiled': [744],
            'sandstone_gullies_tiled': [652],
            'travertine_tiled': [744],
            'marble_tiled': [992],
            'gneiss': [421],
            'soapstone_tiled': [662],
            'tiger_onyx': [846],
            'silver_soapstone': [372],
            'greenstone_tiled': [662],
            'granite_tiled': [249],
            'rusty_marble_tiled': [664],
            'green_onyx': [1518],
            'gold_onyx_tiled': [662],
            'fossil_limestone': [372],
            'pink_granite': [331],
            'pink_granite_tiled': [888]
        };
        //if you need to test a single background image:
        //testing = 'maple_striped';

        var testing,
            imgs = Object.keys(bgs),
            key;
        for (var p in sections) {
            var section = sections[p];
            if (testing) {
                key = testing;
            }
            else {
                var n = Math.round(Math.random() * (imgs.length - 1));
                key = imgs.splice(n, 1);
            }

            var dims = bgs[key],
                h = (dims.length > 1) ? Math.round(dims[1] / 2) : 248 / 2;

            section.initBackground(key, Math.round(dims[0] / 2), h);
        }
    })();

    (function initForm() {
        var name = document.getElementById('nameField'),
            email = document.getElementById('emailField'),
            subject = document.getElementById('subjectField'),
            body = document.getElementById('bodyField'),
            btn = document.getElementById('submitButton'),
            responsePanel = document.createElement('div'),
            respInner = document.createElement('div'),
            respContent = document.createElement('div'),
            resp = document.createElement('p'),
            okBtn = document.createElement('div');

        responsePanel.id = 'response';
        document.querySelector('#contact article').appendChild(responsePanel);
        respInner.setAttribute('class', 'response-inner');
        responsePanel.appendChild(respInner);
        respContent.setAttribute('class', 'response-content');
        respInner.appendChild(respContent);
        resp.id = 'responseText';
        respInner.appendChild(resp);
        okBtn.id = 'okButton';
        okBtn.setAttribute('class', 'form-button');
        respInner.appendChild(okBtn);
        okBtn.innerHTML = 'OK';

        function setFocusStyle(e) {
            e.target.style.border = '1px solid #DF9A7F';
        }

        function setBlurStyle(e) {
            e.target.style.border = '1px solid #ccc';
        }

        function setErrorStyle(field) {
            field.style.border = '1px solid red';
        }

        function fadeOut() {
            setTimeout(function () {
                responsePanel.style.opacity = 0;
                setTimeout(function () {
                    responsePanel.style.display = 'none';
                    responsePanel.style.opacity = 1;
                }, 500);
            }, 3000);
        }

        function fadeIn() {
            responsePanel.style.display = 'block';
            responsePanel.style.opacity = 1;
            fadeOut();
        }

        function validate() {
            var url = './mailer.php';
            if (!name.value.length ||
                name.value.match(/[+\=\-*\/\\|\{\}\[\]\(\)~\$<\>]/g)) {
                setErrorStyle(name);
                return;
            }
            // jscs: disable
            var exp = "^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"; // jshint ignore:line
            // jscs: enable
            if (!email.value.length ||
                !email.value.match(new RegExp(exp, 'i'))) {
                setErrorStyle(email);
                return;
            }
            if (!subject.value.length ||
                subject.value.match(/[+\=\-*\/\\|\{\}\[\]\(\)~\$<\>]/g)) {
                setErrorStyle(subject);
                return;
            }
            if (!body.value.length ||
                body.value.match(/[+\=\-*\/\\|\{\}\[\]\(\)~\$<\>]/g)) {
                setErrorStyle(body);
                return;
            }
            var data = 'name=' + name.value + '&' +
                'mail=' + email.value + '&' +
                'subject=' + subject.value + '&' +
                'message=' + body.value;
            XHR(url,
                'POST',
                data,
                function (error, req, response) {
                    if (error !== null) {
                        resp.innerHTML = '<b>Error</b><br />' + error;
                    }
                    else {
                        if (response.indexOf(',') !== -1) {
                            var codes = response.split(','),
                                code = parseInt(codes[1]),
                                fields = ['name', 'email', 'subject', 'message'];
                            resp.innerHTML = '<b>Error</b><br />The ' + fields[code] +
                                ' you entered is an invalid value.';
                        }
                        else {
                            response = parseInt(response);
                            if (response === 1) {
                                resp.innerHTML = '<b>Thanks</b><br />Your email has been sent.';
                            }
                            else {
                                resp.innerHTML = '<b>Sorry</b><br />The email server appears to be down.' +
                                    '<br />Please try again later or contact Steve by phone.';
                            }
                        }
                    }
                    fadeIn();
                }
            );
        }

        btn.onclick = function () {
            validate();
        };

        name.onfocus = setFocusStyle;
        email.onfocus = setFocusStyle;
        subject.onfocus = setFocusStyle;
        body.onfocus = setFocusStyle;
        name.onblur = setBlurStyle;
        email.onblur = setBlurStyle;
        subject.onblur = setBlurStyle;
        body.onblur = setBlurStyle;
        okBtn.onclick = function () {
            responsePanel.style.display = 'none';
        };
    })();

    function resizeHandler(e) {
        var viewport = new Viewport(),
            openArticleHeight = 0;

        var resize = function () {
            var rem = viewport.height() - openArticleHeight;
            var navHeight = Math.min(maxNavHeight, Math.floor(rem / numSections));
            for (var p in sections) {
                sections[p].setNavHeight(navHeight);
            }
            var contentHeight = navHeight * numSections + openArticleHeight;
            content.style.height = px(contentHeight);
        };

        //if viewport has changed, article heights may have changed
        if (e) {
            if (openSection) {
                sections[openSection].setArticleHeight();
                setTimeout(function () {
                    openArticleHeight = sections[openSection].articleHeight;
                    resize();
                }, 0);
            }
            else {
                resize();
            }
        }
        else {
            if (openSection) {
                openArticleHeight = sections[openSection].articleHeight;
            }
            resize();
        }
    }

    if (window.addEventListener) {
        window.addEventListener('resize', resizeHandler, false);
    }
    else if (window.attachEvent) {
        window.attachEvent('onresize', resizeHandler);
    }
    resizeHandler();
})();
