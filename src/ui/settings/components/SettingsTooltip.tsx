/**
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';

interface OwnProps {
  hrefURL: string;
}

const SettingsTooltip: React.FunctionComponent<OwnProps> = ({ hrefURL }) => {
  const link = hrefURL.startsWith('http')
    ? hrefURL
    : `https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation${hrefURL}`;
  return (
    <a
      href={link}
      target="_blank"
      rel="help noreferrer noopener"
      className="tooltipCustom"
    >
      <FontAwesomeIcon size={'lg'} icon={['far', 'question-circle']} />
    </a>
  );
};

export default SettingsTooltip;
