let contentPage = document.getElementById('content')
changePage('home');

// TAKEWORD - THE ITEM IN A SENTENCE TO TAKE, CAN BE MUTIPLE IF USED CORRECTLY
// BEFORE YOU, LIES A <P CLASS = TAKEWORD> KEY </P>, WHAT DO YOU DO?
// USE NUMBERS IN A CELL TO INDICATE SURROUNDINGS, LETTERS TO INDICATE ITEMS - MORE SURROUNDINGS THAN ITEMS, NOT LIMITED TO 26 LETTERS

// START WITH 10HP, ONE ATTACK DOES 1 DAMAGE. MODIFIED ATTACKS DO 1x? DAMAGE

// IF FOUND MAP, ALLOW MAP TAB, IF NOT, HIDE THE MAP TAB - HAVE DIFFERENT TABS FOR DIFFERENT FLOORS

// LEVEL GENERATION + MOVEMENT
const height = 11;
const width = 11;

let level = 3;

let playerPosX, playerPosY;
let startX = 1, startY = 1;
let prison = Array.from({ length: height }, () => Array(width).fill('#'));
let inventory = ['Sword', 'Health Potion', 'Health Potion', 'Health Potion'];
let playerExperience = 0;
let username = '';

let traderInventory = []
let playerCoins = 20; 

let playerHealth = 20;
let enemyHealth = Math.floor(Math.random() * 21) + 5; 

let corpseSearched = false;
let corpseInventories = {};

//checks if maze is generated, 
let mazeGenerated = false;

let startTime = Date.now();
let elapsedMinutes = 0;



// ========================= SAVING GAME STUFF ===========================
function saveGameState() {
    const gameState = {
        playerHealth: playerHealth,
        inventory: inventory,
        playerPosX: playerPosX,
        playerPosY: playerPosY,
        prison: prison,
        mazeGenerated: mazeGenerated,
        username: username,
        playerExperience: playerExperience,
        interactionHistory: JSON.parse(localStorage.getItem("interactionHistory")) || { inputs: [], outputs: [] }
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
    const savedGame = JSON.parse(localStorage.getItem("gameState"));

    if (savedGame) {
        playerHealth = savedGame.playerHealth;
        inventory = savedGame.inventory;
        playerPosX = savedGame.playerPosX;
        playerPosY = savedGame.playerPosY;
        prison = savedGame.prison;
        mazeGenerated = savedGame.mazeGenerated;
        username = savedGame.username || 'Unknown'; // sets to 'unknown' if missing - stops errors from occurring
        playerExperience = savedGame.playerExperience || 0; // sets to '0' if missing - stops errors from occurring

        // Load interaction history (if it exists)
        if (savedGame.interactionHistory) {
            localStorage.setItem("interactionHistory", JSON.stringify(savedGame.interactionHistory));
            restoreInteractionHistory();
        }
    }
}

// Function to restore interaction history (inputs & outputs)
function restoreInteractionHistory() {
    const savedHistory = JSON.parse(localStorage.getItem("interactionHistory"));
    const outputsContainer = document.getElementById('outputsContainer');

    if (!outputsContainer) {
        return; // Prevent further errors
    }

    if (savedHistory) {
        savedHistory.inputs.forEach(input => {
            const inputElement = document.createElement('p');
            inputElement.innerHTML = `>> ${input}`;
            inputElement.classList.add('input-message', 'recent');
            outputsContainer.appendChild(inputElement);
        });

        savedHistory.outputs.forEach(output => {
            const outputElement = document.createElement('p');
            outputElement.innerHTML = output;
            outputsContainer.appendChild(outputElement);
        });
    }
}

function startNewGame() {
    // clear all data
    localStorage.removeItem("gameState");
    localStorage.removeItem("interactionHistory");

    // reset inputs and outputs
    resetInOuts();

    // start a new game
    initialiseGame();
}

// would be in playey username model, but needs to be global
function resetInOuts(){
    const inputField = document.getElementById('userInput');
    if (inputField) {
        inputField.value = ''; // Clear input field
    }

    const outputsContainer = document.getElementById('outputsContainer');
    if (outputsContainer) {
        outputsContainer.innerHTML = ''; // Remove all output messages
    }
}


function initialiseGame() {
    // Check if there's saved game data
    const savedState = localStorage.getItem("gameState");

    if (savedState) {
        // Load saved state if available
        loadGameState(); // Call the loadGameState function to load all the saved values
    } else {
        // Initialize a new game if no saved data is found
        if (!mazeGenerated) {
            generateMaze(startX, startY); // Generate a new maze if none exists
            placePlayerAtRandomTwo();
            placeItems();

            playerHealth = 20; // Reset player health if dead
            mazeGenerated = true;
        }
    }
}



function getPlayTime() {
    let elapsedMilliseconds = Date.now() - startTime;
    elapsedMinutes = Math.floor(elapsedMilliseconds / 60000); // Convert ms to minutes
}



// ============================ ACTUAL START OF GAME STUFF (NOT SAVING) ===========================
// possible directions
const directions = [
    { dx: 2, dy: 0 },  // change in Right
    { dx: -2, dy: 0 }, // change in Left
    { dx: 0, dy: 2 },  // change in Down
    { dx: 0, dy: -2 }  // cange in Up
];

function generateMaze(x, y) {
    // Empty a cell
    prison[y][x] = ' ';

    let shuffledDirections = [...directions].sort(() => Math.random() - 0.5);

    for (let { dx, dy } of shuffledDirections) {
        let nx = x + dx, ny = y + dy;

        if (nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && prison[ny][nx] === '#') {
            prison[y + dy / 2][x + dx / 2] = ' ';
            // Recursively generate the maze
            generateMaze(nx, ny);
        }
    }

    // After maze generation, place random numbers (1 or 2) on every second cell along the outer walls
    placeNumbersOnOuterWalls();

    // For debugging, log the maze
}

function placeNumbersOnOuterWalls() {
    // Top and bottom walls
    for (let x = 1; x < width - 1; x++) {
        if (prison[0][x] === '#') {
            if (x % 2 === 0) {
                prison[0][x] = Math.random() < 0.5 ? '1' : '2';  // Top row
            }
        }
        if (prison[height - 1][x] === '#') {
            if (x % 2 === 0) {
                prison[height - 1][x] = Math.random() < 0.5 ? '1' : '2';  // Bottom row
            }
        }
    }

    // Left and right walls
    for (let y = 1; y < height - 1; y++) {
        if (prison[y][0] === '#') {
            if (y % 2 === 0) {
                prison[y][0] = Math.random() < 0.5 ? '1' : '2';  // Left column
            }
        }
        if (prison[y][width - 1] === '#') {
            if (y % 2 === 0) {
                prison[y][width - 1] = Math.random() < 0.5 ? '1' : '2';  // Right column
            }
        }
    }
}

function placeItems() {
    const items = [
        { symbol: 'k', count: 5 }, // 5 keys
        { symbol: 'm', count: 1 }, // 1 map
        { symbol: 'c', count: 5 }, // 5 corpse
        { symbol: 'e', count: 1 }, // 1 exit
        { symbol: 'x', count: 3 }, // 3 enemies
        { symbol: 't', count: 3 }  // 3 traders
    ];

    // Iterate over each item and place it on a random cell that's not a wall or empty
    items.forEach(item => {
        let placed = 0;
        while (placed < item.count) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);

            // Only place the item if the cell is not a wall ('#'), not empty (' '), and not already occupied by '1', '2', or others
            if (prison[y][x] !== '#' && prison[y][x] !== 'k' && prison[y][x] !== 'm' && prison[y][x] !== 'c' && prison[y][x] !== 'e' && prison[y][x] !== '2p') {
                prison[y][x] = item.symbol; // Place the item in the selected cell
                placed++;
            }
        }
    });
}

