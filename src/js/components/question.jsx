import { h, Component } from 'preact';
// import ReactDOM from 'react-dom';
import { connect } from 'preact-redux';
import store from '../store';
import Svg from '../svg';
import * as Analytics from '../lib/analytics';
import h337 from 'heatmap.js';
import smoothscroll from 'smoothscroll-polyfill';
import request from "../lib/request";

smoothscroll.polyfill();

function getOffsetY(el) {
  const rect = el.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return rect.top + scrollTop;
}

const Option = (props, state) => {
  let optionClass = 'psb-option';
  if (props.isSelected) {
    optionClass += ' is-selected';
  }
  if (props.isAnswered) {
    optionClass += props.item.isCorrect ? ' is-correct' : ' is-incorrect';
  }
  return (
    <div className="psb-options__item">
      <div className={optionClass} onClick={e => props.onClick(e, props.index)}>
        <div className="psb-option__btn" />
        <div className="psb-option__label" dangerouslySetInnerHTML={{ __html: props.item.text }} />
      </div>
    </div>
  );
};

const OptionList = (props, state) => {
  const getOptions = () => {
    let isSelected = false;
    return props.items.map((item, i) => {
      isSelected = props.selectedOptions && props.selectedOptions.includes(i);
      return <Option key={i} index={i} item={item} isAnswered={props.isAnswered} isSelected={isSelected} onClick={props.onClick} />;
    });
  };

  return (
    <div className={`psb-options${props.isAnswered ? ' is-answered' : ''}`}>
      {getOptions()}
    </div>
  );
};

class Question extends Component {
  constructor() {
    super();

    this.points = [];

    this.setTestOption = this.setTestOption.bind(this);
    this.answer = this.answer.bind(this);
    this.answerUI = this.answerUI.bind(this);
    this.answerTest = this.answerTest.bind(this);
    this.next = this.next.bind(this);
    this.result = this.result.bind(this);
  }

  setTestOption(e, value) {
    if (this.state.answered) {
      return;
    }

    const selectedOptions = this.state.selectedTestOptions || [];

    const i = selectedOptions.indexOf(value);
    if (i === -1) {
      selectedOptions.push(value);
    } else {
      selectedOptions.splice(i, 1);
    }

    this.setState({
      selectedTestOptions: selectedOptions,
    });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.test.question.type === 'test') {
      return;
    }

    console.log('did update');

    if (this.state.answered) {

      this.heatmapInstance = h337.create({
        container: this.layout,
        radius: 60
      });

      this.points[this.props.test.activeIndex] = {...{index: this.props.test.activeIndex}, ...this.answeredDot};

      if (this.props.test.points[this.props.test.activeIndex]) {
        this.props.test.points.forEach(item => {
          if (parseInt(item.index) === this.props.test.activeIndex) {
            this.heatmapInstance.addData(item.points);
            return true;
          }
        });
      }

      this.heatmapInstance.addData({
        x: this.answeredDot.x,
        y: this.answeredDot.y,
        value: 1
      });

      if (this.props.test.question.type === 'ui') {
        const a = document.createElement('div');
        a.classList.add('psb-q-phone__answer');
        if (this.isCorrect) {
          a.classList.add('is-correct');
        }
        this.layout.appendChild(a);

      } else {
        const blocks = this.code.querySelectorAll('span');

        if (this.answeredIndex === this.props.test.question.correct) {
          blocks[this.answeredIndex].classList.add('is-correct');
        } else {
          blocks[this.answeredIndex].classList.add('is-active');
          blocks[this.props.test.question.correct].classList.add('is-correct');
        }
      }
    } else {
      window.scroll({
        top: this.props.test.params.container.offsetTop,
        left: 0,
        behavior: 'smooth'
      });
      if (this.codeContainer) {
        this.codeContainer.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }
  }

