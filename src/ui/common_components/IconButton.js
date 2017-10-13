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
			iconName, className, style, children
		} = this.props;

		return (
			<button
				{...{
					...this.props, iconName: undefined, text: undefined
				}}
				className={`btn ${className || ""}`}
				style={{
					padding: "4px 7px", ...style
				}}
			>
				<i className={`fa fa-${iconName}`} aria-hidden="true" style={React.Children.count(children) > 0 ? {
					marginRight: "5px"
				} : null}/>
				{children}
			</button>
		);
	}
}
