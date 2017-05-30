/** http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/
 * Gets the browser name or returns an empty string if unknown. 
 * This function also caches the result to provide for any 
 * future calls this function has.
 * 
 * @returns {string}
 */
var browserDetect = function() {
    // Return cached result if avalible, else get result then cache it.
    if (browserDetect.prototype._cachedResult)
        return browserDetect.prototype._cachedResult;

    //Detection by duck-typing

    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    browserDetect.prototype._cachedResult =
        isOpera ? 'Opera' :
        isFirefox ? 'Firefox' :
        isSafari ? 'Safari' :
        isChrome ? 'Chrome' :
        isIE ? 'IE' :
        isEdge ? 'Edge' :
        "Don't know";

    if(browserDetect.prototype._cachedResult !== "Don't know") {
        return browserDetect.prototype._cachedResult;
    } else {
        //Detection by useragent
        isIE = /*@cc_on!@*/false || !!document.documentMode;
        isEdge = !isIE && !!window.StyleMedia;
        if(navigator.userAgent.indexOf("Chrome") != -1 && !isEdge) {
            browserDetect.prototype._cachedResult = "Chrome";
        } else if(navigator.userAgent.indexOf("Safari") != -1 && !isEdge) {
            browserDetect.prototype._cachedResult = "Safari";
        } else if(navigator.userAgent.indexOf("Firefox") != -1 ) {
            browserDetect.prototype._cachedResult = "Firefox";
        } else if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )) {
            browserDetect.prototype._cachedResult = "IE";
        } else if(isEdge) {
            browserDetect.prototype._cachedResult = "Edge";
        } else {
            browserDetect.prototype._cachedResult = "Don't know";
        }
        return browserDetect.prototype._cachedResult;
    }
};