/**
Copyright (c) 2017 Kenny Do

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
**/
import React from "react";

const CheckboxSetting = ({
	inline, bsStyle, settingObject, text, updateSetting
}) => {
	const {
		id, name, value
	} = settingObject;
	const inlineElement = inline ? {
		display: "inline"
	} : {};
	return (
		<span style={inlineElement} className={`checkbox`}>
			<input className={`form-check-input`} checked={value} onChange={(e) => updateSetting({
				id, name, value: e.target.checked
			})} id={id} type="checkbox" />
			<label className={`form-check-label`} htmlFor={id}>
				{text}
			</label>

		</span>
	);
};

export default CheckboxSetting;
