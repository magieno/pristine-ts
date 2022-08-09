const fs = require('fs');
const { exec } = require('child_process');

const controllerContent = fs.readFileSync("./token.controller.ts", "utf-8");

// We will create a controller file for each animal in this list.
const animals = [
    "Aardvark",
    "Albatross",
    "Alligator",
    "Alpaca",
    "Ant",
    "Anteater",
    "Antelope",
    "Ape",
    "Armadillo",
    "Donkey",
    "Baboon",
    "Badger",
    "Barracuda",
    "Bat",
    "Bear",
    "Beaver",
    "Bee",
    "Bison",
    "Boar",
    "Buffalo",
    "Butterfly",
    "Camel",
    "Capybara",
    "Caribou",
    "Cassowary",
    "Cat",
    "Caterpillar",
    "Cattle",
    "Chamois",
    "Cheetah",
    "Chicken",
    "Chimpanzee",
    "Chinchilla",
    "Chough",
    "Clam",
    "Cobra",
    "Cockroach",
    "Cod",
    "Cormorant",
    "Coyote",
    "Crab",
    "Crane",
    "Crocodile",
    "Crow",
    "Curlew",
    "Deer",
    "Dinosaur",
    "Dog",
    "Dogfish",
    "Dolphin",
    "Dotterel",
    "Dove",
    "Dragonfly",
    "Duck",
    "Dugong",
    "Dunlin",
    "Eagle",
    "Echidna",
    "Eel",
    "Eland",
    "Elephant",
    "Elk",
    "Emu",
    "Falcon",
    "Ferret",
    "Finch",
    "Fish",
    "Flamingo",
    "Fly",
    "Fox",
    "Frog",
    "Gaur",
    "Gazelle",
    "Gerbil",
    "Giraffe",
    "Gnat",
    "Gnu",
    "Goat",
    "Goldfinch",
    "Goldfish",
    "Goose",
    "Gorilla",
    "Goshawk",
    "Grasshopper",
    "Grouse",
    "Guanaco",
    "Gull",
    "Hamster",
    "Hare",
    "Hawk",
    "Hedgehog",
    "Heron",
    "Herring",
    "Hippopotamus",
    "Hornet",
    "Horse",
    "Human",
    "Hummingbird",
    "Hyena",
    "Ibex",
    "Ibis",
    "Jackal",
    "Jaguar",
    "Jay",
    "Jellyfish",
    "Kangaroo",
    "Kingfisher",
    "Koala",
    "Kookabura",
    "Kouprey",
    "Kudu",
    "Lapwing",
    "Lark",
    "Lemur",
    "Leopard",
    "Lion",
    "Llama",
    "Lobster",
    "Locust",
    "Loris",
    "Louse",
    "Lyrebird",
    "Magpie",
    "Mallard",
    "Manatee",
    "Mandrill",
    "Mantis",
    "Marten",
    "Meerkat",
    "Mink",
    "Mole",
    "Mongoose",
    "Monkey",
    "Moose",
    "Mosquito",
    "Mouse",
    "Mule",
    "Narwhal",
    "Newt",
    "Nightingale",
    "Octopus",
    "Okapi",
    "Opossum",
    "Oryx",
    "Ostrich",
    "Otter",
    "Owl",
    "Oyster",
    "Panther",
    "Parrot",
    "Partridge",
    "Peafowl",
    "Pelican",
    "Penguin",
    "Pheasant",
    "Pig",
    "Pigeon",
    "Pony",
    "Porcupine",
    "Porpoise",
    "Quail",
    "Quelea",
    "Quetzal",
    "Rabbit",
    "Raccoon",
    "Rail",
    "Ram",
    "Rat",
    "Raven",
    "Red deer",
    "Red panda",
    "Reindeer",
    "Rhinoceros",
    "Rook",
    "Salamander",
    "Salmon",
    "Sand Dollar",
    "Sandpiper",
    "Sardine",
    "Scorpion",
    "Seahorse",
    "Seal",
    "Shark",
    "Sheep",
    "Shrew",
    "Skunk",
    "Snail",
    "Snake",
    "Sparrow",
    "Spider",
    "Spoonbill",
    "Squid",
    "Squirrel",
    "Starling",
    "Stingray",
    "Stinkbug",
    "Stork",
    "Swallow",
    "Swan",
    "Tapir",
    "Tarsier",
    "Termite",
    "Tiger",
    "Toad",
    "Trout",
    "Turkey",
    "Turtle",
    "Viper",
    "Vulture",
    "Wallaby",
    "Walrus",
    "Wasp",
    "Weasel",
    "Whale",
    "Wildcat",
    "Wolf",
    "Wolverine",
    "Wombat",
    "Woodcock",
    "Woodpecker",
    "Worm",
    "Wren",
    "Yak",
    "Zebra"
];


