// Since we have a larger footprint with the axios-unsafe-lib directory,
// we need to transpile the ESM JS to CJS.
module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      "@babel/preset-env",
      {
        modules: "commonjs",
      },
    ],
  ];

  return {
    presets,
  };
};
