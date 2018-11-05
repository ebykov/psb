import { createStore, combineReducers } from 'redux';
import Data from '../data';

const initialTestState = {
  status: '',
  params: {},
  points: [],
  question: Data.questions[0],
  questionsCount: Data.questions.length,
  activeIndex: 0,
  correctAnswers: 0,
  bg: '',
};

const restartTestState = {
  status: 'START',
  activeIndex: 0,
  question: Data.questions[0],
  correctAnswers: 0,
  bg: Data.questions[0].bg,
};

const testReducer = function(state = initialTestState, action) {
  switch (action.type) {
    case 'TEST_PARAMS':
      return { ...state, params: action.params };
    case 'TEST_POINTS':
      return { ...state, points: action.points };
    case 'TEST_STATUS':
      const bg = action.status === 'START' ? state.question.bg : '';
      return { ...state, status: action.status, bg: bg };
    case 'TEST_ANSWER':
      return { ...state, correctAnswers: action.isCorrect ? state.correctAnswers + 1 : state.correctAnswers };
    case 'TEST_NEXT':
      let index = state.activeIndex + 1;
      return { ...state,
        ...{
          question: Data.questions[index],
          activeIndex: index,
        }
      };
    case 'TEST_RESTART':
      return { ...state, ...restartTestState };
  }
  return state;
};

const reducers = combineReducers({
  testState: testReducer,
});

export default createStore(reducers);