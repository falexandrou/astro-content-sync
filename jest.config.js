module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        diagnostics: true,
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!mime/.*)"
  ]
};
