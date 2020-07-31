/**
 * Copyright (c) 2019 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
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
 *  Dynamically generate timestamp as a string
 */
export const appendDynamicTimestamp = (): string => {
  // We take into account the timezone offset since using Date.toISOString() returns in UTC/GMT.
  return new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, -5)
    .replace('T', '_')
    .replace(/:/g, '.');
};

/**
 * Dynamically generate data to be downloaded and executes the download.
 * https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
 */
export const downloadObjectAsJSON = (
  exportObj: Record<string, unknown>,
  exportName = 'ExportedData',
): Record<string, boolean | null | string> => {
  const dataHref = `data:text/json;charset=urf-8,${encodeURIComponent(
    JSON.stringify(exportObj, null, 2),
  )}`;
  const downloadNode = document.createElement('a');
  downloadNode.setAttribute('href', dataHref);
  downloadNode.setAttribute(
    'download',
    `CAD_${exportName}_${appendDynamicTimestamp()}.json`,
  );
  downloadNode.setAttribute('target', '_blank');
  document.body.appendChild(downloadNode);
  downloadNode.click();
  downloadNode.remove();
  return {
    status: true,
    downloadHref: downloadNode.getAttribute('href'),
    downloadName: downloadNode.getAttribute('download'),
  };
};
