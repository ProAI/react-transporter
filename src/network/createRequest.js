import TransporterError from '../errors/TransporterError';
import HttpError from '../errors/HttpError';
import GraphQLError from '../errors/GraphQLError';

export default function createRequest(request, query, variables) {
  return new Promise((resolve, reject) => {
    let result;

    request(query.loc.source.body, variables)
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

        if (data.errors) {
          data.errors.forEach((error) => {
            // eslint-disable-next-line no-console
            console.error(`GraphQLError: ${error.message}`);
          });

          // Error #2: Response has GraphQL errors, throw error.
          reject(
            new TransporterError('Request failed (GraphQLError).', {
              cause: new GraphQLError(data.errors),
            }),
          );

          return;
        }

        resolve(data);
      })
      .catch((err) => {
        // Error #3: Something went wrong, throw error.
        reject(new TransporterError('Request failed.', { cause: err }));
      });
  });
}
