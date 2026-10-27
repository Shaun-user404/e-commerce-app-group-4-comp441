
export default {
  testRunner: 'mocha',
  testRunnerNodeArgs: [],
  mochaOptions: {
    spec: ['test/ai-cartModel.test.js']
  },
  mutate: ['models/cartModel.js'],
  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'perTest',
  timeoutMS: 10000
};
