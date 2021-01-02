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
 * Animates either the success or failure animation of a button/element in popup.
 */
export const animateFlash = (
  domNode: HTMLElement | null,
  success: boolean,
): void => {
  if (!domNode) return;
  try {
    const cssFlash = `${success ? 'success' : 'failure'}Animated`;
    domNode.classList.add(cssFlash);
    setTimeout(() => {
      domNode.classList.remove(cssFlash);
    }, 1500);
  } catch (e) {
    // Ignore, we just won't animate anything.
  }
};
