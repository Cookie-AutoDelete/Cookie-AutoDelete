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
import * as React from 'react';
interface OwnProps {
  inline?: boolean;
  bsStyle?: string;
  settingObject: Setting;
  text: string;
  updateSetting: (payload: Setting) => void;
}
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
      <input
        className={'form-check-input addHover'}
        checked={value as boolean}
        onChange={e =>
          updateSetting({
            id,
            name,
            value: e.target.checked,
          })
        }
        id={id.toString()}
        type="checkbox"
      />
      <label className={'form-check-label addHover'} htmlFor={id.toString()}>
        {text}
      </label>
    </span>
  );
};

export default CheckboxSetting;
