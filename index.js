const core = require('@actions/core');
const github = require('@actions/github');
const { readdirSync, readFileSync, writeFileSync, existsSync } = require('fs');
const workSpace = process.env.GITHUB_WORKSPACE;


function getJSONFilesInDir(source) {
    return readdirSync(source, { withFileTypes: true })
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(fileName => fileName !== 'manifest.json' && fileName.endsWith('.json'))
}

function getDirectories(source) {
    return readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(dir => !dir.startsWith('.'))
}
function readFile(fileName) {
    return readFileSync(fileName, 'utf8');
}

const directoryList = getDirectories(workSpace);

/* START: Generate manifest for each folder */
directoryList.forEach(dir => {
    const workingDirectory = `${workSpace}/${dir}`;
    /* Copy readme file into the manifest.json */
    if(!existsSync(`${workingDirectory}/readme.txt`)) return;
    const manifestInfo = readFile(`${workingDirectory}/readme.txt`);     
    writeFileSync(`${workSpace}/${dir}/manifest.json`,manifestInfo);
    const appManifest = JSON.parse(readFile(`${workingDirectory}/manifest.json`));
    const filesInDir = getJSONFilesInDir(`${workSpace}/${dir}`);
    appManifest.manifest = [];    
    filesInDir.forEach(fileName => {
        const file = JSON.parse(readFile(`${workingDirectory}/${fileName}`));        
        /* Add active files to the manifest json */
        if (file.active) {         
            appManifest.manifest.push({ collection: file.collection, record: file.record._id });
        }
    });
    writeFileSync(`${workingDirectory}/manifest.json`, JSON.stringify(appManifest, null, 4));
});
/* END: Generate manifest for each folder */

/* START: Generate main app manifest */
const mainAppManifest = directoryList.map(dir => {
    const fileContent = {};    
    const appManifest = JSON.parse(readFile(`${workSpace}/${dir}/manifest.json`));    
    
    return { _id: appManifest._id, name: appManifest.name, title: appManifest.title || "" }
});

writeFileSync(`${workSpace}/manifest.json`, JSON.stringify(mainAppManifest, null, 4))
/* END: Generate main app manifest */