const myArgs = process.argv.slice(2);
console.log(myArgs);
const amountIndex = myArgs.findIndex((arg) => arg === "amount");
console.log(amountIndex)
const numberOfControllersToGenerate = amountIndex >= 0 && myArgs[amountIndex + 1] ? myArgs[amountIndex + 1] : animals.length;
console.log(numberOfControllersToGenerate);


const now = new Date();

let outputFolder = "./output/";
outputFolder = outputFolder +  now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();

if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder);
}
const files = fs.readdirSync(outputFolder);

outputFolder = outputFolder + "/0" + (files.length + 1);

if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder);
}

const createdAnimal: {[key: string]: boolean} = {}
for(let i = 0; i < numberOfControllersToGenerate; i++){
    let randomIndex = Math.floor(Math.random() * (animals.length))
    let animal: string = animals[randomIndex];
    while(createdAnimal[animal]){
        randomIndex = Math.floor(Math.random() * (animals.length))
        animal = animals[randomIndex];
    }
    createdAnimal[animal] = true;
    const capitalizedToken = animal;
    const lowercaseToken = animal.toLowerCase();
    const pluralToken = lowercaseToken + "s";

    let interpolatedContent = controllerContent.replace(/__TOKEN_CAPITALIZED__/g, capitalizedToken);
    interpolatedContent = interpolatedContent.replace(/__TOKEN_PLURAL__/g, pluralToken);


    fs.writeFileSync(outputFolder + "/" + lowercaseToken + ".controller.ts", interpolatedContent);
}

// Create a git commit and push
const https = require('https');

const usernames = [
    "etiennenoel",
    "mathieugh",
];

const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/users/' + usernames[Math.floor(Math.random() * usernames.length)] + '/events',
    method: 'GET',
    headers: {
        "User-Agent": "Awesome-Octocat-App"
    }
};

let commitMessages: string[] = [];


new Promise<void>(resolve => {
    const req = https.request(options, (res: any) => {
        console.log(JSON.stringify(options));
        console.log(`statusCode: ${res.statusCode}`);
        let body = '';

        res.on('data', (chunk: any) => {
            body = body + "" + chunk;
        });

        res.on('end', () => {
            //console.log(body);
            const json = JSON.parse(body);

            json.forEach( (element: any) => {
                const commits = element.payload?.commits;

                if(commits && Array.isArray(commits)) {
                    commits.forEach(commit => {
                        if(commit.hasOwnProperty("message") === false) {
                            return;
                        }
                        commitMessages.push(commit.message);
                    })
                }
            })

            return resolve();
        })
    });

    req.on('error', (error: any) => {
        console.error(error);
    });

    req.end();
}).then(() => {
    // Select randomly a commit message
    const selectedMessage = commitMessages[Math.floor(Math.random() * commitMessages.length)];

    exec('git add *', (error: any, stdout: any, stderr: any) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);

        exec('git commit -m "' + selectedMessage + '"', (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);


            exec('git push', (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });

        });
    });

})
