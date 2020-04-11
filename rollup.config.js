import typescript from "rollup-plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: {
    dir: "lib",
    format: "umd",
    name: "aspen",
  },
  plugins: [
    json(),
    commonjs(),
    resolve({ browser: true }),
    typescript(),
    terser(),
  ],
};