// Function to place the player at a random '2' cell
function placePlayerAtRandomTwo() {
    let twos = [];
    for (let y = 0; y < prison.length; y++) {
        for (let x = 0; x < prison[y].length; x++) {
            if (prison[y][x] === '2') {
                twos.push({ x, y });
            }
        }
    }

    // Place the player randomly on one of the '2' cells
    const randomIndex = Math.floor(Math.random() * twos.length);
    const startCell = twos[randomIndex];
    playerPosX = startCell.x;
    playerPosY = startCell.y;

    // Mark the player on the '2' cell
    prison[playerPosY][playerPosX] = '2p';
}


function updateMapDisplay() {
    const mapElement = document.getElementById('mappingStuff');
    if (mapElement) {
        mapElement.innerHTML = `<b><pre>${prison.map(row => row.join('')).join('\n')}</pre></b>`;
    }
}


function movePlayer(direction, outputElement) { 
    let newX = playerPosX;
    let newY = playerPosY;

    if (direction === 'forward') newY--;  
    if (direction === 'right') newX++;    
    if (direction === 'left') newX--;     
    if (direction === 'down') newY++;     

    if (prison[newY] && prison[newY][newX] !== '#') {  // Check if the move is valid

        let message = `<br>You move ${direction}.<br>`; // Default movement message

        if (prison[playerPosY][playerPosX] === 't') {
            prison[playerPosY][playerPosX] = ' ';  // Remove trader when leaving
            message += "<br>The trader scuttles away into the darkness, and along with them, their wares too..."
        }

        if (prison[playerPosY][playerPosX] === 'x'){
            prison[playerPosY][playerPosX] = ' ';
            message += "<br>The enemy keels over, bloodied, and dead. In your fight, the enemy's items break, leaving nothing useful for you to take."
        }

        playerPosX = newX;
        playerPosY = newY;

        const cell = prison[playerPosY][playerPosX];

        if (cell === 'k') {
            message += "<br>Something glints in the flames and lamplight in front of you, it looks to be a key.";
        } else if (cell === 'm') {
            message += "<br>On the floor just in front of you, lies a charred map - still smoldering. It is just about readable.";
        } else if (cell === 'c') {
            message += "<br>A corpse lies here, its decaying form twisted in an unnatural way. Whoever it was appears to have died in a gruesome way.";
        } else if (cell === 'e') {
            message += "<br>Just in front of you, a staircase stretches down for a while, it looks to be the only way down. The door showcases a golden lock, a strangely misformed so as to not allow regular keys."
        } else if (cell === 'x'){
            message += "<br>A person stands here, and stares at you with an air of aggression. They say nothing, and start to approach you."
            saveGameState();
            setTimeout(() => changePage('combatPage'), 1000)
        } else if (cell === 't'){
            message += "<br>A trader stands in front of you, showcasing their wares. Do you want to browse them?"
        }

        // Checking surrounding cells
        const directions = [
            { dir: "North", y: playerPosY - 1, x: playerPosX },  // North
            { dir: "South", y: playerPosY + 1, x: playerPosX },  // South
            { dir: "East", y: playerPosY, x: playerPosX + 1 },  // East
            { dir: "West", y: playerPosY, x: playerPosX - 1 }   // West
        ];

        directions.forEach(({ dir, y, x }) => {
            if (prison[y] && prison[y][x] !== undefined) {
                let position = prison[y][x];
                if (position === ' ') {
                    message += `<br> To the ${dir}, the hallway goes on.`;
                } else if (position === '1') {
                    message += `<br> To the ${dir}, lies an open cell. It appears empty, but go inside and you might find something?`;
                } else if (position === '2') {
                    message += `<br> To the ${dir}, a locked cell appears. You can use a Silver key to open it, but it seems there are many, and there are only so many keys on this floor.`;
                } else if (position === 'c') {
                    message += `<br> To the ${dir}, a body lies on the floor, twisted and very clearly dead.`;
                } else if (position === 'k') {
                    message += `<br> To the ${dir}, there appears to be something hanging on the wall?`;
                } else if (position === 'm') {
                    message += `<br> To the ${dir}, a piece of paper with black scribbles lies scrunched up on the floor.`;
                }
            }
        });


        // Append movement and item messages to `outputElement`
        outputElement.innerHTML = message;

        updateMapDisplay();

        return true;
    }

    return false;
}




function playerPickup(item){

    const cell = prison[playerPosY][playerPosX];

    if (cell === 'k' && item === 'key') {
        inventory.push('Silver Key');
        prison[playerPosY][playerPosX] = ' ';  // Remove item from the map
        return true;
    } else if (cell === 'm' && item === 'map') {
        inventory.push('Map');
        prison[playerPosY][playerPosX] = ' ';
        return true;
    }

    return false; // If no item was picked up
}


// ============== CORPSE STUFF ==============================================
function generateCorpseInventory() {
    let possibleItems = ["Sword", "Armour", "Golden Key", "Silver Key", "Health Potion"];
    let corpseInventory = [];

    // Randomly decide which items the corpse has
    if (Math.random() < 0.3){
        corpseInventory.push('Sword');  // 30% chance
    }
    if (Math.random() < 0.4){
        corpseInventory.push('Armour'); // 40% chance
    }
    if (Math.random() < 0.2){
        corpseInventory.push('Golden Key'); // 20% chance
    }
    if (Math.random() < 0.5){
        corpseInventory.push('Key');  // 50% chance
    }
    if (Math.random() < 0.4){
        corpseInventory.push('Health Potion')
    }

    // Random number of coins (0-30)
    let coins = Math.floor(Math.random() * 31);

    return { items: corpseInventory, coins: coins };
}

