### Node Modules Extravaganza

Allows you to easily switch between many node_modules installation folders.

```
npm install -g nme
```

### Usage

`nme ?`

### How it works

Creates a `.nme` folder in your current working directory, where node_modules folders will be named and stored.

Node modules folders managed by `nme` will contain a `.nme.json` file that will contain the name.

This way when the folder is activated (renamed to node_modules and moved out of the storage directory) the name is retained for future storage.

nme uses "move" command not "copy"

### Examples

`nme store pre-upgrade-modules` will backup your current installation

`nme install new-upgraded-modules` will backup your current install and run `npm install` and name your new install `new-upgraded-modules`

if your current install is un-named - a name will be generated in the format `unnamed-installation001`

### Managing installed versions

`nme list` will show your active version

`nme use _____` will swap your current version for the one specified in `_____`

### Renaming an installed version

currently the only way to rename an installed version is to `store` it with a new name, then `use` the new name

this can be useful if you run `npm install` and the current name no longer reflects teh current install state.

instead you might use `nme install new-updates` to backup your current installation (if exists) and tag your new installation with a name

### Removing old versions

`ls .nme` will show your old versions, and you may delete them the same way you would delete any other folder.

`rm -fr .nme\old-version-name`

### Performance notes

Set your text editors to exclude `.nme` directory from searches and listings

### Reason For Existence

Most of the time this shouldn't really be needed

1) It's nice to have a backup
2) Manually switching between backup and current version is only fun the first time
