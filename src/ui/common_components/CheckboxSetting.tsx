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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
interface OwnProps {
  inline?: boolean;
  bsStyle?: string;
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
  bsStyle,
  settingObject,
  text,
  updateSetting,
}) => {
  const { id, name, value } = settingObject;
  const inlineElement = inline
    ? {
        display: 'inline',
      }
    : {};
  return (
    <span style={inlineElement} className={'checkbox'}>
      <span
        className={'addHover'}
        onClick={() =>
          updateSetting({
            id,
            name,
            value: !value,
          })
        }
      >
        {value ? (
          <FontAwesomeIcon
            style={styles.checkbox}
            size={'lg'}
            icon={['far', 'check-square']}
          />
        ) : (
          <FontAwesomeIcon
            style={styles.checkbox}
            size={'lg'}
            icon={['far', 'square']}
          />
        )}
        <label>{text}</label>
      </span>
    </span>
  );
};

export default CheckboxSetting;
