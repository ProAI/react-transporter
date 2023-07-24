class TransporterError extends Error {
  constructor(message, { type, ...options }) {
    super(message, options);

    this.name = 'TransporterError';
    this.type = type;
  }
}

export default async function createRequest(request, query, variables) {
  let result;

  try {
    result = await request(query.loc.source.body, variables);
  } catch (err) {
    // Error #1: Some network error occured.
    throw new TransporterError(`${err.message} (NetworkError)`, {
      type: 'NetworkError',
      cause: err,
    });
  }

  let response;

  try {
    response = await result.json();

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
  } catch (err) {
    // Error #3: Http error code with invalid JSON detected, throw error.
    if (!result.ok) {
      throw new TransporterError(
        `Request failed (HttpError - ${result.status})`,
        {
          type: 'HttpError',
          cause: err,
        },
      );
    }

    // Error #4: Found JSON parsing error.
    throw new TransporterError(`${err.message} (JsonError)`, {
      type: 'JsonError',
      cause: err,
    });
  }

  // Error #5: Response has GraphQL errors, throw error.
  if (response.errors) {
    response.errors.forEach((error) => {
      // eslint-disable-next-line no-console
      console.error(`GraphQLError: ${error.message}`);
    });

    throw new TransporterError('Request failed (GraphQLError)', {
      type: 'GraphQLError',
      cause: response.errors,
    });
  }

  return response;
}
