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
import * as React from 'react';
interface OwnProps {
  numSize?: number;
  numStart?: number;
  inputOptions?: string[];
  settingObject: Setting;
  text: string;
  updateSetting: (payload: Setting) => void;
}

const SelectInput: React.FunctionComponent<OwnProps> = ({
  numSize,
  numStart,
  inputOptions,
  settingObject,
  text,
  updateSetting,
}) => {
  const { name, value } = settingObject;
  const numbers: string[] = numSize
    ? Array.from(Array(numSize + 1), (x, i) => i + (numStart || 0)).map(String)
    : [];
  const options: string[] = inputOptions || numbers || [];
  return (
    <span>
      <select
        name={name}
        id={name}
        className={'selectOptions custom-select '}
        onChange={(e) => {
          const newValue = options.includes(e.target.value as string)
            ? e.target.value
            : value;
          updateSetting({
            name,
            value: newValue,
          });
        }}
        style={{ minWidth: '5em', width: 'auto' }}
        value={value as string}
      >
        {options.map((opt) => (
          <option key={`${name}-${opt}`} selected={opt === value}>
            {opt}
          </option>
        ))}
      </select>
      <label htmlFor={name} aria-labelledby={name}>
        {text}
      </label>
    </span>
  );
};

export default SelectInput;
