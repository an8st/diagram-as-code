// http://plantuml.com/en/preprocessing
const INCLUDE_REG = /^\s*!(include(?:sub)?)\s+(.+?)(?:!(\w+))?$/i;
const STARTSUB_TEST_REG = /^\s*!startsub\s+(\w+)/i;
const ENDSUB_TEST_REG = /^\s*!endsub\b/i;

const START_DIAGRAM_REG = /(^|\r?\n)\s*@start.*\r?\n/i;
const END_DIAGRAM_REG = /\r?\n\s*@end.*(\r?\n|$)(?!.*\r?\n\s*@end.*(\r?\n|$))/i;

let _included = {};
let _route = [];

export function resolveInclude(content, diagrams, first = true) {
    if(first) _included = {};
    let lines = content instanceof Array ? content : content.replace(/\r\n|\r/g, "\n").split('\n');
    let processedLines = lines.map(line => line.replace(
        INCLUDE_REG,
        (match, ...args) => {
            let Action = args[0].toLowerCase();
            let target = args[1].trim();
            let sub = args[2];
            let file = target;
            let result;
            if (Action == "include") {
                result = getIncludeContent(file, diagrams);
            } else {
                result = getIncludesubContent(file, sub, diagrams);
            }
            return result === undefined ? match : result;
        }
    ));
    return processedLines.join('\n');
}


function getIncludeContent(file, diagrams) {
    if (!file) return undefined;
    let fileData = getFile(file, diagrams);
    if (!fileData) return undefined;
    // console.log('Entering:', file);
    if (_included[fileData.key]) {
        // console.log("Ignore file already included:", file);
        return "";
    }
    // TODO: read from editor for unsave changes
    _route.push(file);
    let content = fileData.code;
    _included[fileData.key] = true;
    let result = resolveInclude(content, diagrams, false);
    _route.pop();
    // console.log('Leaving:', file);

    result = result.replace(START_DIAGRAM_REG, "$1");
    result = result.replace(END_DIAGRAM_REG, "$1");

    return result;
}

function getFile(file, diagrams) {

    let _d = false;
    Object.keys(diagrams).forEach(function(key) {
        if(file.search(`^${diagrams[key].title}\.[a-zA-Z]{2,7}$`) == 0) _d = ({"key": key, "code": diagrams[key].code})
    })
    return _d;
}

function getIncludesubContent(file, sub, diagrams) {
    if (!file || !sub) return undefined
    let identifier = `${file}!${sub}`;
    // // Disable sub block duplication check, to keep same behavior with PlantUML project
    // if (included[file]) {
    //     // console.log("ignore block already included:", file);
    //     return "";
    // }
    // console.log('Entering:', identifier);
    // let find = findInArray(_route, identifier);
    // if (find >= 0) {
    //     throw 'Include loop detected!' + '\n\n' + makeLoopInfo(find);
    // }
    _route.push(identifier);
    let result = undefined;
    let blocks = getSubBlocks(file, diagrams);
    if (blocks) {
        // included[identifier] = true;
        result = resolveInclude(blocks[sub], diagrams, false);
    }
    _route.pop();
    // console.log('Leaving:', identifier);
    return result;
}

function getSubBlocks(file, diagrams) {
    if (!file) return undefined;
    let fileData = getFile(file, diagrams)
    if (!fileData) return undefined;
    let blocks = {};
    // TODO: read from editor for unsave changes
    let lines = fileData.code.split('\n');
    let subName = "";
    let match = "";
    for (let line of lines) {
        match = STARTSUB_TEST_REG.exec(line);
        if (match) {
            subName = match[1];
            continue;
        } else if (ENDSUB_TEST_REG.test(line)) {
            subName = "";
            continue;
        } else {
            if (subName) {
                if (!blocks[subName]) blocks[subName] = [];
                blocks[subName].push(line);
            }
        }
    }
    return blocks;
}

function findInArray(arr, find) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == find) return i;
    }
    return -1;
}

function makeLoopInfo(loopID) {
    let lines = [];
    for (let i = 0; i < loopID; i++) {
        lines.push(_route[i]);
    }
    lines.push('|-> ' + _route[loopID]);
    for (let i = loopID + 1; i < _route.length - 1; i++) {
        lines.push('|   ' + _route[loopID]);
    }
    lines.push('|<- ' + _route[_route.length - 1]);
    return lines.join('\n');
}