function getCorpseInventory(position) {
    if (!corpseInventories[position]) {  
        corpseInventories[position] = generateCorpseInventory();
    }
    return corpseInventories[position];
}



function corpseSearch(outputElement, takeAll, itemToTake) {
    const position = `${playerPosX},${playerPosY}`;  // Unique identifier for the corpse
    let corpseInventory = getCorpseInventory(position);

    let message = "You kneel down and start searching.";
    
    // If taking all items
    if (takeAll) {
        if (corpseInventory.items.length === 0 && corpseInventory.coins === 0) {
            message += " But you find nothing of value.";
        } else {
            // Add all items to inventory
            inventory.push(...corpseInventory.items);

            message += ` You take everything. You find: ${corpseInventory.items.join(', ')}.`;
            if (corpseInventory.coins > 0) {
                message += ` You also find ${corpseInventory.coins} Coins.`;
                playerCoins += corpseInventory.coins;
            }
        }

        // Empty the corpse's inventory
        corpseInventories[position] = { items: [], coins: 0 };
        prison[playerPosY][playerPosX] = ' ';  // Remove corpse from the map
    } 
    // If taking one specific item
    else if (itemToTake) {
        // Convert itemToTake to lowercase for case-insensitive comparison
        const itemToTakeLower = itemToTake.toLowerCase();
        
        // Check for a match in the corpse's inventory (case insensitive)
        const foundItem = corpseInventory.items.find(item => item.toLowerCase() === itemToTakeLower);
        
        if (foundItem) {
            // Item is found, remove from corpse and add to player inventory
            inventory.push(foundItem);
            message = `You take the ${foundItem}.`;

            // Remove the item from the corpse
            const index = corpseInventory.items.indexOf(foundItem);
            corpseInventory.items.splice(index, 1);
        } else {
            message = `The corpse does not have a ${itemToTake}.`;
        }

        playerCoins += corpseInventory.coins;
    }
    else {
        if (corpseInventory.items.length === 0 && corpseInventory.coins === 0) {
            message += " But you find nothing of value.";
        } else {
            message += ` You find: ${corpseInventory.items.join(', ')}.`;
            if (corpseInventory.coins > 0) {
                message += ` You also find ${corpseInventory.coins} Coins.`;
            }
        }

        playerCoins += corpseInventory.coins;
    }

    outputElement.innerHTML = message;
    return true;
}


// ============================ ITEMS, COMBAT, AND EVERYTTHING ELSE =========================================
function itemUsage(usedItem, item, outputElement) {
    const cell = prison[playerPosY][playerPosX];
    let message = `You take the ${usedItem} from your pocket and use it.`;
    let formattedItem = item.toLowerCase().trim(); // Normalize input
    let inventoryItem = inventory.find(i => i.toLowerCase().includes(formattedItem)); // Find correct item
    let itemIndex = inventory.indexOf(inventoryItem);




    if (item === 'Silver Key') {
        if (cell === '2') {
            if (itemIndex !== -1) inventory.splice(itemIndex, 1); // Remove the Silver Key
            prison[playerPosY][playerPosX] = '1';
            message += ' The cell door creaks open, allowing you entry.';
        } else {
            message += ' ... There is nothing to unlock. Are you lost?';
        }

        outputElement.innerHTML = message;
        return true;

    } else if (item === 'Golden Key') { 
        if (cell === 'e') {
            if (itemIndex !== -1) inventory.splice(itemIndex, 1); // Remove the Golden Key
    
            message += ' The doorway opens with a creaking and a groan, the doorknob still warm to the touch. You walk through into the dark stairway, and descend down to the next level...';
            message += '<br> ================== NEW LEVEL ===================='
            message += '<br> As you enter the new level, you can hear the distant sounds of the dragons above get closer... followed by a loud crashing sound. The floor above seems to have collapsed inwards against the attacks of the dragons. Fire licks your skin as you back away from the staircase, now covered in rubble.';

            // Generate a new maze if the player is above level -1
            if (level > -1) {
                // Correctly initialise a new empty prison maze
                prison = Array.from({ length: height }, () => Array(width).fill('#'));

                // Random starting point for the player
                let startX = Math.floor(Math.random() * (width - 2)) + 1;
                let startY = Math.floor(Math.random() * (height - 2)) + 1;

                // Generate the maze starting from a random position
                generateMaze(startX, startY);

                // Place the player at a random valid location
                placePlayerAtRandomTwo();

                // Place items on the new maze level
                placeItems();

                // Decrease the level count after each descent
                level--;

                // Specific message when the player reaches the basement or other levels
                if (level == 0) {
                    message += "<br>The obvious exit on this level seems to be blocked by rubble and an endless spray of fire from a dragon's lungs... I wouldn't advise that way anyway, making a getaway from this direction would be almost certain death.";
                } else if (level == -1) {
                    message += "<br>Now, you're in the basement. You need to find a way out through some tunnels on this level, and hopefully sneak away...";
                }
            } else {
                message += "<br> You find, in the wall next to you, an opening. It seems like someone made this for emergencies. You go through it, and after a long and arduous journey of crawling on your front, you see the light at the end of the tunnel. You have escaped! You crawl through, and run off into the wilderness, after seeing the prison behind you collapse."
                message += "<br> ============================ GAME END ==============================="
            }

            // Grant player experience for moving to the new level
            playerExperience += 1000;

            // Update the map display after the maze has been regenerated
            updateMapDisplay();

            // Display the new message to the player
            outputElement.innerHTML = message;
            return true;
        } else {
            message += ' You are not close enough to the exit to use your key. It doesn’t seem to work on normal cells either.';
        }
    } else if (item === 'Map') {
        saveGameState();
        changePage('mapPage');
        return true;

    } else if (inventoryItem && formattedItem === "health potion") {
        if (itemIndex === -1) {
            message = "You do not have a Health Potion.";
        } else if (playerHealth < 20) {
            inventory.splice(itemIndex, 1); // Remove potion

            if (playerHealth <= 15) {
                playerHealth += 5;
                message += ` You use your health potion and gain 5 health. Your health is now ${playerHealth}.`;
            } else {
                playerHealth = 20;
                message += " You use your health potion and now have maximum health.";
            }

        } else {
            message += "You cannot use this, your health is already at the maximum.";
        }

        outputElement.innerHTML = message;
        return true;
    }

    return false;
}


function invSystem(outputElement) {
    let message = "";

    if (inventory.length === 0) {
        message += "Your inventory is empty.";
    } else {
        message += `Inventory: ${inventory.join(", ")}`;
    }

    outputElement.innerHTML = message;
}

