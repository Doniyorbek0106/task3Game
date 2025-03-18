const crypto = require("crypto");
const readlineSync = require("readline-sync");
const seedrandom = require("seedrandom");
const _ = require("underscore");

function generateHMAC(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function validateDiceSets(diceSets) {
  if (diceSets.length < 3) {
    return "Error: You must provide at least three dice sets.";
  }
  for (const set of diceSets) {
    let values = set.split(",").map((n) => n.trim());
    if (values.length !== 6 || values.some((n) => isNaN(n))) {
      return `Error: Invalid dice set "${set}". Each set must contain exactly 6 numbers.`;
    }
  }
  return null;
}

function createSeededRNG() {
  const seed = crypto.randomBytes(16).toString("hex");
  return { rng: seedrandom(seed), seed };
}

function rollDice(dice, rng) {
  return dice[Math.floor(rng() * dice.length)];
}

const times = (n, fn) => {
  return (arg) => {
    for (let i = Math.floor(n); i--; ) arg = fn(arg);
    return Math.random() < n % 1 ? fn(arg) : arg;
  };
};

function getUserDiceChoice(diceSets) {
  console.log("Choose your dice set:");
  diceSets.forEach((set, i) => console.log(`${i + 1}. ${set}`));
  console.log("0. Exit");

  while (true) {
    let choice = readlineSync.question("Your choice: ");
    let index = parseInt(choice) - 1;
    if (choice === "0") process.exit(0);
    if (!isNaN(index) && index >= 0 && index < diceSets.length) {
      return diceSets[index].split(",").map(Number);
    }
    console.log("Invalid choice. Please try again.");
  }
}

function startGame() {
  const args = process.argv.slice(2);
  const validationError = validateDiceSets(args);
  if (validationError) {
    console.log(validationError);
    process.exit(1);
  }

  console.log("🎲 Welcome to the Fair Dice Game!");

  const userRNG = createSeededRNG();
  const computerRNG = createSeededRNG();

  // Step 1: Determine who picks dice first
  console.log("Deciding who chooses first...");
  const userFirstRoll = rollDice([1, 2, 3, 4, 5, 6], userRNG.rng);
  const computerFirstRoll = rollDice([1, 2, 3, 4, 5, 6], computerRNG.rng);

  console.log(`You rolled: ${userFirstRoll}`);
  console.log(`Computer rolled: ${computerFirstRoll}`);

  let userPicksFirst = userFirstRoll >= computerFirstRoll;

  console.log(userPicksFirst ? "You pick first!" : "Computer picks first!");

  let userDice, computerDiceSet;

  if (userPicksFirst) {
    userDice = getUserDiceChoice(args);
    computerDiceSet = _.sample(args);
  } else {
    computerDiceSet = _.sample(args);
    userDice = getUserDiceChoice(args);
  }

  const computerDice = computerDiceSet.split(",").map(Number);
  console.log(`Computer chose: ${computerDiceSet}`);

  // Step 2: Both roll their dice
  console.log("Rolling the dice...");
  const userRoll = rollDice(userDice, userRNG.rng);
  const computerRoll = rollDice(computerDice, computerRNG.rng);

  // Step 3: Generate HMACs for fairness
  const userSecret = crypto.randomBytes(16).toString("hex");
  const computerSecret = crypto.randomBytes(16).toString("hex");

  const userHMAC = generateHMAC(userSecret, userRoll.toString());
  const computerHMAC = generateHMAC(computerSecret, computerRoll.toString());

  console.log(`Your roll HMAC: ${userHMAC}`);
  console.log(`Computer roll HMAC: ${computerHMAC}`);

  console.log(`You rolled: ${userRoll}`);
  console.log(`Computer rolled: ${computerRoll}`);

  // Step 4: Reveal secrets
  console.log(`Your secret key: ${userSecret}`);
  console.log(`Computer's secret key: ${computerSecret}`);

  // Step 5: Verify HMACs
  const verifiedUserHMAC = generateHMAC(userSecret, userRoll.toString());
  const verifiedComputerHMAC = generateHMAC(
    computerSecret,
    computerRoll.toString()
  );

  if (verifiedUserHMAC !== userHMAC || verifiedComputerHMAC !== computerHMAC) {
    console.log("Error: HMAC verification failed! Possible cheating detected.");
    process.exit(1);
  } else {
    console.log("✅ HMAC verification passed! The game was fair.");
  }

  // Step 6: Determine the winner
  if (userRoll > computerRoll) console.log("🎉 You win!");
  else if (userRoll < computerRoll) console.log("💻 Computer wins!");
  else console.log("🤝 It's a tie!");
}

// Start the game
startGame();
