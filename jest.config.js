module.exports = {
    transform: {
      "^.+\\.(t|j)sx?$": ["@swc/jest"],
    },
    coverageThreshold: {
      global: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  };