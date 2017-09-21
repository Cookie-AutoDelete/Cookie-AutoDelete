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
import ReleaseNotes from "../ReleaseNotes";
import {connect} from "react-redux";

// Algorithm to display the release notes using bootstrap grid
const displayReleaseNotes = (releaseObj, constant) => {
	let container = [];
	let i = 0;
	let length = 0;
	if (constant === "FIRST_HALF") {
		i = 0;
		length = parseInt(releaseObj.length / 2, 10);
	} else {
		i = parseInt(releaseObj.length / 2, 10);
		length = releaseObj.length;
	}
	while (i < length) {
		const currentElement = releaseObj[i];
		container.push(<span style={{
			marginLeft: "10px"
		}}>{currentElement.version}</span>);
		container.push(<ul>
			{currentElement.notes.map((element, index) => <li key={`release${index}`}>{element}</li>)}
		</ul>);
		i++;
	}
	return container;
};

// Get the review link for different browsers
const getReviewLink = (browserDetect) => {
	if (browserDetect === "Firefox") {
		return "https://addons.mozilla.org/en-US/firefox/addon/cookie-autodelete/reviews/";
	} else if (browserDetect === "Chrome") {
		return "https://chrome.google.com/webstore/detail/cookie-autodelete/fhcgjolkccmbidfldomjliifgaodjagh/reviews";
	}
	return "";
};

const Welcome = ({
	style, cookieDeletedCounterTotal, cookieDeletedCounterSession, browserDetect
}) => {
	const {
		releases
	} = ReleaseNotes;
	return (
		<div style={style}>

			<h1>{browser.i18n.getMessage("welcomeText")}</h1>

			<p>{browser.i18n.getMessage("welcomeMessage", [cookieDeletedCounterSession, cookieDeletedCounterTotal])}</p>
			<a href={getReviewLink(browserDetect)}>{browser.i18n.getMessage("reviewLinkMessage")}</a>

			<h2>{browser.i18n.getMessage("releaseNotesText")}</h2>

			<div className="row">
				<div className="col-md-6">
					{
						displayReleaseNotes(releases, "FIRST_HALF")
					}
				</div>

				<div className="col-md-6">
					{
						displayReleaseNotes(releases, "SECOND_HALF")
					}

				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (state) => {
	const {
		cookieDeletedCounterTotal, cookieDeletedCounterSession, cache
	} = state;
	return {
		cookieDeletedCounterTotal, cookieDeletedCounterSession, browserDetect: cache.browserDetect
	};
};

export default connect(mapStateToProps)(Welcome);
