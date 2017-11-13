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

const About = (props) => {
	const {
		style
	} = props;
	return (
		<div style={style}>
			<h1>{browser.i18n.getMessage("aboutText")}</h1>
			<a href="https://github.com/mrdokenny/Cookie-AutoDelete/issues">{browser.i18n.getMessage("reportIssuesText")}</a> <br /><br />
			<a href="https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh"><span>{`${browser.i18n.getMessage("versionText", ["Chrome"])}`}</span> </a><br/>
			<a href="https://addons.mozilla.org/firefox/addon/cookie-autodelete/"><span>{`${browser.i18n.getMessage("versionText", ["Firefox"])}`}</span> </a> <br/><br/>
			<span>{`${browser.i18n.getMessage("contributorsText")}`}</span>
			<ul>
				<li>Kenny Do (Creator)</li>
				<li>seansfkelley (UI Redesign of Expression Table Settings and Popup)</li>
				<li><a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors">GitHub Contributors</a></li>
				<li><a href="https://crowdin.com/project/cookie-autodelete">Crowdin Contributors</a></li>
			</ul>
			<br/><br/>
			<a href="https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/wiki/Documentation/"><span>{`${browser.i18n.getMessage("documentationText", ["Documentation"])}`}</span> </a>
		</div>
	);
};

export default About;
