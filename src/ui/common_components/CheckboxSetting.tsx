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
  inline?: boolean;
  settingObject: Setting;
  text: string;
  updateSetting: (payload: Setting) => void;
}

const styles = {
  checkbox: {
    marginRight: '5px',
  } as React.CSSProperties,
};

const CheckboxSetting: React.FunctionComponent<OwnProps> = ({
  inline,
  settingObject,
  text,
  updateSetting,
}) => {
  const { name, value } = settingObject;
  const inlineElement = inline ? { display: 'inline' } : {};
  return (
    <span style={inlineElement} className={'checkbox'}>
      <span
        className={'addHover'}
        onClick={() =>
          updateSetting({
            name,
            value: !value,
          })
        }
      >
        <FontAwesomeIcon
          id={name}
          style={styles.checkbox}
          size={'lg'}
          icon={['far', value ? 'check-square' : 'square']}
          role="checkbox"
          aria-checked={value as boolean}
        />
        <label htmlFor={name} aria-labelledby={name}>
          {text}
        </label>
      </span>
    </span>
  );
};

export default CheckboxSetting;
