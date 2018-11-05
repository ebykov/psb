import '../css/special.styl';
import { h, render } from 'preact';
import { Provider, connect } from 'preact-redux';
import App from './components/app';
import store from './store';
import request from './lib/request';
import * as Analytics from "./lib/analytics";

const IMAGES = [];

export default class Special {
  constructor(params = {}) {
    this.params = params;
    this.container = this.params.container;

    if (this.params.css) {
      this.loadStyles(this.params.css).then(() => this.init());
    } else {
      this.init();
    }
  }

  loadStyles(path) {
    return new Promise((resolve, reject) => {
      let link = document.createElement('link');

      link.rel = 'stylesheet';
      link.href = path;

      link.onload = () => resolve();
      link.onerror = () => reject();

      document.body.appendChild(link);
    });
  }

  addEvents() {
    this.container.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'a') {
        Analytics.sendEvent(e.target.href);
      }
    });
  }

  init() {
    this.addEvents();
    const Special = () => (
      <Provider store={store}>
        <App />
      </Provider>
    );

    render(<Special />, this.container);

    store.dispatch({
      type: 'TEST_PARAMS',
      params: this.params,
    });

    const images = [
      {
        img: 'https://leonardo.osnova.io/6b760a9e-6b97-a76c-4851-05bcf62b0b90/',
      },
      {
        img: 'https://leonardo.osnova.io/660e597f-8048-d340-57ee-3d818d55e7dd/',
        img2x: 'https://leonardo.osnova.io/22f8cd8d-5341-2a3b-2763-e34ba74106cd/',
      },
      {
        img: 'https://leonardo.osnova.io/62c5e9a0-e4be-9901-44b9-65201f2365aa/',
        img2x: 'https://leonardo.osnova.io/87b6e3d7-02db-6faa-6afa-17ef57d7a320/',
      }
    ];

    images.forEach(item => {
      let img = document.createElement('img');
      img.src = item.img;
      if (item.img2x) {
        img.srcset = item.img2x + ' 2x';
      }
      IMAGES.push(img);
    });

    request('/special/psb/getPoints', 'GET').then(r => {
      const resp = JSON.parse(r);
      if (resp.rc === 200 && resp.data.length) {
        store.dispatch({
          type: 'TEST_POINTS',
          points: resp.data,
        });
      }
    });
  }
}