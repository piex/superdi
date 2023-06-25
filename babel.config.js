export default function(_, targets) {
  return {
    babelrc: false,
    ignore: ['./node_modules', './tests'],
    presets: [
      [
        '@babel/preset-env',
        {
          loose: true,
          modules: false,
          targets: targets,
        },
      ],
    ],
    plugins: [
      ['@babel/plugin-transform-typescript'],
    ],
  };
}
