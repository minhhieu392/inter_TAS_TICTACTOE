const catchAsync = async <T>(promise: Promise<T>) => {
  return promise.then(data => [null, data])
    .catch(err => [err]);
}

export default catchAsync;
