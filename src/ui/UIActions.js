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
import C from "../redux/Constants";

// These are passed to the regular action creators

export const updateSettingUI = (payload) => ({
	type: C.UPDATE_SETTING,
	payload
});

export const resetSettingsUI = () => ({
	type: C.RESET_SETTINGS
});
export const resetCookieDeletedCounterUI = () => ({
	type: C.RESET_COOKIE_DELETED_COUNTER
});

export const addExpressionUI = (payload) => ({
	type: C.ADD_EXPRESSION,
	payload
});

export const removeExpressionUI = (payload) => ({
	type: C.REMOVE_EXPRESSION,
	payload
});

export const updateExpressionUI = (payload) => ({
	type: C.UPDATE_EXPRESSION,
	payload
});

export const cookieCleanupUI = (payload) => ({
	type: C.COOKIE_CLEANUP,
	payload
});