function enemyInvSystem() {
    let possibleItems = ["sword", "health potion", "none"];
    let enemyInventory = [];

    // randomly decide which items the enemy has
    possibleItems.forEach(item => {
        if (Math.random() < 0.5) {  // 50% chance to have any item
            enemyInventory.push(item);
        }
    });


    return enemyInventory;
}

function traderInvSystem() {
    let possibleItems = ["Sword", "Armour", "Health Potion", "Golden Key", "Silver Key"];
    let prices = { "Sword": 10, "Armour": 15, "Health Potion": 5, "Golden Key": 50, "Silver Key": 8 };
    traderInventory = [];

    // 50% chance for each item to appear in trader inventory
    possibleItems.forEach(item => {
        if (Math.random() < 0.5) { 
            traderInventory.push({ item, price: prices[item] });
        }
    });
}


function playerCombat(outputElement, combatItem, combatTurns, combatTurnsOutput) {
    let playerDamage = Math.floor(Math.random() * 4) + 1; // 1 to 4 damage
    let enemyDamage = Math.floor(Math.random() * 4) + 1; // 1 to 4 damage
    let message = "";
    let enemyMessage = "";
    let enemyArmour = false;


    // Player Turn (always happens first)
    message += `It is turn ${combatTurnsOutput}`;
    message += "<br><br> ======= PLAYER's TURN =======";
    combatTurnsOutput++;

    if (combatItem === "sword") {
        let swordIndex = inventory.indexOf("Sword");
        if (swordIndex !== -1) inventory.splice(swordIndex, 1); // Remove sword

        playerDamage += 2;
        message += "<br>You swing your sword and increase your attack damage by 2.";
        message += `<br>You deal ${playerDamage} damage, and your sword breaks.`;

    } else if (combatItem === "health potion") {
        let potionIndex = inventory.indexOf("Health Potion");
        if (potionIndex !== -1) inventory.splice(potionIndex, 1); // Remove potion

        if (playerHealth <= 15) {
            playerHealth += 5;
        } else {
            playerHealth = 20;
        }

        playerDamage = 0;

        message += `<br>You use a health potion and gain 5 health. Your health is now ${playerHealth}.`;
    } else if (combatItem === "none") {
        message += "<br>You swing your fists in a flurry at the enemy.";
        message += `<br>You deal ${playerDamage} damage, and your fists begin to bruise.`;
    }

    // Apply damage to the enemy (using global variable)
    enemyHealth -= playerDamage;
    if(playerDamage > 0){
        message += `<br>Your enemy has ${enemyHealth} health left.`;
    } else {
        message += "<br>You deal no damage this turn.";
    }

    if (enemyArmour) {
        playerDamage = 0;
        message += "<br>The enemy's armour absorbs your attack! You deal no damage.";
    }


    // Check if enemy is dead
    if (enemyHealth <= 0) {
        message += "<br>You have killed the enemy!";
        outputElement.innerHTML = message;
        setTimeout(() => changePage('interactionPage'), 2000);
        playerExperience += 100;
        loadGameState();
        return;
    }

    // Update turn count globally
    combatTurns++;

    outputElement.innerHTML += message;

    // Delay for enemy attack (to make combat smoother)
    setTimeout(() => {
        enemyMessage += "<br><br> ======= ENEMY'S TURN =======";
        enemyMessage += "<br>The enemy is attacking!";

        let actionChance = Math.random();
        let enemyAction = "none";

        if (actionChance < 0.15 && enemyInventory.includes("sword")) {
            enemyAction = "sword";
        } else if (actionChance < 0.30 && enemyInventory.includes("armour")) {
            enemyAction = "armour";
        } else if (actionChance < 0.45 && enemyInventory.includes("health potion")) {
            enemyAction = "health potion";
        }

        // Apply the enemy's action
        if (enemyAction === "sword") {
            let index = enemyInventory.indexOf("sword");
            if (index !== -1) {
                enemyInventory.splice(index, 1); // removes sword
            }
            enemyDamage += 2;
            enemyMessage += "<br>The enemy swings their sword and increases their attack damage by 2!";
        } else if (enemyAction === "health potion") {
            let index = enemyInventory.indexOf("health potion");
            if (index !== -1) {
                enemyInventory.splice(index, 1); // remove potion
            }
            enemyHealth += 4;
            enemyMessage += `<br>The enemy uses a health potion! Their health is now ${enemyHealth}.`;
        } else if (enemyAction === "armour"){
            let index = enemyInventory.indexOf("armour"); // remove armour
            if (index !== -1){
                enemyInventory.splice(index, 1);
            }
            enemyArmour = true;
            enemyMessage += "<br>The enemy braces themselves with their armour, preparing for the next attack!";

        } else {
            enemyMessage += "<br>The enemy attacks normally.";
        }

        // If enemy didn't use armour, they attack
        if (enemyAction !== "armour" || enemyAction !== "health potion") {
            if (combatItem !== "armour") {
                playerHealth -= enemyDamage;
                enemyMessage += `<br>The enemy hits you for ${enemyDamage} damage. Your health is now ${playerHealth}.`;
            } else {
                enemyMessage += '<br>The enemy swings at you, but your armour absorbs the attack! Your health remains the same.'
            }
        }

        // Check if player is dead
        if (playerHealth <= 0) {
            enemyMessage += "<br>You died!";
            outputElement.innerHTML = message;
            setTimeout(() => changePage('home'), 2000);
            localStorage.removeItem("gameState");
            //mazeGenerated = false;
            return;
        }

        outputElement.innerHTML += enemyMessage;
    }, 1000); // 1 second delay before the enemy attacks

}



function traderItems(outputElement) {
    let message = "Ahhhh, hello fellow prisoner... Please browse my wares...<br><br>";

    if (traderInventory.length === 0) {
        message += "Unfortunately, I have nothing to sell right now.";
    } else {
        traderInventory.forEach(obj => {
            message += `- ${obj.item}: ${obj.price} gold<br>`;
        });
        message += "<br>Type 'buy [item]' to purchase something.";
    }

    outputElement.innerHTML = message;

    return true;
}




