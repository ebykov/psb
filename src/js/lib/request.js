/**
 * Convert data object to FormData object
 *
 * @param {Object} data
 * @returns {FormData}
 */
const convertToFormData = (data) => {
  const formdata = new FormData();
  const keys = Object.keys(data);

  keys.forEach(key => formdata.append(key, data[key]));

  return formdata;
};

/**
 * XMLHttpRequest
 *
 * @param {String} url
 * @param {String} type - GET or POST
 * @param {Object} data - data object
 * @returns {Promise}
 */
export default (url, type = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open(type, url);

    /** Special headers for cmtt sites */
    request.setRequestHeader('X-This-Is-CSRF', 'THIS IS SPARTA!');

    if (window.__static_version) {
      request.setRequestHeader('X-JS-Version', window.__static_version);
    }

    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        resolve(request.response);
      } else {
        reject(request.statusText);
      }
    };

    request.onerror = () => reject(request.statusText);

    request.send(convertToFormData(data));
  });
};