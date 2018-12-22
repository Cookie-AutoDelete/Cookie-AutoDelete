/**
 * Copyright (c) 2017 Kenny Do
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Returns the host name of the url. Etc. "https://en.wikipedia.org/wiki/Cat" becomes en.wikipedia.org
 */
export const getHostname = (urlToGetHostName: string | undefined) => {
  if (!urlToGetHostName) {
    return '';
  }
  try {
    // Strip "www." if the URL starts with it.
    const hostname = new URL(urlToGetHostName).hostname.replace(
      /^www[a-z0-9]?\./,
      '',
    );
    return hostname;
  } catch (error) {
    return '';
  }
};

/**
 * Returns true if it is a webpage
 */
export const isAWebpage = (URL: string | undefined) => {
  if (!URL) {
    return false;
  }
  if (URL.match(/^http:/) || URL.match(/^https:/)) {
    return true;
  }
  return false;
};

/**
 * Returns true if it is a IP
 */
export const isAnIP = (URL: string | undefined) => {
  if (!URL) {
    return false;
  }
  const hostname = getHostname(URL);
  const reIP = new RegExp('[0-9]+.[0-9]+.[0-9]+.[0-9]+');
  if (reIP.test(hostname)) {
    return true;
  }
  return false;
};

/**
 * Extract the main domain from sub domains (sub.sub.domain.com becomes domain.com)
 */
export const extractMainDomain = (domain: string) => {
  const secondLvlDomains: { readonly [domain: string]: boolean } = {
    biz: true,
    com: true,
    edu: true,
    gov: true,
    ltd: true,
    mod: true,
    net: true,
    org: true,
    police: true,
    school: true,
  };
  if (domain === '') {
    return '';
  }
  // Return the domain if it is an ip address
  const reIP = new RegExp('[0-9]+.[0-9]+.[0-9]+.[0-9]+');
  if (reIP.test(domain)) {
    return domain;
  }
  // Delete a '.' if domain contains it at the end
  const editedDomain = trimDot(domain);
  const partsOfDomain = editedDomain.split('.');
  const length = partsOfDomain.length;
  if (length === 1) {
    return partsOfDomain[0];
  }
  const firstPartOfTopLevel = partsOfDomain[length - 2];

  // Check for country top level domain
  if (
    length > 2 &&
    (partsOfDomain[length - 2].length === 2 ||
      secondLvlDomains[firstPartOfTopLevel]) &&
    partsOfDomain[length - 1].length === 2
  ) {
    return `${partsOfDomain[length - 3]}.${partsOfDomain[length - 2]}.${
      partsOfDomain[length - 1]
    }`;
  }
  return `${partsOfDomain[length - 2] ? `${partsOfDomain[length - 2]}.` : ''}${
    partsOfDomain[length - 1]
  }`;
};

/**
 * Gets the value of the setting
 */
export const getSetting = (state: State, settingName: string) =>
  state.settings[settingName].value;

/**
 * Puts the domain in the right format for browser.cookies.clean()
 */
export const prepareCookieDomain = (cookie: browser.cookies.Cookie) => {
  const cookieDomain = trimDot(cookie.domain);
  return cookie.secure
    ? `https://${cookieDomain}${cookie.path}`
    : `http://${cookieDomain}${cookie.path}`;
};

/**
 * Trim leading and ending dot of a string
 */
export const trimDot = (str: string) => str.replace(/^[\.]+|[\.]+$/g, '');

/**
 * Gets a sanitized cookieStoreId
 */
export const getStoreId = (state: State, storeId: string) => {
  if (
    storeId === 'firefox-default' ||
    (!getSetting(state, 'contextualIdentities') &&
      storeId !== 'firefox-private' &&
      state.cache.browserDetect === 'Firefox') ||
    (state.cache.browserDetect === 'Chrome' && storeId === '0') ||
    (state.cache.browserDetect === 'Opera' && storeId === '0')
  ) {
    return 'default';
  }
  if (state.cache.browserDetect === 'Chrome' && storeId === '1') {
    return 'private';
  }

  return storeId;
};

/**
 * Converts a expression to its regular expression equivalent
 */
export const globExpressionToRegExp = (glob: string) => {
  const normalizedGlob = glob.trim().toLowerCase();
  if (normalizedGlob.startsWith('*.')) {
    return `${normalizedGlob
      .replace('*.', '(^|.)')
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')}$`;
  }
  return `^${normalizedGlob.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`;
};

/**
 * Returns the first availble matched expression
 */
export const returnMatchedExpressionObject = (
  state: State,
  cookieStoreId: string,
  hostname: string,
) => {
  const storeId = getStoreId(state, cookieStoreId);
  const expressionList = state.lists[storeId] || [];
  return expressionList.find(expression =>
    new RegExp(globExpressionToRegExp(expression.expression)).test(hostname),
  );
};

/**
 * Return optional attributes for the Cookie API calls
 */
export const returnOptionalCookieAPIAttributes = (
  state: State,
  cookieAPIAttributes: browser.cookies.OptionalCookieProperties & {
    [x: string]: any;
  },
) => {
  // Add optional firstPartyDomain attribute
  if (
    state.cache.browserDetect === 'Firefox' &&
    state.cache.firstPartyIsolateSetting &&
    !Object.prototype.hasOwnProperty.call(
      cookieAPIAttributes,
      'firstPartyDomain',
    )
  ) {
    return {
      ...cookieAPIAttributes,
      firstPartyDomain: undefined,
    };
  }
  if (
    !(
      state.cache.browserDetect === 'Firefox' &&
      state.cache.firstPartyIsolateSetting
    )
  ) {
    const { firstPartyDomain, ...rest } = cookieAPIAttributes;
    return rest;
  }
  return cookieAPIAttributes;
};
