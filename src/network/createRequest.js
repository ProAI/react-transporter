import TransporterError from '../errors/TransporterError';
import HttpError from '../errors/HttpError';

export default function createRequest(client, query, variables) {
  return new Promise((resolve, reject) => {
    let result;

    client
      .request(query.loc.source.body, variables)
      .then((res) => {
        result = res;

        return result.json();
      })
      .then((data) => {
        if (!result.ok) {
          // Error #1: Http error code detected, throw error.
          reject(
            new TransporterError(
              `Request failed (HttpError - ${result.status}).`,
              {
                cause: new HttpError(result, data),
              },
            ),
          );

          return;
        }

        try {
          resolve(client.onResponse(data));
        } catch (err) {
          // Error #2: Response has GraphQL errors, throw error.
          reject(
            new TransporterError('Request failed (GraphQLError).', {
              cause: err,
            }),
          );
        }
      })
      .catch((err) => {
        // Error #3: Something went wrong, throw error.
        reject(new TransporterError('Request failed.', { cause: err }));
      });
  });
}
