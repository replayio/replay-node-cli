const fs = require("fs");
const https = require("https");
const { spawnSync } = require("child_process");

const Usage = `
Usage:

replay-node script.js ...args          Record node when running a script.
replay-node --exec executable ...args  Record all node scripts when running an executable.
replay-node --update                   Ensure the replay version of node is downloaded/updated.
`;

const argv = process.argv.slice(2);

if (!argv.length) {
  console.log(Usage);
  process.exit(1);
}

let gNeedUpdate = false;
let gExecutable = false;
if (argv[0] == "--update") {
  if (argv.length > 1) {
    console.log(`Cannot use --update with other arguments`);
    console.log(Usage);
    process.exit(1);
  }
  gNeedUpdate = true;
} else if (argv[0] == "--exec") {
  gExecutable = true;
  argv.shift();
  if (!argv.length) {
    console.log(`Need additional arguments after --exec`);
    console.log(Usage);
    process.exit(1);
  }
} else if (argv[0].startsWith("--")) {
  console.log(`Unrecognized option: ${argv[0]}`);
  console.log(Usage);
  process.exit(1);
}

main();

function getDirectory() {
  return process.env.RECORD_REPLAY_DIRECTORY || `${process.env.HOME}/.replay`;
}

async function main() {
  await updateNode();
  if (gNeedUpdate) {
    process.exit(0);
  }

  if (gExecutable) {
    // Update the path so that the replay version of node is found first when
    // subprocesses run.
    process.env.PATH = `${getDirectory()}/node:` + process.env.PATH;

    const rv = spawnSync(argv[0], argv.slice(1), { stdio: "inherit" });
    return rv.status;
  }

  const rv = spawnSync(`${getDirectory()}/node/node`, argv, { stdio: "inherit" });
  return rv.status;
}

async function updateNode() {
  if (!fs.existsSync(getDirectory())) {
    fs.mkdirSync(getDirectory());
  }
  if (!fs.existsSync(`${getDirectory()}/node`)) {
    fs.mkdirSync(`${getDirectory()}/node`);
  }

  const file = `${currentPlatform()}-replay-node`;

  const pathNode = `${getDirectory()}/node/node`;
  const pathJSON = `${getDirectory()}/node/node.json`;

  if (!gNeedUpdate && fs.existsSync(pathNode)) {
    return;
  }

  let jsonContents;
  if (fs.existsSync(pathNode) && fs.existsSync(pathJSON)) {
    console.log(`Checking for ${file} update...`);
    const existingContents = fs.readFileSync(pathJSON, "utf8");
    jsonContents = await downloadFile(`${file}.json`);
    if (jsonContents == existingContents) {
      console.log(`Already up to date.`);
      return;
    }
  }

  console.log(`Downloading ${file}...`);
  const nodeContents = await downloadFile(file);
  fs.writeFileSync(pathNode, nodeContents, { mode: 0o777 });
  if (!jsonContents) {
    jsonContents = await downloadFile(`${file}.json`);
  }
  fs.writeFileSync(pathJSON, jsonContents);
  console.log("Downloaded.");
}

async function downloadFile(downloadFile) {
  const options = {
    host: "replay.io",
    port: 443,
    path: `/downloads/${downloadFile}`,
  };
  const waiter = defer();
  const request = https.get(options, response => {
    const buffers = [];
    response.on("data", data => buffers.push(data));
    response.on("end", () => waiter.resolve(buffers));
  });
  request.on("error", err => {
    console.log(`Download error ${err}, aborting.`);
    process.exit(1);
  });
  const buffers = await waiter.promise;
  return Buffer.concat(buffers);
}

function currentPlatform() {
  switch (process.platform) {
    case "darwin":
      return "macOS";
    case "linux":
      return "linux";
    default:
      throw new Error(`Platform ${process.platform} not supported`);
  }
}

function defer() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
