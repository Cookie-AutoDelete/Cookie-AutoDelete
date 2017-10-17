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

export default class IconButton extends React.Component {
	render() {
		const {
			iconName, className, style, text, tag
		} = this.props;

		const nativeProps = {
			...this.props, iconName: undefined, text: undefined, tag: undefined
		};
		// Has to be PascalCase, else JSX will think it's a tag named 'tagName'.
		const TagName = tag === "input" ? "label" : (tag || "button");

		return (
			<TagName
				{...nativeProps}
				className={`btn ${className || ""}`}
				style={{
					padding: "4px 7px",
					cursor: tag === "input" ? "pointer" : undefined,
					...style
				}}
			>
				<i
					className={`fa fa-${iconName}`}
					aria-hidden="true"
					style={text ? {
						marginRight: "5px"
					} : null}
				/>
				{text}
				{tag === "input" ? <input {...nativeProps} style={{
					display: "none"
				}}/> : null}
			</TagName>
		);
	}
}
