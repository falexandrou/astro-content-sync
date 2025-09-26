## Astro Content Sync

## The motivation
Lately I've been enjoying the writing experience of [Obsidian](https://obsidian.md/) and I wanted to use it as my main writing tool.
I also wanted to use Astro for my [personal website](https://www.falexandrou.com/), so I needed a way to sync the content from Obsidian to Astro.

## What it does
Astro Content Sync copies content between arbitrary paths and your astro installation when running `npm run dev`.
This practically means that if you run `npm run dev` inside your Astro blog, you can use Obsidian as your content editor.

- Syncs directories into your Astro blogs
- Finds links inside your markdown content and replaces it with site links.
- Copies images from Obsidian to Astro (taking care of the implicit "images" directory that Obsidian uses).

## Installation
Run the following command inside your Astro installation to install the plugin into `devDependencies`

```bash
npm install -D astro-content-sync
```

You are now ready to configure the integration by modifying `astro.config.mjs` as shown below

## Configuration

```js
// file: astro.config.mjs
// ...

// Import the plugin
import astroContentSync from 'astro-content-sync';

// Add the plugin to the `plugins` array
export default defineConfig{
  // ...
  integrations: [
    astroContentSync( /* see below for options */ )
  ]
}
```

### Default options

By default, the files are copied to `src/content/blog` inside your Astro installation and it's used when the target path is not explicitly defined.

### Example Configurations

The `astroContentSync` function accepts either a list of strings specifying source & target paths, or a list of objects.

```js
// Copy files from /home/user/.obsidian/blog into Astro's `src/content/blog` directory
integrations: [
  astroContentSync('/home/obsidian/blog'),
]

// Copy files from multiple directories into `src/content/blog`
integrations: [
  astroContentSync('/home/obsidian/blog', '/home/obsidian/work', '/home/obsidian/portfolio'),
]

// Copy files into a specific folder, using a list of strings
integrations: [
  astroContentSync('/home/obsidian/blog:./src/content/posts'),
]

// Copy files into a specific folder, using an object
integrations: [
  astroContentSync({ source: '/home/obsidian/blog' }),
]

// Copy files into a specific folder, using an object specifying the target path
integrations: [
  astroContentSync({ source: '/home/obsidian/blog', target: 'src/content/blog' }),
]

// Copy files into a specific folder, using an object specifying a trasform function and an ignore list
integrations: [
  astroContentSync({ source: '/home/obsidian/blog', target: 'src/content/blog', ignore: [/* paths to ignore */], transform: (path) => path.replace(...) }),
]
```

When adding the `astroContentSync` without any arguments into the configuration, it will try to resolve the soure path from the value of the `ASTRO_CONTENT_SYNC` environment variable.
Note: Environment variables don't work in configuration files, you'll need to load then explicitly as shown in [this guide](https://docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file).

```bash
# Go to your astro installation
cd /home/sites/astro-blog

# Copy files from /home/user/.obsidian/blog into Astro's `src/content/blog` directory
ASTRO_CONTENT_SYNC="/home/user/.obsidian/blog" npm run dev

# Copy files from multiple directories into `src/content/blog`
ASTRO_CONTENT_SYNC="/home/user/.obsidian/blog,/home/user/.obsidian/portfolio" npm run dev

# Specify target path via a colon
ASTRO_CONTENT_SYNC="/home/user/.obsidian/blog:./src/content/my-custom-path" npm run dev
```

### Full Configuration object
```js
{
  source: string;                         // The path to the directory that will be watched for changes
  target?: string;                        // The path to the directory that the sourcePath will be synced to
  ignored?: string[];                     // List of glob patterns to be ignored by the integration
  transform?: (path: string) => string;   // Function to transform the path of the file before syncing
}
```
