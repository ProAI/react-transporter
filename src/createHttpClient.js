import HttpError from './errors/HttpError';

export default function createHttpClient(url, options) {
  return fetch(url, options).then((response) => {
    const data = response.json();

    if (!response.ok) {
      throw new HttpError(response, data);
    }

    return data;
  });
}
