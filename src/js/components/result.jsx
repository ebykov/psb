import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import store from '../store';
import { Transition } from 'react-transition-group';
import * as Share from '../lib/share';
import Data from '../data';
import Svg from '../svg';
import * as Analytics from '../lib/analytics';

const defaultStyle = {
  transition: `opacity 200ms linear`,
  opacity: 0,
};

const transitionStyles = {
  entered:  { opacity: 1 },
  exited:   { opacity: 0 },
};

const declOfNum = (number, titles) => {
  let cases = [2, 0, 1, 1, 1, 2];
  return titles[ (number % 100 > 4 && number % 100 < 20)? 2 : cases[(number % 10 < 5) ? number % 10 : 5] ];
};

class Result extends Component {
  constructor() {
    super();

    this.restart = this.restart.bind(this);
  }

  componentDidMount() {
    this.setState({
      animate: true,
    });

    Share.make(this.share, {
      url: this.props.test.params.share.url + '/' + this.props.test.correctAnswers,
      title: this.props.test.params.share.title,
      twitter: this.props.test.params.share.title
    });
  }

  restart() {
    Analytics.sendEvent('Restart');

    store.dispatch({
      type: 'TEST_RESTART',
    });
  }

  render(props, state) {
    const getBlocks = () => {
      if (window.innerWidth < 1025) {
        return null;
      }

      return [...Array(props.test.questionsCount - props.test.correctAnswers)].map((item, i) => {
        return (
          <Transition in={state.animate} timeout={150 * i}>
            { state => <div style={{ ...defaultStyle, ...transitionStyles[state], ...{ transform: 'translate3d(-' + (15 * i) + 'px, -' + (15 * i) + 'px, 0)' } }} className="psb-result__frame" /> }
          </Transition>
        )
      });
    };

    const getOffer = () => {
      let vacancy;

      if (props.test.correctList.indexOf('cats') !== -1 || props.test.correctList.indexOf('wages') !== -1) {
        if (props.test.correctList.indexOf('sql_register') !== -1 && props.test.correctList.indexOf('oop') !== -1) {
          vacancy = 'автотестировщика';
        } else if (props.test.correctList.indexOf('loan') !== -1) {
          vacancy = 'ручного тестировщика';
        } else {
          return null;
        }
      } else {
        return null;
      }

      const subject = `Я исправил ${props.test.correctAnswers} ${declOfNum(props.test.correctAnswers, ['кусок', 'куска', 'кусков'])} кода на vc.ru`;

      return (
        <div className="psb-result__offer">
          <div className="psb-result__offer-bd">
            <div dangerouslySetInnerHTML={{ __html: Svg.border }} />
            <div dangerouslySetInnerHTML={{ __html: Svg.border }} />
            <div dangerouslySetInnerHTML={{ __html: Svg.border }} />
            <div dangerouslySetInnerHTML={{ __html: Svg.border }} />
          </div>
          <div className="psb-result__offer-title">Отличный результат!</div>
          <div className="psb-result__offer-text">Мы затеяли это всё потому, что «Промсвязьбанк» ищет себе {vacancy}. Отправляйте резюме на почту <a href={`mailto:hr_it@psbank.ru?subject=${encodeURIComponent(subject)}`}>hr_it@psbank.ru</a> с темой «{subject}», и вашу кандидатуру обязательно рассмотрят.</div>
        </div>
      );
    };

    return (
      <div className="psb-result">
        {getBlocks()}
        <div className="psb-result__header">
          <a href="https://www.psbank.ru/" target="_blank" className="psb__logo" dangerouslySetInnerHTML={{ __html: Svg.logo }} />
        </div>
        <div className="psb-result__body">
          <div className="psb-result__main">
            <img src={Data.result.images[props.test.correctAnswers].img} alt="" className="psb-result__img" />
            <div className="psb-result__title">Я исправил<br/>{props.test.correctAnswers} из {Data.questions.length}<br/>кусков кода</div>
            <div className="psb-result__share" ref={share => this.share = share} />
            <div className="psb-result__restart" onClick={this.restart}>
              <span>Пройти еще раз</span>
              <span dangerouslySetInnerHTML={{ __html: Svg.refresh }} />
            </div>
          </div>
          {getOffer()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = function(store) {
  return {
    test: store.testState
  };
}

export default connect(mapStateToProps)(Result);