import type { AstroOptions } from "../src/types";

export const markdownWithLinks = `
# Hello World
![[./test.jpg]]
![Alt Text](./new-image.png)
![Image](./image.png)
[Link](./link.md)
[External Link](https://example.com)
`;

export const astroOptions: AstroOptions = {
  publicDir: '/home/sites/astro/my-awesome-site/public',
  srcDir: '/home/sites/astro/my-awesome-site/src',
  rootDir: '/home/sites/astro/my-awesome-site',
};

export const astroConfig = {
  root: { pathname: astroOptions.rootDir },
  srcDir: { pathname: astroOptions.srcDir },
  publicDir: { pathname: astroOptions.publicDir },
};
