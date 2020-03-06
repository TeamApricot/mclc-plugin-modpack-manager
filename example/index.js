const { Client, Authenticator } = require('minecraft-launcher-core');
const ModpackManager = require('../index');
const launcher = new Client();

launcher.use(ModpackManager);

const modslist = {
    64578: {
        fileId: 2858816,
        hash: "09fb0ebd8ec12914a56f8db40d5cb9a6d66b3da5"
    },
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
    forge: "./forge.jar",
    memory: {
        max: "2048",
        min: "512"
    },
    modpackManager: {
        modslist: modslist
    }
};

launcher.launch(opts);

launcher.on('debug', (e) => console.log(e));
launcher.on('data', (e) => console.log(e));
