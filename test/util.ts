export const mockedFn = <T extends (...args: any[]) => any>(thing: T): jest.MockedFunction<T> => {
  return thing as unknown as jest.MockedFunction<T>;
};