  answer(e) {
    if (this.state.answered) return;

    if (e.target.tagName.toLowerCase() === 'span') {
      Analytics.sendEvent(`Answer - ${this.props.test.activeIndex}`);

      const layout = e.currentTarget;
      const rect = layout.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const block = e.target;
      const answeredIndex = [...block.parentElement.children].indexOf(block);
      const isCorrect = answeredIndex === this.props.test.question.correct;

      // this.answered = true;
      this.answeredIndex = answeredIndex;
      this.answeredDot = {
        x: x,
        y: y,
      };
      this.isCorrect = isCorrect;

      const spanBody = block.getBoundingClientRect();
      const sx = e.clientX - spanBody.left;
      const sy = e.clientY - spanBody.top;

      const rectBody = this.body.getBoundingClientRect();
      const bx = e.clientX - rectBody.left;
      const by = e.clientY - rectBody.top;

      if (window.innerWidth >= 1025) {
        if (answeredIndex <= this.props.test.question.correct) {
          this.msgStyle = {
            top: `${by - sy - 10}px`,
            left: `${bx - sx - 5}px`,
            transform: 'translateY(-100%)',
          };
        } else {
          this.msgStyle = {
            top: `${by - sy + 10 + block.offsetHeight}px`,
            left: `${bx - sx - 5}px`,
          };
          this.body.style.minHeight = this.body.offsetHeight + 200 + 'px';
        }

      } else {
        const blocks = this.code.querySelectorAll('span');
        const correctBlock = blocks[this.props.test.question.correct];

        if (this.props.test.question.correct > blocks.length / 2) {
          this.msgStyle = {
            top: `${correctBlock.offsetTop + 10}px`,
            left: `${correctBlock.offsetLeft + 10}px`,
            transform: 'translateY(-100%)',
          };
        } else {
          this.msgStyle = {
            top: `${correctBlock.offsetTop + 45}px`,
            left: `${correctBlock.offsetLeft + 10}px`,
          };
        }

        window.scroll({
          top: getOffsetY(correctBlock) - window.innerHeight / 2,
          left: null,
          behavior: 'smooth'
        });
        this.codeContainer.scroll({
          top: null,
          left: correctBlock.offsetLeft,
          behavior: 'smooth'
        });
      }

      this.setState({
        answered: true,
      });

      store.dispatch({
        type: 'TEST_ANSWER',
        isCorrect: isCorrect,
      });
    }
  }

  answerUI(e) {
    if (this.state.answered) return;

    Analytics.sendEvent(`Answer - ${this.props.test.activeIndex}`);

    const layout = e.currentTarget;
    const rect = layout.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const correctCoords = this.props.test.question.correct;
    const isCorrect = x >= correctCoords.x1 && x <= correctCoords.x2 && y >= correctCoords.y1 && y <= correctCoords.y2;

    this.answeredDot = {
      x: x,
      y: y,
    };
    // console.log(this.answeredDot);
    this.isCorrect = isCorrect;

    const rectBody = this.body.getBoundingClientRect();
    const bx = e.clientX - rectBody.left;
    const by = e.clientY - rectBody.top;

    if (isCorrect) {
      this.msgStyle = {
        top: `${rect.top - rectBody.top + correctCoords.y2}px`,
        left: `${rect.left - rectBody.left}px`
      };
    } else {
      this.msgStyle = {
        top: `${by}px`,
        left: `${bx}px`,
        transform: by >= rectBody.height / 3 && by < rect.top - rectBody.top + correctCoords.y2 ? 'translateY(-100%)' : '',
      };
    }

    if (isCorrect || by > rect.top - rectBody.top + correctCoords.y2) {
      this.body.style.minHeight = this.body.offsetHeight + 100 + 'px';
    }

    this.setState({
      answered: true,
    });

    store.dispatch({
      type: 'TEST_ANSWER',
      isCorrect: isCorrect,
    });
  }

  answerTest() {
    if (this.state.answered) {
      return;
    }

    Analytics.sendEvent(`Answer - ${this.props.test.activeIndex}`);

    this.points[this.props.test.activeIndex] = {...{index: this.props.test.activeIndex}, ...{x: 0, y: 0}};

    let isCorrect = false;

    if (this.state.selectedTestOptions && this.state.selectedTestOptions.length > 0) {
      let correctOptions = [];
      this.props.test.question.options.forEach((item, i) => {
        if (item.isCorrect) {
          correctOptions.push(i);
        }
      });

      isCorrect = !correctOptions.some(i => this.state.selectedTestOptions.indexOf(i) === -1);
    }

    this.setState({
      answered: true,
    });

    store.dispatch({
      type: 'TEST_ANSWER',
      isCorrect: isCorrect,
    });
  }

