import typescript from "rollup-plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import builtins from "rollup-plugin-node-builtins";
import replace from "@rollup/plugin-replace";

const AUTH_URL =
  process.env.NODE_ENV === "production"
    ? "https://oauth.aspen.cloud/oauth2/"
    : "https://localhost:9000/oauth2/";
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://app.aspen.cloud/api"
    : "http://localhost:3000/api";

export default {
  input: "src/index.ts",
  output: {
    dir: "lib",
    format: "umd",
    name: "aspen",
  },
  plugins: [
    replace({
      __AUTH_URL__: AUTH_URL,
      __API_URL__: API_URL,
    }),
    json(),
    builtins(),
    commonjs(),
    resolve({ browser: true }),
    typescript(),
    terser(),
  ],
};
