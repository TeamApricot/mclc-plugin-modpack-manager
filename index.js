const twitchAppApi = require('better-twitch-app-api');
const shelljs = require('shelljs');
const fs = require('fs');
const path = require('path');


/**
 *
 *
 * @class ModPackModule
 */
class ModPackModule {
  /**
   * Creates an instance of ModPackModule.
   * @param {*} mclcInstance
   * @memberof ModPackModule
   */
  constructor(mclcInstance) {
    this._mclcInstance = mclcInstance;
    this.name = 'ModPack-Manager';
    this.options = null;
  }

  /**
   * Register Module
   * @param {Object} options
   * @memberof ModPackModule
   */
  register(options) {
    this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: ModPack-Manager registered`);
    this._options = options;
  }

  /**
   * Function call by MCLC to launch custom download process.
   * There the module download forge mods from curseforge with specified configuration.
   * @param {Object} handler
   * @returns {Promise<any>}
   * @memberof ModPackModule
   */
  async download(handler) {
    return new Promise(async (resolve, reject) => {
      // There is a configuration for the module ?
      if (this._options.hasOwnProperty('modpackManager') && this._options.modpackManager.hasOwnProperty('modslist')) {
        this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking for mods folder`);

        // Getting the mods folder path
        const modFolder = path.resolve(this._options.root, "mods")

        // Is the mods folder exist ?
        if (!fs.existsSync(modFolder)) {
          // Creating recursively the mods folder
          shelljs.mkdir('-p', modFolder);
        }

        // Getting all files available in the mod folder
        let installedMods = fs.readdirSync(modFolder);

        let modsList = [];

        // Process all mods from the configuration
        for (const projectID of Object.keys(this._options.modpackManager.modslist)) {
          // Get the configuration for the current key
          const modConfig = this._options.modpackManager.modsList[projectID];

          // Get the mod information from curseforge with the project ID
          const {gameVersionLatestFiles: mods} = await twitchAppApi.getAddonInfo(projectID);

          // Find the corresponding file version which match with the version ID specified in the configuration
          const mod = mods.find((mods) => {
            return mods.projectFileId === modConfig.fileId
          })

          // Get the file information from curseforge with the project and file IDs
          const info = await twitchAppApi.getAddonFileInformation(projectID, mod.projectFileId);

          const fileExist = installedMods.find((name) => {
            return name === info.fileName;
          })

          // Is the file already exist in the mods folder ?
          if (fileExist) {
            this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking checksum for file: ${info.fileName}`);
            // Is the hash don't correspond for the current file ?
            if (!await handler.checkSum(modConfig.hash, path.resolve(modFolder, info.fileName))) {
              this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checksum invalid for file: ${info.fileName}`);
              // Delete the file and remove it from the installed mods list
              fs.unlinkSync(path.resolve(modFolder, info.fileName));
              const index = installedMods.indexOf(info.fileName);
              installedMods.splice(index, 1);
            } else {
              // The file is installed, just remove it and continue to the next iteration
              const index = installedMods.indexOf(info.fileName);
              installedMods.splice(index, 1);

              continue;
            }
          }
          // Add the current mod to the mods list
          modsList.push(info);
        }

        // Loop the mods list mod by mod
        for (const info of modsList) {
          // Download the mod file from curseforge
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloading ${info.fileName}`);
          await handler.downloadAsync(info.downloadUrl, modFolder, info.fileName, true, "mod")
            .catch((error) => {
              reject(error)
            });
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloaded ${info.fileName}`);
        }

        this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking for forbidden files`);

        // Loop the latest entries available in the files list
        for (const file of installedMods) {
          // Delete the file
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Delete forbidden file: ${file}`);
          fs.unlinkSync(path.resolve(modFolder, file));
        }
      }

      // Resolve the promise and go back to MCLC normal process
      resolve();
    })
  }

  /**
   * Get module name
   * @returns {string}
   * @memberof ModPackModule
   */
  getName() {
    return this.name
  }
}

module.exports = ModPackModule