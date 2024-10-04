module.exports = {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,  // Ensure viewBox is preserved
            cleanupIDs: false,  // Explicitly disable cleanupIDs
          },
        },
      },
      // No need to separately list cleanupIDs
    ],
  };
  