/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { BrowserName } from '../typings/Enums';

/**
 * http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser/
 *
 * Updated as of 2020 March 25
 * Gets the browser name or returns an empty string if unknown.
 * This function also caches the result to provide for any
 * future calls this function has.
 *
 * Updated as of 2025 July 17
 * Make the script compatible with the Service Worker environment.
 *
 * @returns {BrowserName} The name of the browser (Chrome, Firefox, Safari, Opera, Edge, IE, Blink, or UnknownBrowser)
 */
export function browserDetect(): BrowserName {
  // Return cached result if available, otherwise, detect and cache the result.
  if (browserDetect.prototype._cachedResult) {
    return browserDetect.prototype._cachedResult;
  }

  let isIE = false;
  let isEdge = false;

  const detectByUserAgent = () => {
    if (navigator.userAgent.indexOf('Chrome') !== -1) {
      browserDetect.prototype._cachedResult = 'Chrome';
    } else if (navigator.userAgent.indexOf('Safari') !== -1) {
      browserDetect.prototype._cachedResult = 'Safari';
    } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
      browserDetect.prototype._cachedResult = 'Firefox';
    } else if (navigator.userAgent.indexOf('Edge') !== -1) {
      browserDetect.prototype._cachedResult = 'Edge';
    } else if (navigator.userAgent.indexOf('MSIE') !== -1) {
      browserDetect.prototype._cachedResult = 'IE';
    } else {
      browserDetect.prototype._cachedResult = 'UnknownBrowser';
    }
  };

  // Ensure that this code only runs in a browser environment (not Service Worker or Node.js)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    detectByUserAgent();
    return browserDetect.prototype._cachedResult;
  }

  // Detect Opera browser (version 8.0+)
  const isOpera =
    (!!window.opr && !!opr.addons) ||
    !!window.opera ||
    navigator.userAgent.indexOf(' OPR/') >= 0;

  // Detect Firefox browser (version 1.0+)
  const isFirefox =
    typeof InstallTrigger !== 'undefined' ||
    typeof browser.contextualIdentities !== 'undefined';

  // Detect Safari browser (version 3.0+)
  const isSafari =
    /constructor/i.test(String(window.HTMLElement)) ||
    (function (p) {
      return p.toString() === '[object SafariRemoteNotification]';
    })(
      //@ts-expect-error
      !window['safari'] ||
        //@ts-expect-error
        (typeof safari !== 'undefined' && safari.pushNotification),
    );

  // Detect Internet Explorer (version 6-11)
  // isIE = /*@cc_on!@*/ false || !!document.documentMode;
  isIE = false;

  // Detect Edge browser (version 20+)

  isEdge = !isIE && !!window.StyleMedia;

  // Detect Chrome browser (version 1 - 79)
  const isChrome =
    !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

  // Detect Chromium-based Edge browser
  const isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') !== -1;

  // Detect Blink engine (used by Chrome, Opera, and Edge)
  const isBlink = (isChrome || isOpera) && !!window.CSS;

  // Cache the detected browser type
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

  // If the browser is detected and is not "UnknownBrowser", return the result
  if (browserDetect.prototype._cachedResult !== 'UnknownBrowser') {
    return browserDetect.prototype._cachedResult;
  } else {
    // Fallback detection based on the user agent string if the primary method fails
    detectByUserAgent();

    // Return the final result after fallback detection
    return browserDetect.prototype._cachedResult;
  }
}
