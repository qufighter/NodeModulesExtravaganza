"use strict";
// node module extravaganza (switcher)

var fs = require('fs');
var spawn = require('child_process').spawn;
var defaultInstName = 'unnamed-installation';
var defInstLen = defaultInstName.length;

var npm_install_folder = 'node_modules';
var metadata_filename = '.nme.json';
var storagePath = '.nme/';
fs.mkdir(storagePath, function(err){});//, 0o700);
// we are treating this mkdir as synchronous!  could cause issues on first run

if( process.argv.length > 4 ){
	console.log("Need fewer arguments");
	process.exit(1);
}

var installations = fs.readdirSync(storagePath);
var install = '';
var installsMap = {};
var nextUnnamedVersion = 1, ver;
for( var i=0,l=installations.length; i<l; i++ ){
	install = installations[i];
	installsMap[install] = install;
	if( install.substr(0, defInstLen) == defaultInstName ){
		ver = install.substr(defInstLen) - 0;
		if( ver >= nextUnnamedVersion ){
			nextUnnamedVersion = ver + 1;
		}
	}
}

var op = process.argv[2];
var label = process.argv[3];

function op_list(){
	if( !curVersionMeta.default ){
		console.log(' you using version: '+curVersionMeta.name);
	}else if(curVersionMeta.modulesDirectoryExists){
		console.log(' you are using an unnamed '+npm_install_folder+' installation. to add a name you need to `nme store ______` then `nme use ______`');
	}else{
		console.log(' you either don\'t have a '+npm_install_folder+' installation currently or it\'s an unexpected format');
	}

	showPossibleInstalls();
	process.exit(0);
}

function op_use(){
	if( curVersionMeta.name == label){
		console.log(' you are already using version: '+label);

		if( installsMap[label] ){
			console.log(' Unfortunately there is also a backup with the same name,');
			console.log(' to rename and save current node_moduels folder, run `nme store '+curVersionMeta.name+'-newName`');
		}
		showPossibleInstalls();

	}else if( installsMap[label] ){
		backupCurrentVersion();
	}else{
		console.log(' '+label+' was not found!  available choices:');
		showPossibleInstalls();
	}
}

function op_store(){
	if( label ){
		curVersionMeta.name = label; // allow rename
		curVersionMeta.default = true; // its a custom name now, we we need to make sure it gets saved - and thats what happens for default names!
		backupCurrentVersion();
	}else{
		console.log(' No label specified, to store with same name use `nme store '+curVersionMeta.name+'` (2)'); // should never reach here, repeated line
		process.exit(1);
	}
}

function op_npm_cmd(){
	if( installsMap[label] ){
		console.log(' ERROR: selected label `'+label+'` already exists!');
		process.exit(1);
	}
	if( label == curVersionMeta.name ){
		console.log(' ERROR: selected label `'+label+'` matches the active label!');
		process.exit(1);
	}
	if( installsMap[curVersionMeta.name] ){
		console.log(' ERROR: currently installed version `'+curVersionMeta.name+'` exists twice! rename and save it, try `nme store ________`');
		process.exit(1);
	}

	backupCurrentVersion();
}

var allowedCommands = { // should be "named" functions only
	'ls': op_list,
	'list': op_list,
	'use': op_use,
	'store': op_store,
	'save': op_store,
	'install': op_npm_cmd,
	'shrinkwrap': op_npm_cmd
}

var uniqueCommands = {};
for( var c in allowedCommands ){
	if( ! uniqueCommands[allowedCommands[c].name] ) uniqueCommands[allowedCommands[c].name] = [];
	uniqueCommands[allowedCommands[c].name].push(c);
}

var commandsDisplayList = [];
for( var c in uniqueCommands ){
	commandsDisplayList.push( uniqueCommands[c].join(', ') );
}

var commandsNotRequiringLabel = {
	'ls': 1,
	'list': 1
}

var commandsRequiringExistingLabel = { // all commands that require label, require unique label except these
	'use': 1
}

