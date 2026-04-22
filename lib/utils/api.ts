export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
