const { Client, Authenticator } = require('minecraft-launcher-core');
const ModpackManager = require('../index');
const launcher = new Client();

// Ask to MCLC to user the plugin
launcher.use(ModpackManager);

// Create mods list which contain mods information
const modsList = {
    // Mod ID on curseforge (there EnderIO)
    64578: {
        // ID for the mod version
        fileId: 2858816,
        // SHA1 hash of the file
        hash: "09fb0ebd8ec12914a56f8db40d5cb9a6d66b3da5"
    },
    // Mod ID for Just Enough Items
    238222: {
        fileId: 2803400,
        hash: "b7ce5f00e9709e08e81c597dc2d7336f58b7fe8e"
    }
};

let opts = {
    clientPackage: null,
    // For production launchers, I recommend not passing 
    // the getAuth function through the authorization field and instead
    // handling authentication outside before you initialize
    // MCLC so you can handle auth based errors and validation!
    authorization: Authenticator.getAuth("test"),
    root: "./minecraft",
    version: {
        number: "1.12.2",
        type: "release"
    },
    // Read the docs about MCLC for more information about how manage forge
    forge: "./forge.jar",
    memory: {
        max: "2048",
        min: "512"
    },
    // New option added by the plugin
    modpackManager: {
        modsList: modsList
    }
};

launcher.launch(opts);

launcher.on('debug', (e) => console.log(e));
launcher.on('data', (e) => console.log(e));
