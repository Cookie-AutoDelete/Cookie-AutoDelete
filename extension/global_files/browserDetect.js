/** http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/
 * Updated as of 2020 March 25
 * Gets the browser name or returns an empty string if unknown.
 * This function also caches the result to provide for any
 * future calls this function has.
 *
 * @returns {string}
 */
var browserDetect = function () {
  // Return cached result if available, else get result then cache it.
  if (browserDetect.prototype._cachedResult)
    return browserDetect.prototype._cachedResult;

  //Detection by duck-typing

  // Opera 8.0+
  var isOpera =
    (!!window.opr && !!opr.addons) ||
    !!window.opera ||
    navigator.userAgent.indexOf(' OPR/') >= 0;

  // Firefox 1.0+
  var isFirefox = typeof InstallTrigger !== 'undefined';

  // Safari 3.0+ "[object HTMLElementConstructor]"
  var isSafari =
    /constructor/i.test(window.HTMLElement) ||
    (function (p) {
      return p.toString() === '[object SafariRemoteNotification]';
    })(
      !window['safari'] ||
        // eslint-disable-next-line no-undef
        (typeof safari !== 'undefined' && safari.pushNotification),
    );

  // Internet Explorer 6-11
  var isIE = /*@cc_on!@*/ false || !!document.documentMode;

  // Edge 20+
  var isEdge = !isIE && !!window.StyleMedia;

  // Chrome 1 - 79
  var isChrome =
    !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

  // Edge (based on chromium) detection
  var isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') !== -1;

  // Blink engine detection
  var isBlink = (isChrome || isOpera) && !!window.CSS;

  browserDetect.prototype._cachedResult = isFirefox
    ? 'Firefox'
    : isChrome
    ? 'Chrome'
    : isSafari
    ? 'Safari'
    : isOpera
    ? 'Opera'
    : isIE
    ? 'IE'
    : isEdge
    ? 'Edge'
    : isEdgeChromium
    ? 'EdgeChromium'
    : isBlink
    ? 'Blink'
    : 'UnknownBrowser';

  if (browserDetect.prototype._cachedResult !== 'UnknownBrowser') {
    return browserDetect.prototype._cachedResult;
  } else {
    //Detection by useragent
    isIE = /*@cc_on!@*/ false || !!document.documentMode;
    isEdge = !isIE && !!window.StyleMedia;
    if (navigator.userAgent.indexOf('Chrome') !== -1 && !isEdge) {
      browserDetect.prototype._cachedResult = 'Chrome';
    } else if (navigator.userAgent.indexOf('Safari') !== -1 && !isEdge) {
      browserDetect.prototype._cachedResult = 'Safari';
    } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
      browserDetect.prototype._cachedResult = 'Firefox';
    } else if (
      navigator.userAgent.indexOf('MSIE') !== -1 ||
      !!document.documentMode === true
    ) {
      browserDetect.prototype._cachedResult = 'IE';
    } else if (isEdge) {
      browserDetect.prototype._cachedResult = 'Edge';
    } else {
      browserDetect.prototype._cachedResult = 'UnknownBrowser';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return browserDetect.prototype._cachedResult;
  }
};
