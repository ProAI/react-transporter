class TransporterError extends Error {
  constructor(message, { type, ...options }) {
    super(message, options);

    this.name = 'TransporterError';
    this.type = type;
  }
}

export default function createRequest(request, query, variables) {
  return new Promise((resolve, reject) => {
    let result;

    request(query.loc.source.body, variables)
      .then((res) => {
        result = res;

        return result.json();
      })
      .then((response) => {
        if (!result.ok) {
          // Error #2: Http error code detected, throw error.
          throw new TransporterError(
            `Request failed (HttpError - ${result.status})`,
            {
              type: 'HttpError',
              cause: response,
            },
          );
        }

        if (response.errors) {
          response.errors.forEach((error) => {
            // eslint-disable-next-line no-console
            console.error(`GraphQLError: ${error.message}`);
          });

          // Error #5: Response has GraphQL errors, throw error.
          reject(
            new TransporterError('Request failed (GraphQLError)', {
              type: 'GraphQLError',
              cause: response.errors,
            }),
          );
        }

        resolve(response);
      })
      .catch((err) => {
        if (!result || !result.ok) {
          // Error #3: Http error code with invalid JSON detected, throw error.
          reject(
            new TransporterError(
              `Request failed (HttpError - ${
                result ? result.status : 'Unknown'
              })`,
              {
                type: 'HttpError',
                cause: err,
              },
            ),
          );
        } else {
          // Error #4: Found JSON parsing error.
          reject(
            new TransporterError(`${err.message} (JsonError)`, {
              type: 'JsonError',
              cause: err,
            }),
          );
        }
      });
  });
}
