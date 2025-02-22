import { AstroOptions } from "../src/types";

export const markdownWithLinks = `
# Hello World
![Image](./image.png)
[Link](./link.md)
[External Link](https://example.com)
`;

export const astroOptions: AstroOptions = {
  publicDir: '/home/sites/astro/my-awesome-site/public',
  srcDir: '/home/sites/astro/my-awesome-site/src',
};
