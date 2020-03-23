const twitchAppApi = require('better-twitch-app-api');
const shelljs = require('shelljs');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');


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
   * Shortcut function to move files
   * @param {String} old_path
   * @param {String} new_path
   */
  move(old_path, new_path){
    const e = this._mclcInstance;
    fs.rename(old_path, new_path, function (err) {
      if (err) e.emit('debug', `[MCLC/${this.getName()}]: Error: ${err}`);
    });
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
      console.log(this._options.hasOwnProperty('modpackManager'), this._options.modpackManager.hasOwnProperty('modslist'));
      if (this._options.hasOwnProperty('modpackManager')) {

        if (this._options.modpackManager.hasOwnProperty('modpackId')){

          const modFolder = path.resolve(this._options.root, "mods");

          // Get the mod information from curseforge with the project ID
          const {latestFiles: modpack} = await twitchAppApi.getAddonInfo(this._options.modpackManager.modpackId);
          
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloading ${modpack.fileName}`);
          await handler.downloadAsync(modpack.downloadUrl, modFolder, modpack.fileName, true, "mod")
            .catch((error) => {
              reject(error)
            });
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloaded ${modpack.fileName}`);

          fs.createReadStream(path.join(modFolder, info.fileName)).pipe(unzipper.Parse()).on('entry', (entry) => {
            var fileName = entry.path;
            var type = entry.type; // 'Directory' or 'File'
        
            if (/\/$/.test(fileName)) {
              console.log('[DIR]', fileName, type);
              return;
            }
        
            console.log('[FILE]', fileName, type);
        
            // TODO: probably also needs the security check
        
            entry.pipe(process.stdout/*fs.createWriteStream('output/path')*/);
          });
        }
        else if (this._options.modpackManager.hasOwnProperty('modsList')){
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking for mods folder`);

          // Getting the mods folder path
          const modFolder = path.resolve(this._options.root, "mods")

          // Is the mods folder exist ?
          if (!fs.existsSync(modFolder)) {
            // Creating recursively the mods folder
            shelljs.mkdir('-p', modFolder);
          }

          // Getting the unused mods folder path
          const unusedModFolder = path.resolve(this._options.root, ".unused_mods")

          // Is the unused mods folder exist ?
          if (!fs.existsSync(unusedModFolder)) {
            // Creating recursively the unused mods folder
            shelljs.mkdir('-p', unusedModFolder);
          }

          // Getting all files available in the mod folder
          let installedMods = fs.readdirSync(modFolder);
          let installedUnusedMods = fs.readdirSync(unusedModFolder);

          installedMods = installedMods.concat(installedUnusedMods);

          let modsList = [];

          // Process all mods from the configuration
          for (const projectID of Object.keys(this._options.modpackManager.modsList)) {
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

            const unusedFileExist = installedUnusedMods.find((name) => {
              return name === info.fileName;
            });

            // Is the file already exist in the mods folder ?
            if (fileExist || unusedFileExist) {
              console.log(info.fileName);

              // If the mod is on unused folder than move it to the main one
              if(unusedFileExist)
                this.move(path.resolve(unusedModFolder, info.fileName), path.resolve(modFolder, info.fileName));

              this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking checksum for file: ${info.fileName}`);
              // Is the hash don't correspond for the current file ?
              if (!await handler.checkSum(modConfig.hash, path.resolve(modFolder, info.fileName), {
                algorithm: "md5"
              })) {
                this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checksum invalid for file: ${info.fileName}`);
                // Delete the file and remove it from the installed mods list
                fs.unlinkSync(path.resolve(modFolder, info.fileName));
                const index = installedMods.indexOf(info.fileName);
                installedMods.splice(index, 1);
              }
              else {
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
            // Move the file
            this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Moving forbidden file: ${file}`);
            this.move(path.resolve(modFolder, file), path.resolve(unusedModFolder, file));
          }

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