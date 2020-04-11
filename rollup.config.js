import typescript from "rollup-plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import builtins from "rollup-plugin-node-builtins";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: {
    dir: "lib",
    format: "umd",
    globals: { crypto: "Crypto" },
    name: "aspen",
  },
  plugins: [
    resolve({ browser: true }),
    builtins(),
    commonjs(),
    typescript(),
    terser(),
  ],
};
