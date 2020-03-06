# mclc-plugin-modpack-manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This package is an extension for the package [MCLC](https://github.com/Pierce01/MinecraftLauncher-core).

### Installing

For now, just add this in your `package.json`:

```json
{
  "dependancies": {
    ...,
    "minecraft-launcher-core": "git+https://git@github.com/bricklou/minecraft-launcher-core",
    "mclc-plugin-modpack-manager": "git+https://git@github.com/bricklou/mclc-plugin-modpack-manager.git",
    ...
  }
}
```

### Standard Example with MCLC

```js
const { Client, Authenticator } = require('minecraft-launcher-core');
const ModpackManager = require('mclc-plugin-modpack-manager');
const launcher = Client();

// Ask to MCLC to use the plugin
launcher.use(ModpackManager);

let opts = {
  clientPackage: null,
  // For production launchers, I recommend not passing 
  // the getAuth function through the authorization field and instead
  // handling authentication outside before you initialize
  // MCLC so you can handle auth based errors and validation!
  authorization: Authenticator.getAuth("username", "password"),
  root: "./minecraft",
  os: "windows",
  version: {
    number: "1.12.2",
    type: "release"
  },
  // Read the docs about MCLC for more information about how manage forge
  forge: './forge.jar',
  memory: {
    max: "6000",
    min: "4000"
  },
  // New option added by the plugin
  modpackManager: {
    modslist: modslist
  }
}
```

The mods list argument need to be formated like this:
 ```js
 const modslist = {
    64578: { // The mod ID available on the curseforge mod's page
        fileId: 2858816, // The id of the file you want to download
        hash: "09fb0ebd8ec12914a56f8db40d5cb9a6d66b3da5" // The hash of the file (which need to be hash with sha1)
    },
    238222: {
        fileId: 2803400,
        hash: "b7ce5f00e9709e08e81c597dc2d7336f58b7fe8e"
    },
    ...
};
 ```

 **Note:** You also need to add manually the mods dependencies, otherwise your game will not be able to run because they won't have been installed.