// PAGES + INPUTS
function changePage(page) {
    switch (page) {
        case 'home':
            contentPage.innerHTML = ` 
                <div class="container">
                    <img src="./Images/ASCII-art.png" class="mainImage" />
            
                    <div class="main-text">
                        <div class="line">
                            <span class="large-text">ESCAPE</span>
                            <span class="small-text">FROM</span>
                            <span class="large-text">PRISON</span>
                        </div>
                        <div class="darkheart">DARKHEART</div>
                    </div>

                    <!-- Load Game Modal -->
                    <div id="loadGameModal" class="modal">
                        <div class="modal-content">
                            <h2>Load Saved Game?</h2>
                            <p id="savedGameMessage"></p>
                            <div class="modal-buttons">
                                <button id="loadButton">Load Saved Game</button>
                                <button id="newGameButton">Start New Game</button>
                            </div>
                        </div>
                    </div>

                    <!-- Username Input Modal -->
                    <div id="usernameModal" class="modal">
                        <div class="modal-content">
                            <h2>Enter Your Username</h2>
                            <input type="text" id="usernameInput" placeholder="Enter your username" />
                            <div class="modal-buttons">
                                <button id="startGameButton">Start Game</button>
                            </div>
                        </div>
                    </div>

                    <div class="menu">
                        <button id="playButton">Play</button>
                        <button id="optionsButton">Options</button>
                        <button onclick="self.close()">Exit</button>
                    </div>
                </div>
            `;


            document.getElementById('playButton').addEventListener('click', () => {
                checkSavedGame();
            });

            document.getElementById('optionsButton').addEventListener('click', () => {
                changePage('optionsPage');
            });

            function checkSavedGame() {
                const savedGame = localStorage.getItem("gameState");
                const loadGameModal = document.getElementById('loadGameModal');
                const savedGameMessage = document.getElementById('savedGameMessage');

                if (savedGame) {
                    savedGameMessage.innerHTML = "A saved game was found. Would you like to load it?";
                    loadGameModal.style.display = "flex";

                    document.getElementById('loadButton').onclick = function () {
                        loadGameState();
                        changePage('interactionPage');
                    };

                    document.getElementById('newGameButton').onclick = function () {
                        localStorage.removeItem("gameState");
                        openUsernameModal();
                    };
                } else {
                    openUsernameModal();
                }
            }

            function openUsernameModal() {
                const usernameModal = document.getElementById('usernameModal');
                const usernameInput = document.getElementById('usernameInput');
                const startGameButton = document.getElementById('startGameButton');

                usernameModal.style.display = "flex";

                startGameButton.onclick = function () {
                    username = usernameInput.value.trim();
                    if (username) {
                        localStorage.setItem("playerUsername", username);
                        startNewGame(); // Reset everything and start fresh
                        changePage('interactionPage');
                    } else {
                        alert("Please enter a valid username.");
                    }
                };

                usernameModal.addEventListener('click', (event) => {
                    if (event.target === usernameModal) {
                        usernameModal.style.display = 'none';
                    }
                });
            }

            // Close modal if clicked outside
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });

            break;


        case 'optionsPage':
            let selectedColour = 'lawngreen';
            const colours = ['lawngreen', 'green', 'orange', 'cyan', 'custom'];
            const secondaryColors = { lawngreen: 'green', green: 'darkgreen', orange: 'darkorange',cyan: 'lightblue', custom: 'gray'};
            let currentColourIndex = 0;


            contentPage.innerHTML = `
                <div class="options">

                    <div>
                        <label>Page Colour:</label>
                        <button id="changeColourButton" style="color: lawngreen;">Change Colour</button>
                        <input type="text" id="colourInput" placeholder="Input Colour..."/>
                    </div>
                </div>

                <!-- Custom Alert Modal -->
                <div id="quitModal" class="modal">
                    <div class="modal-content">
                        <p>Are you sure you want to leave?</p>
                        <div class="modal-buttons">
                            <button id="yesButton">Yes</button>
                            <button id="noButton">No</button>
                        </div>
                    </div>
                </div>

                <div class="menu">
                    <button id="confirmButton">Confirm</button>
                    <button id="backwards">Main Menu</button>
                </div>
            `;

            let colourInputField = document.getElementById("colourInput")
            colourInputField.style.display = 'none';

            const quitModal = document.getElementById('quitModal');
            const yesButton = document.getElementById('yesButton');
            const noButton = document.getElementById('noButton');
            const changeColourButton = document.getElementById('changeColourButton');
            const confirmButton = document.getElementById('confirmButton');

            // Cycle through colors on "Change Colour" button click
            changeColourButton.addEventListener('click', () => {
                currentColourIndex = (currentColourIndex + 1) % colours.length; // Cycle to the next color
                selectedColour = colours[currentColourIndex]; // Update selected color
                changeColourButton.style.color = selectedColour; // Update button color
                changeColourButton.textContent = `Change Colour (${selectedColour})`; // Update button text


                // Show or hide the input box based on the selected color
                if (selectedColour === 'custom') {
                    colourInputField.style.display = 'block'; // Show input box
                    colourInputField.focus(); // Focus on the input field
                } else {
                    colourInputField.style.display = 'none'; // Hide input box
                }
            });

            // Handle custom color input
            colourInputField.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    selectedColour = colourInputField.value; // Update selected color with custom input
                    changeColourButton.style.color = selectedColour; // Update button color
                    changeColourButton.textContent = `Change Colour (${selectedColour})`; // Update button text
                    colourInputField.style.display = 'none'; // Hide input box after selection
                }
            });



            // Apply selected color globally on "Confirm" button click
            confirmButton.addEventListener('click', () => {
                document.documentElement.style.setProperty('--primary-color', selectedColour); // Update primary color

                const secondaryColour = secondaryColors[selectedColour] || selectedColour; // Fallback for custom colors
                document.documentElement.style.setProperty('--secondary-colour', secondaryColour); // Update secondary color
            });

            // Show modal when "Main Menu" button is clicked
            document.getElementById('backwards').addEventListener('click', () => {
                quitModal.style.display = 'flex';
            });

            // Close modal if "No" button is clicked
            noButton.addEventListener('click', () => {
                quitModal.style.display = 'none';
            });

            // Redirect to main menu if "Yes" button is clicked
            yesButton.addEventListener('click', () => {
                changePage('home'); // Your function to go back to the main menu
            });

            // Close modal if clicked outside the modal content
            quitModal.addEventListener('click', (event) => {
                if (event.target === quitModal) {
                    quitModal.style.display = 'none';
                }
            });

            break;

        case 'interactionPage':
            contentPage.innerHTML = `

                <div class="stats-display">
                    <div id="playerHealthDisplay"></div>
                    <div id="playerUsername"></div>
                    <div id="playerExperienceOutput"></div>
                    <div id="levelOutput"></div>
                    <div id="timePlaying"></div>
                </div>

                <div class="outputs-container">

                    <div class="outputs" id="outputsContainer">
                        <p id='input1'>Start game</p>
                        <p id='output1'>Before you lies your cell door, seemingly unlocked. In front of the door, just within your reach, is a stache of items - a sword, and a couple of health potions - maybe dropped by a fleeing guard? Beyond that, you can see a maze of passageways and corridors, confusingly laid out that seem to stretch on forever. You take the stache and venture forth. What do you do?</p>
                    </div>
                </div>

                <input type="text" id="userInput" placeholder="Input Action..."/>

                <div class="menu">
                    <button id="selected">Interaction Menu</button>
                    <button id="invButton" onclick="saveGameState()"> Inventory</button>
                    <button id="helpButton" onclick="saveGameState()"> Help</button>
                    <button id="backwards" onclick="saveGameState()"> Main Menu</button>
                    <button onclick="self.close(); saveGameState()"> Exit</button>
                </div>

                <div id="quitModal" class="modal">
                    <div class="modal-content">
                        <p>Are you sure you want to leave?</p>
                        <div class="modal-buttons">
                            <button id="yesButton">Yes</button>
                            <button id="noButton">No</button>
                        </div>
                    </div>
                </div>
            `;

            initialiseGame();

            const quitModal1 = document.getElementById('quitModal');
            const yesButton1 = document.getElementById('yesButton');
            const noButton1 = document.getElementById('noButton');
            const outputsContainer = document.getElementById('outputsContainer');
            const inputField = document.getElementById('userInput');

            // MAIN BUTTONS
            document.getElementById('invButton').addEventListener('click', () => {
                changePage('invPage');
            });
            document.getElementById('helpButton').addEventListener('click', () => {
                changePage('helpPage');
            });

            // Show modal when "Main Menu" button is clicked
            document.getElementById('backwards').addEventListener('click', () => {
                quitModal1.style.display = 'flex';
            });

            // Close modal if "No" button is clicked
            noButton1.addEventListener('click', () => {
                quitModal1.style.display = 'none';
            });

            // Redirect to main menu if "Yes" button is clicked
            yesButton1.addEventListener('click', () => {
                changePage('home'); // Your function to go back to the main menu
            });

            // Close modal if clicked outside the modal content
            quitModal1.addEventListener('click', (event) => {
                if (event.target === quitModal1) {
                    quitModal1.style.display = 'none';
                }
            });


            // load everything before user input
            function loadSavedHistory() {
                const savedHistory = JSON.parse(localStorage.getItem("interactionHistory"));
                if (savedHistory) {
                    savedHistory.inputs.forEach(input => {
                        const inputElement = document.createElement('p');
                        inputElement.innerHTML = `>> ${input}`;
                        inputElement.classList.add('input-message', 'recent');
                        outputsContainer.appendChild(inputElement);
                    });

                    savedHistory.outputs.forEach(output => {
                        const outputElement = document.createElement('p');
                        outputElement.innerHTML = output;
                        outputsContainer.appendChild(outputElement);
                    });
                }
            }

            loadGameState();

            // sets after the game is loaded
            document.getElementById('playerHealthDisplay').innerHTML = 'Health: ' + playerHealth
            document.getElementById('playerUsername').innerHTML = 'Username: ' + username
            document.getElementById('playerExperienceOutput').innerHTML = playerExperience + ' Exp'
            document.getElementById('levelOutput').innerHTML = 'Level: ' + level
            document.getElementById('timePlaying').innerHTML = elapsedMinutes + ' Minutes Played'

            // Handle user input
            userInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter" && userInput.value.trim() !== "") {
                    const inputElement = document.createElement('p');
                    inputElement.innerHTML = `>> ${userInput.value}`;
                    inputElement.classList.add('input-message', 'recent');

                    const outputElement = document.createElement('p');
                    const userCommand = userInput.value.toLowerCase().trim();

                    let moved = false;
                    let itemPickup = false;
                    let itemUsed = false;
                    let searched = false;
                    let takeAll = false;
                    let takeOneItem = false;
                    
                    let traderBrowsing = false;
                    let traderStuff = false;

                    itemHas = true;

                    let direction = '';
                    let pickedUp = '';
                    let usedItem = '';
                    let search = '';
                    let itemToTake = '';

                    // Handle movement commands
                    if (userCommand.includes('forward') || userCommand.includes('up') || userCommand.includes('north')) {
                        direction = 'forward';
                    } else if (userCommand.includes('right') || userCommand.includes('east')) {
                        direction = 'right';
                    } else if (userCommand.includes('left') || userCommand.includes('west')) {
                        direction = 'left';
                    } else if (userCommand.includes('down') || userCommand.includes('south')) {
                        direction = 'down';
                    }

                    // Handle searching commands
                    else if (userCommand.includes('search') || userCommand.includes('investigate') || userCommand.includes('explore')) {
                        if (userCommand.includes('corpse')) {
                            search = 'corpse';
                            corpseSearched = true; // Mark that the player has searched
                        }
                    }

                    // Handle pickup commands
                    else if (userCommand.includes('pickup') || userCommand.includes('get') || userCommand.includes('collect') || userCommand.includes('pick up') || userCommand.includes('grab') || userCommand.includes('take')) {
                        if (userCommand.includes('key')) {
                            pickedUp = 'key';
                        } else if (userCommand.includes('map')) {
                            pickedUp = 'map';
                        } else if (userCommand.includes('take ') || userCommand.includes('grab ')) {
                            itemToTake = userCommand.replace("take ", "").replace("grab ", "").trim();  // Extract the item name after "take"
                            takeOneItem = true;
                        }
                    }



                    // Handle "take all" command separately
                    if (userCommand.includes("take all")) {
                        if (corpseSearched) {
                            takeAll = true;
                        } else {
                            outputElement.innerHTML = "You haven't searched anything to take!";
                            outputsContainer.appendChild(outputElement);
                            userInput.value = '';
                            return; // Stop execution
                        }
                    }

                    // Handle item usage commands
                    else if (userCommand.includes('use')) {
                        if (userCommand.includes('key')) {
                            if (userCommand.includes('golden key') && (inventory.includes('Golden Key') || inventory.includes('golden key'))) {
                                usedItem = 'Golden Key';
                            } else if (inventory.includes('Silver Key')) {
                                usedItem = 'Silver Key';
                            } else {
                                itemHas = false;
                            }
                        } else if (userCommand.includes('map') && inventory.includes('Map')) {
                            usedItem = 'Map';
                        } else if (userCommand.includes('health potion') && inventory.includes('Health Potion')) {
                            usedItem = 'Health Potion';
                        }
                    }

                    else if (userCommand.includes('yes') || userCommand.includes('y')){
                        if(prison[playerPosY][playerPosX] == 't'){
                            traderInvSystem()
                            traderBrowsing = true;
                        }
                    }

                    // Append user input to output
                    outputsContainer.appendChild(inputElement);

                    // Execute relevant functions based on input
                    if (direction) {
                        moved = movePlayer(direction, outputElement);
                    } else if (pickedUp) {
                        itemPickup = playerPickup(pickedUp);
                    } else if (usedItem) {
                        itemUsed = itemUsage(usedItem, usedItem, outputElement);
                    } else if (search === 'corpse') {
                        searched = corpseSearch(outputElement, false, itemToTake);  // Passing itemToTake to the search
                    } else if (takeAll) {
                        corpseSearch(outputElement, true, itemToTake);  // Take all
                    } else if (takeOneItem) {
                        corpseSearch(outputElement, false, itemToTake);  // Take one specific item
                    } else if (traderBrowsing) {
                        traderStuff = traderItems(outputElement);
                    }


                    if (traderBrowsing && userCommand.startsWith("buy ")) {
                        let itemToBuy = userCommand.replace("buy ", "").trim().toLowerCase(); // Convert input to lowercase

                        let itemObject = traderInventory.find(obj => obj.item.toLowerCase() === itemToBuy); // Case-insensitive search

                        if (!itemObject) {
                            outputElement.innerHTML = "The trader doesn't have that item.";
                            outputsContainer.appendChild(outputElement);
                            return;
                        }

                        if (playerCoins >= itemObject.price) {
                            playerCoins -= itemObject.price;
                            inventory.push(itemObject.item); // Preserve original casing
                            traderInventory = traderInventory.filter(obj => obj.item.toLowerCase() !== itemToBuy); // Remove from trader
                            outputElement.innerHTML = `You bought a ${itemObject.item} for ${itemObject.price} gold. You have ${playerCoins} gold left.`;
                        } else {
                            outputElement.innerHTML = "You don't have enough money.";
                        }

                        outputsContainer.appendChild(outputElement);
                    }






                    // Handle output messages
                    

                    if (moved || searched || itemUsed || takeAll || traderStuff || itemToTake) {
                        outputsContainer.appendChild(outputElement);
                    } else if (itemPickup) {
                        outputElement.innerHTML = `You pick up the ${pickedUp}.`;
                        outputsContainer.appendChild(outputElement);
                    } else if (!itemHas) {
                        outputElement.innerHTML = 'You do not have this item in your inventory.';
                        outputsContainer.appendChild(outputElement);
                    } else {
                        outputElement.innerHTML = 'You cannot do this.';
                        outputsContainer.appendChild(outputElement);
                    }


                    userInput.value = '';

                    // saves inputs and outputs after each action
                    saveInteractionHistory(userInput.value, outputElement.innerHTML);
                }
            });

            // save after inputted but before function ends
            function saveInteractionHistory(input, output) {
                let history = JSON.parse(localStorage.getItem("interactionHistory")) || { inputs: [], outputs: [] };
                history.inputs.push(input);
                history.outputs.push(output);
                localStorage.setItem("interactionHistory", JSON.stringify(history));
            }

            // load saved inputs and outputs
            loadSavedHistory();


            break;

        case 'invPage':
            contentPage.innerHTML = `
                <div id='inventoryOutput'>
                    <p id='invSlot1'> - </p> \n
                    <p id='invSlot2'> - </p> \n
                    <p id='invSlot3'> - </p> \n
                    <p id='invSlot4'> - </p> \n
                    <p id='invSlot5'> - </p> \n
                    <p id='invSlot6'> - </p> \n
                    <p id='invSlot7'> - </p> \n
                    <p id='invSlot8'> - </p> \n
                    <p id='invSlot9'> - </p> \n
                    <p id='invSlot10'> - </p> \n
                    <p id='invSlot11'> - </p> \n
                    <p id='invSlot12'> - </p> \n
                    <p id='invSlot13'> - </p> \n
                    <p id='invSlot14'> - </p> \n
                    <p id='invSlot15'> - </p> \n
                    <p id='invSlot16'> - </p> \n
                    <p id='invSlot17'> - </p> \n
                    <p id='invSlot18'> - </p> \n
                    <p id='invSlot19'> - </p> \n
                    <p id='invSlot20'> - </p> \n \n

                    <p id='coinStuff'> Coins: </p>
                </div>
                <div class="menu">
                    <button id="interactionMenu">Interaction Menu</button>
                    <button id="selected" onclick="saveGameState()"> Inventory</button>
                    <button id="helpButton" onclick="saveGameState()"> Help</button>
                    <button id="backwards" onclick="saveGameState()"> Main Menu</button>
                    <button onclick="self.close(); saveGameState()"> Exit</button>
                </div>
            `;

            for (let i = 0; i < 20; i++) {
                const item = inventory[i] ? inventory[i] : '/ / / / /'; // if slot is empty
                document.getElementById(`invSlot${i + 1}`).innerHTML = `- ${item}`; // if full
            }

            document.getElementById('coinStuff').innerHTML += playerCoins;

            document.getElementById('interactionMenu').addEventListener('click', () => {
                changePage('interactionPage');
            });
            document.getElementById('backwards').addEventListener('click', () => {
                changePage('home');
            });
            document.getElementById('helpButton').addEventListener('click', () => {
                changePage('helpPage');
            });
            break;



        case 'helpPage':
            contentPage.innerHTML = `
               
                <div class="text">
                    <div>
                        <h1> === HELP PAGE ================================ </h1>
                    </div>

                    <div>
                        <h2>BACKGROUND:</h2>
                    </div>
                    <div>
                        Until about 3 months ago, the Prison Darkheart was used to hold prisoners for any number of crimes. Arson, theft, murder, grand larceny, and more. Since then, the prison has been under
                        the siege of a dragon rebellion. It is unknown to you why a dragon siege has befell this prison specifically, given that you have been held here for the last few years with no connection
                        to the outside. Most prisoners have been evacuated by now to other prisons in other countries, and everyone else has fled. Before leaving, the guards gave you and some other prisoners some
                        basic equipment to get by: 3x health potions and 1x sword.
                    </div>
                    <div>
                        Yesterday, the dragons succeeded in their siege, breaking down the prison and causing it to be abandoned by the people who once protected it. The only people that are left in here are some
                        unfortunare souls that have been under the misfortune to not be evactuated in time, and some dragons who have made it inside the walls. Your job is to escape the prison, and earn your
                        freedom.
                        <p></p>
                        <p></p>
                    </div>

                    <div>
                        <h2>CONTROLS:</h2>
                    </div>
                    <div>
                        <p> You can say whatever you want, as long as the text contains one of these keywords, it should work. Using multiple in one command will only use the first one, and directions are based on absolute north (the top of the map). </p>
                        <p>Forward - Moves one cell forwards</p>
                        <p>Left - Moves one cell left</p>
                        <p>Right - Moves one cell right</p>
                        <p>Backwards - Moves one cell backwards</p> 
                        <p>Explore / Look / See / Investigate - Investigate the cell you are in</p>
                        <p>Take / Grab / Get / Pick up - Take an item in the cell you are in, please specify the item you want to take</p>
                        <p>Speak / Talk / Say - Talk to an NPC</p>
                        <p>Attack - Fight an enemy</p>
                        <p>Use - Use an item in your inventory, please specify the item you want to use</p>
                    </div>
                </div>



                <div class="menu">
                    <button id="interactionMenu">Interaction Menu</button>
                    <button id="invButton" onclick="saveGameState()"> Inventory</button>
                    <button id="selected" onclick="saveGameState()"> Help</button>
                    <button id="backwards" onclick="saveGameState()"> Main Menu</button>
                    <button onclick="self.close(); saveGameState()"> Exit</button>
                </div>
            `;
            document.getElementById('interactionMenu').addEventListener('click', () => {
                changePage('interactionPage');
            });
            document.getElementById('invButton').addEventListener('click', () => {
                changePage('invPage');
            });
            document.getElementById('backwards').addEventListener('click', () => {
                changePage('home');
            });

            break;

        case 'mapPage':
            contentPage.innerHTML = `

                <div id='fullMapThing'>
                    <div id='floorButtons'>
                        <button type='button' id='3rdFloor'> 3F </button>
                        <button type='button' id='2ndFloor'> 2F </button>
                        <button type='button' id='1stFloor'> 1F </button>
                        <button type='button' id='groundFloor'> G </button>
                        <button type='button' id='basement'> 1B </button>
                    </div>

                    <p id='level'>Level: 3F</p>

                    <div id = 'map'>
                        <p id='mappingStuff'></p>
                    </div>

                    <div id='key'>
                        Key: <br>
                        1 = Unlocked cell<br>       k = silver key <br>
                        2 = Locked cell<br>         m = map <br>
                                                c = corpse <br>
                        
                        <br> <br>

                        t = trader                 x = Enemy <br>
                    </div>


                    <div id="pageButtons" class="menu">
                        <button id="interactionMenu">Interaction Menu</button>
                        <button id="invButton" onclick="saveGameState()"> Inventory</button>
                        <button id="helpButton" onclick="saveGameState()"> Help</button>
                        <button id="backwards" onclick="saveGameState()"> Main Menu</button>
                        <button onclick="saveGameState(); self.close()"> Exit</button>
                    </div>
                </div>
            `;

            // formatting was wrong before, <pre> helped: https://www.w3schools.com/tags/tag_pre.asp
            document.getElementById('mappingStuff').innerHTML = `<b><pre>${prison.map(row => row.join('')).join('\n')}</pre></b>`;
            updateMapDisplay();

            document.getElementById('3rdFloor').addEventListener('click', () => {
                document.getElementById('level').innerHTML = 'Level: 3F'
            });
            document.getElementById('2ndFloor').addEventListener('click', () => {
                document.getElementById('level').innerHTML = 'Level: 2F'
            });
            document.getElementById('1stFloor').addEventListener('click', () => {
                document.getElementById('level').innerHTML = 'Level: 1F'
            });
            document.getElementById('groundFloor').addEventListener('click', () => {
                document.getElementById('level').innerHTML = 'Level: G'
            });
            document.getElementById('basement').addEventListener('click', () => {
                document.getElementById('level').innerHTML = 'Level: 1B'
            });


            document.getElementById('interactionMenu').addEventListener('click', () => {
                changePage('interactionPage');
            });
            document.getElementById('invButton').addEventListener('click', () => {
                changePage('invPage');
            });
            document.getElementById('backwards').addEventListener('click', () => {
                changePage('home');
            });
            document.getElementById('helpButton').addEventListener('click', () => {
                changePage('helpPage');
            });
            break;

        case 'combatPage':
            contentPage.innerHTML = `

                <div id="playerHealthDisplay"></div>

                <div class="outputs-container2">

                    <div class="outputs" id="outputsContainer2">
                        <p id='input2'>Start Fight</p>
                        <p id='output2'>A person stands here, and stares at you with an air of aggression. They say nothing, and start to approach you. It is your turn to attack.</p>
                    </div>
                </div>

                <input type="text" id="userInput2" placeholder="Input Action..."/>

                <div class="menu">
                    <button id="backwards"> Main Menu</button>
                    <button onclick="self.close()"> Exit</button>
                </div>

                <div id="quitModal" class="modal">
                    <div class="modal-content">
                        <p>Are you sure you want to leave?</p>
                        <div class="modal-buttons">
                            <button id="yesButton">Yes</button>
                            <button id="noButton">No</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('playerHealthDisplay').innerHTML = 'Health: ' + playerHealth

            document.getElementById('backwards').addEventListener('click', () => {
                changePage('home');
            });

            //resets after every fight
            enemyHealth = Math.floor(Math.random() * 21) + 5; 
            enemyInventory = enemyInvSystem();

            let combatTurns = 0;
            let combatTurnsOutput = 1;


            document.getElementById("userInput2").addEventListener("keydown", (event) => {
                if (event.key === "Enter" && userInput2.value.trim() !== "") {
                    const inputElement = document.createElement("p");
                    inputElement.innerHTML = `>> ${userInput2.value}`;
                    inputElement.classList.add("input-message", "recent");

                    const outputElement = document.createElement("p");
                    const userCommand = userInput2.value.toLowerCase().trim();

                    let combatItem = "";
                    let inventoryChecked = false;

                    // Handle item usage commands
                    if (userCommand.includes("use")) {
                        if (userCommand.includes("sword") && inventory.includes("Sword")) {
                            combatItem = "sword";
                        } else if (userCommand.includes("armour") && inventory.includes("Armour")) {
                            combatItem = "armour";
                        } else if (userCommand.includes("health potion") && inventory.includes("Health Potion")) {
                            combatItem = "health potion";
                        } else {
                            outputElement.innerHTML = "You don't have that item in your inventory. If you want to see your inventory, you can use [inventory].";
                            outputsContainer2.appendChild(inputElement);
                            outputsContainer2.appendChild(outputElement);
                            userInput2.value = "";
                            return;
                        }
                    } else if (userCommand.includes("attack")) {
                        combatItem = "none";
                    } else if (userCommand.includes("inventory")) {
                        inventoryChecked = true;
                    }

                    if (combatItem) {
                        playerCombat(outputElement, combatItem, combatTurns, combatTurnsOutput);
                        combatTurns++
                        if(combatTurns % 2 !== 0){
                            combatTurnsOutput++;
                        }
                    } else if(inventoryChecked){
                        invSystem(outputElement);
                    } else {
                        outputElement.innerHTML = "You cannot do this.";
                    }

                    // Append user input and output
                    outputsContainer2.appendChild(inputElement);
                    outputsContainer2.appendChild(outputElement);

                    userInput2.value = ""; // Clear input field
                }
            });

            break;
    }
}





        // NEED TIME SPENT IN GAME (OUTPUTTED IN MINUTES)
        // AND USERNAME, OUTPUTTED ABOVE THE PAGE, NEXT TO THE PLAYERHEALTH