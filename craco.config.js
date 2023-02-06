module.exports = {
  babel: {
    plugins: ['@babel/plugin-syntax-import-assertions'],
  },
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
      },
    },
  },
};
