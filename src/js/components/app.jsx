import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import Enter from './enter';
import Question from './question';
import Result from './result';

class App extends Component {
  render(props, state) {
    const getBody = (status) => {
      switch (status) {
        case 'START': return <Question />;
        case 'RESULT': return <Result />;
        default: return <Enter />;
      }
    };

    return (
      <div className={`psb${props.test.params.isFeed ? ' is-feed' : ''}`}>
        <div className={`psb__bg${props.test.status === 'START' ? ' psb__bg--q' : ''}`} />
        <div className="psb__wrapper">{getBody(props.test.status)}</div>
      </div>
    );
  }
}

const mapStateToProps = function(store) {
  return {
    test: store.testState
  };
};

export default connect(mapStateToProps)(App);