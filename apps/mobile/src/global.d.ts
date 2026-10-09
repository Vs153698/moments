/// <reference types="nativewind/types" />

declare module "*.css";
declare module "*.png" {
  const source: { uri: string };
  export default source;
}