if( !allowedCommands[op] ){
	console.log("first argument to `nme _______` should be one of the following:");
	listifyArray(commandsDisplayList);
	process.exit(1);
}

var op_name = allowedCommands[op].name;

if( label ){
	if( !commandsRequiringExistingLabel[op] && installsMap[label] ){
		console.log("we already have an install with this name.  To use it run `nme use "+label+"`");
		process.exit(1);
	}
}

var curVersionMeta = {};
readCurrentVersion(function(meta){

	if( !commandsNotRequiringLabel[op] && (!label || !label.match(/^[\w\d\-_]+$/)) ){
		console.log("second argument `label` should be basically text,numbers,underscore,dashes");
		if( op_name == 'op_store'){
			console.log(' No label specified, to store with same name use `nme store '+curVersionMeta.name+'`');
		}
		process.exit(1);
	}

	allowedCommands[op]();
});

function listifyArray(arr){
	console.log("\t"+arr.join("\n\t")+"\n");
}

function showPossibleInstalls(){
	if( installations.length ){
		console.log('\nInstalled Versions:');
		listifyArray(installations);
	}else{
		console.log('\nNo installed versions yet!');
		console.log('to save current install, run `nme store ______`');
	}
	console.log('to switch, run `nme use ______`');
	console.log(' all installations are listed in ' + storagePath);
}

function backupCurrentVersion(){
	if ( curVersionMeta.modulesDirectoryError ){
		beginNmsOp(); // really should check what error here.... but the error is probably that it does not exist
	}else if( curVersionMeta.modulesDirectoryExists ){

		if( curVersionMeta.default == true){ // all versions we store, we should tagify first, if they are either not currently tagged or have been renamed, we set .default to true
			tagifyInstallation();
		}

		fs.rename(npm_install_folder, storagePath+curVersionMeta.name, function(err){
			if (err) throw err;
			beginNmsOp();
		});
		
	}else{
		// was regular file?
		console.log(npm_install_folder+' found but it was not a directory!  Not sure what to do.');
		process.exit(1);
	}
}

function beginNmsOp(){
	if( op_name == 'op_use' ){
		// install version
		fs.rename(storagePath+label, npm_install_folder, function(err){
			readCurrentVersion(function(meta){
				console.log('version: '+meta.name+' installed.');
				process.exit(0);
			});
		});
	}else if(op_name == 'op_store'){
		// do nothing
	}else beginNpmCmd(op);
}

function lpad(num, digits){
   var str = '000'+num; // caution: max zeros
   return str.substr(str.length - digits);
}

function parseJson(d){
	try{
		return JSON.parse(d);
	}catch(e){
		return {name:"unnamed-installation"+lpad(nextUnnamedVersion,3), default:true};
	}
}

function readCurrentVersion(cbf){
	fs.stat(npm_install_folder, function(statDirEr, s){
		fs.readFile(npm_install_folder+'/'+metadata_filename, function(err, data){
			curVersionMeta = parseJson(data);
			curVersionMeta.modulesDirectoryExists = s && s.isDirectory();
			curVersionMeta.modulesDirectoryError = statDirEr;
			cbf(curVersionMeta);
		});
	});
}

function beginNpmCmd(npmop){
	var ls = spawn('npm', [npmop]);

	ls.stdout.on('data', function(data){
	  console.log(""+data);
	});

	ls.stderr.on('data', function(data){
	  console.error(""+data);
	});

	ls.on('close', function(code){
	  console.log('child process exited with code '+code);
	  if( code === 0 ){
	  	tagifyInstallation();
	  }else{
	  	// handle error?  revert? 
	  	console.log('installation failed!  to go back to your previous version, you can use `nme use '+curVersionMeta.name+'`')
	  }
	});
}

function tagifyInstallation(){
	//todo: more metadata needed
	fs.writeFile(npm_install_folder+'/'+metadata_filename, '{"name":"'+label+'"}', function(err){
	  if (err) throw err;
	  console.log('It\'s saved!');
	});
}
