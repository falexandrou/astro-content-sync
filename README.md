## Usage

### With Environment Variables

```bash
# Specifying just the source, will use Astro's default content directory
ASTRO_CONTENT_SYNC='/home/user/my-content-source' npm astro dev

# Specifying both source and destination
ASTRO_CONTENT_SYNC='/home/user/my-content-source:./src/content' npm astro dev
```

### With Astro Config

```js
// astro.config.mjs
// ...
// Import the plugin
import { astroContentSync } from 'astro-content-sync';
// ...
// Add the plugin to the `plugins` array
export default {
  // ...
  plugins: [
    astroContentSync({
      source: '/home/user/my-content-source', // or process.env.MY_CONTENT_SOURCE in a team environment
      destination: './src/content'
    })
  ]
}
```
