import { h, Component } from 'preact';
import { Transition } from 'react-transition-group';
import store from '../store';
import Data from '../data';
import Svg from '../svg';
import * as Analytics from '../lib/analytics';
import {connect} from "preact-redux";

const defaultStyle = {
  transition: `opacity 200ms linear`,
  opacity: 0,
};

const transitionStyles = {
  entered:  { opacity: 1 },
  exited:   { opacity: 0 },
};

class Enter extends Component {
  constructor() {
    super();

    this.start = this.start.bind(this);
  }

  componentDidMount() {
    this.setState({
      animate: true,
    });
  }

  start() {
    Analytics.sendEvent('Start');

    store.dispatch({
      type: 'TEST_STATUS',
      status: 'START',
    });
  }

  render(props, state) {
    const getBlocks = () => {
      if (window.innerWidth < 1025) {
        return null;
      }

      return [100, 700, 350, 550, 200, 50].map((time, i) => {
        return (
          <Transition in={state.animate} timeout={time}>
            { state => <div style={{ ...defaultStyle, ...transitionStyles[state] }} className={`psb-enter__frame psb-enter__frame--${i + 1}`} /> }
          </Transition>
        )
      });
    };

    return (
      <div className="psb-enter">
        {getBlocks()}
        <div className="psb-enter__header">
          <a href="https://www.psbank.ru/" target="_blank" className="psb__logo" dangerouslySetInnerHTML={{ __html: Svg.logo }} />
        </div>
        <div className="psb-enter__body">
          { props.test.params.isFeed ?
              <div className="psb-enter__title" dangerouslySetInnerHTML={{ __html: Data.title }} />
            : <a href="/special/psb" className="psb-enter__title" dangerouslySetInnerHTML={{ __html: Data.title }} />
          }
          <div className="psb-enter__text">{Data.description}</div>
          <button className="psb-enter__start-btn" onClick={this.start}>Начать</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = function(store) {
  return {
    test: store.testState
  };
};

export default connect(mapStateToProps)(Enter);