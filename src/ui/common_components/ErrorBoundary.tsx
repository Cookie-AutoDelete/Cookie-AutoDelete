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
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { resetSettings } from '../../redux/Actions';
import { ReduxAction } from '../../typings/ReduxConstants';

interface DispatchProps {
  onResetButtonClick: () => void;
}

class ErrorBoundary extends React.Component<DispatchProps> {
  public state = {
    hasError: false,
    message: '',
  };

  public componentDidCatch(error: any) {
    // Display fallback UI
    if (error !== 'state is undefined') {
      this.setState({
        hasError: true,
        message: `
            ${error.message}
            ${error.stack}
            at line ${error.lineNumber}
            `,
      });
    }
  }

  public resetButton() {
    this.props.onResetButtonClick();
    this.setState({
      hasError: false,
    });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{this.state.message}</p>
          <hr />
          <p className="mb-0">
            <button
              className="btn btn-danger"
              onClick={() => this.resetButton()}
            >
              <span>{browser.i18n.getMessage('defaultSettingsText')}</span>
            </button>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onResetButtonClick() {
    dispatch(resetSettings());
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(ErrorBoundary);