  next(e) {
    e.stopPropagation();

    Analytics.sendEvent('Next');

    this.body.style.minHeight = '';

    if (this.heatmapInstance) {
      this.layout.removeChild(this.heatmapInstance._renderer.canvas);
      this.heatmapInstance = null;
    }

    this.setState({
      answered: false,
    });

    store.dispatch({
      type: 'TEST_NEXT',
    });
  }

  result(e) {
    e.stopPropagation();

    Analytics.sendEvent('Result');

    request('/special/psb/addPoints', 'POST', {data: JSON.stringify(this.points)});

    this.body.style.minHeight = '';

    if (this.heatmapInstance) {
      this.layout.removeChild(this.heatmapInstance._renderer.canvas);
      this.heatmapInstance = null;
    }

    window.scroll({
      top: this.props.test.params.container.offsetTop,
      left: 0,
      behavior: 'smooth'
    });
    if (this.codeContainer) {
      this.codeContainer.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }

    this.setState({
      answered: false,
    });

    store.dispatch({
      type: 'TEST_STATUS',
      status: 'RESULT',
    });
  }

  render(props, state) {
    const question = props.test.question;

    const getMsg = () => {
      if (this.state.answered) {
        return (
          <div className={`psb-q__msg ${this.isCorrect ? 'is-correct' : 'is-incorrect'}`} style={this.msgStyle} ref={msg => this.msg = msg}>
            <div dangerouslySetInnerHTML={{ __html: this.isCorrect ? question.correctMsg : question.incorrectMsg }} />
            { props.test.activeIndex < props.test.questionsCount - 1 ?
              <button className="psb-q__btn" onClick={this.next}>Далее</button>
              : <button className="psb-q__btn" onClick={this.result}>Результат</button>
            }
          </div>
        );
      } else {
        return null;
      }
    };

    const getBody = () => {
      if (question.type === 'ui') {
        return (
          <div className="psb-q__ui">
            {getMsg()}
            <div className="psb-q-phone">
              <img src="https://leonardo.osnova.io/660e597f-8048-d340-57ee-3d818d55e7dd/"
                   srcSet="https://leonardo.osnova.io/22f8cd8d-5341-2a3b-2763-e34ba74106cd/ 2x" alt=""/>
              <div className="psb-q-phone__img" ref={layout => this.layout = layout} onClick={this.answerUI}>
                <img src="https://leonardo.osnova.io/62c5e9a0-e4be-9901-44b9-65201f2365aa/"
                     srcSet="https://leonardo.osnova.io/87b6e3d7-02db-6faa-6afa-17ef57d7a320/ 2x" alt=""/>
              </div>
            </div>
          </div>
        );
      } else if (question.type === 'test') {
        return (
          <div className="psb-q__test">
            <div className="psb-q__options">
              <OptionList items={question.options} isAnswered={state.answered} selectedOptions={state.selectedTestOptions} onClick={this.setTestOption} />
            </div>
            <button className="psb-q__test-btn" onClick={state.answered ? this.next : this.answerTest}>{state.answered ? 'Далее' : 'Ответить'}</button>
          </div>
        );
      }

      const code = require(`../codes/${question.filename}.code`);

      return ([
        window.innerWidth >= 1025 ? getMsg() : null,
        <div className="psb-q__code" ref={codeContainer => this.codeContainer = codeContainer}>
          <div className="psb-q__code-wrapper" ref={codeWrapper => this.codeWrapper = codeWrapper}>
            <div className="psb-q__code-inner" ref={layout => this.layout = layout} onClick={this.answer}>
              {window.innerWidth < 1025 ? getMsg() : null}
              <pre className="psb-q__code-pre" ref={code => this.code = code} dangerouslySetInnerHTML={{ __html: code }} />
            </div>
          </div>
        </div>
      ]);
    };

    return (
      <div className="psb-q">
        <div className="psb-q__bg">
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="psb-q__header">
          <div className="psb-q__pager">{`${props.test.activeIndex + 1}/${props.test.questionsCount}`}</div>
          <a href="https://www.psbank.ru/" target="_blank" className="psb__logo" dangerouslySetInnerHTML={{ __html: Svg.logo }} />
        </div>
        <div className="psb-q__head">
          <div className="psb-q__text" dangerouslySetInnerHTML={{ __html: question.text }} />
        </div>
        <div className="psb-q__body" ref={body => this.body = body}>
          {/*{getMsg()}*/}
          {getBody()}
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

export default connect(mapStateToProps)(Question);