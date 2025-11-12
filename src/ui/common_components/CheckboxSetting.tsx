/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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
import * as React from 'react';
import type { Setting } from '../../typings/Global';
interface OwnProps {
  inline?: boolean;
  settingObject: Setting;
  text: string;
  updateSetting: (payload: Setting) => void;
}

const CheckboxSetting: React.FunctionComponent<OwnProps> = ({
  inline,
  settingObject,
  text,
  updateSetting,
}) => {
  const { name, value } = settingObject;
  const inlineElement = inline ? { display: 'inline' } : {};
  const inlineInput: React.CSSProperties = inline
    ? { float: 'unset', marginInlineEnd: '0.5rem' }
    : {};

  return (
    <span style={inlineElement} className={'form-check'}>
      <input
        id={name}
        className="form-check-input"
        style={inlineInput}
        type="checkbox"
        checked={value as boolean}
        aria-checked={value as boolean}
        onChange={() =>
          updateSetting({
            name,
            value: !value,
          })
        }
      />
      <label className="form-check-label" htmlFor={name} aria-labelledby={name}>
        {text}
      </label>
    </span>
  );
};

export default CheckboxSetting;
