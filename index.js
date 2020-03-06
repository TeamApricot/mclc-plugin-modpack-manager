const twitchappapi = require('better-twitch-app-api');
const shelljs = require('shelljs');
const fs = require('fs');
const path = require('path');

class ModPackModule {
  constructor(mclcInstance) {
    this._mclcInstance = mclcInstance;
    this.name = 'ModPack-Manager';
    this.options = null;
  }

  register(options) {
    this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: ModPack-Manager registered`);
    this._options = options;
  }

  async download(handler) {
    return new Promise(async (resolve, reject) => {
      if (this._options.hasOwnProperty('modpackManager') && this._options.modpackManager.hasOwnProperty('modslist')) {
        this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloading mods`);
        if (!fs.existsSync(path.resolve(this._options.root, 'mods'))) {
          shelljs.mkdir('-p', path.resolve(this._options.root, 'mods'));
        }

        const modFolder = path.resolve(this._options.root, "mods")
        let installedMods = []

        installedMods = await fs.readdirSync(modFolder);

        let modslist = [];

        for (const key of Object.keys(this._options.modpackManager.modslist)) {
          const modConfig = this._options.modpackManager.modslist[key];

          const mods = await twitchappapi.getAddonInfo(key).then(data => data.gameVersionLatestFiles);
          const mod = mods.find((mods) => {
            return mods.projectFileId === modConfig.fileId
          })

          const info = await twitchappapi.getAddonFileInformation(key, mod.projectFileId);

          const fileExist = installedMods.find((name) => {
            return name === info.fileName;
          })

          if (fileExist) {
            this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking checksum for file: ${info.fileName}`);
            if (!await handler.checkSum(modConfig.hash, path.resolve(modFolder, info.fileName))) {
              this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checksum invalid for file: ${info.fileName}`);
              fs.unlinkSync(path.resolve(modFolder, info.fileName));
              const index = installedMods.indexOf(info.fileName);
              installedMods.splice(index, 1);
            } else {
              const index = installedMods.indexOf(info.fileName);
              installedMods.splice(index, 1);

              continue;
            }
          }
          modslist.push(info);
        }

        for (const info of modslist) {
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloading ${info.fileName}`);
          await handler.downloadAsync(info.downloadUrl, modFolder, info.fileName, true, "mod")
            .catch((error) => {
              reject(error)
            });
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Downloaded ${info.fileName}`);
        }

        this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Checking for forbiben files`);

        for (const file of installedMods) {
          this._mclcInstance.emit('debug', `[MCLC/${this.getName()}]: Delete forbidden file: ${file}`);
          fs.unlinkSync(path.resolve(modFolder, file));
        }
      }

      resolve();
    })
  }

  getName() {
    return this.name
  }
}

module.exports = ModPackModule