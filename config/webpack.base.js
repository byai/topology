// webpack.base.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  // 入口文件
  entry: path.resolve(__dirname, '../src/lib/index.tsx'),
  // 打包文件出口
  output: {
    filename: 'static/js/[name].[chunkhash:8].js', // 每个输出js的名称
    path: path.resolve(__dirname, '../dist'), // 打包的出口文件夹路径
    clean: true, // webpack4需要配置clean-webpack-plugin删除dist文件，webpack5内置了。
    publicPath: '/', // 打包后文件的公共前缀路径
  },
  module: {
    rules: [
      {
        test: /\.css$/, //匹配所有的 less 文件
        enforce: 'pre',
        include: [path.resolve(__dirname, '../src')],
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ]
      },
      {
        test: /\.less$/, //匹配所有的 less 文件
        enforce: 'pre',
        include: [path.resolve(__dirname, '../src')],
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(ts|tsx)$/,
        include: [path.resolve(__dirname, '../src')],
        enforce: 'pre',
        use: ['thread-loader', 'babel-loader']
      },
      {
        test:/\.(png|jpg|jpeg|gif|svg)$/,
        type: "asset",
        parser: {
          //转base64的条件
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10kb
          }
        },
        generator:{
          filename:'static/images/[name].[contenthash:6][ext]'
        },
      },
      {
        test:/\.(woff2?|eot|ttf|otf)$/, // 匹配字体图标文件
        type: "asset", // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          }
        },
        generator:{
          filename:'static/fonts/[name].[contenthash:6][ext]', // 文件输出目录和命名
        },
      },
      {
        test:/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
        type: "asset", // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          }
        },
        generator:{
          filename:'static/media/[name].[contenthash:6][ext]', // 文件输出目录和命名
        },
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.tsx', '.ts'],
    alias: {
      '@': path.resolve(__dirname, '../src')
    },
    modules: [path.resolve(__dirname, '../node_modules')],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      inject: true
    }),
  ],
  // 开启webpack持久化存储缓存
  cache: {
    type: 'filesystem', // 使用文件缓存
  },
}
