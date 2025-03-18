const crypto = require("crypto");
const readlineSync = require("readline-sync");

function createHMAC(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function checkDiceSets(diceSets) {
  if (diceSets.length < 3) {
    return "Error: Provide at least three dice sets.";
  }
  for (const set of diceSets) {
    let values = set.split(",").map((n) => n.trim());
    if (values.length !== 6 || values.some((n) => isNaN(n))) {
      return `Error: Invalid dice set "${set}". Each set must have exactly 6 numbers.`;
    }
    
  }
  return null;
}

function rollDice(dice) {
  return dice[Math.floor(Math.random() * dice.length)];
}

function chooseDice(diceSets) {
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
    console.log("Invalid choice. Try again.");
  }
}

function startGame() {
  const args = process.argv.slice(2);
  const error = checkDiceSets(args);
  if (error) {
    console.log(error);
    process.exit(1);
  }

  console.log("Welcome to the Dice Game!");

  const secret = crypto.randomBytes(16).toString("hex");
  const computerDice = args[Math.floor(Math.random() * args.length)]
    .split(",")
    .map(Number);
  const computerRoll = rollDice(computerDice);
  const hmac = createHMAC(secret, computerRoll.toString());

  console.log(`HMAC: ${hmac}`);

  const userDice = chooseDice(args);

  console.log("Press Enter to roll your dice...");
  readlineSync.question("");
  const userRoll = rollDice(userDice);
  console.log(`You rolled: ${userRoll}`);

  console.log(`Computer rolled: ${computerRoll}`);
  console.log(`Secret: ${secret}`);

  const computedHMAC = createHMAC(secret, computerRoll.toString());
  if (computedHMAC !== hmac) {
    console.log("Error: HMAC does not match! Cheating detected.");
    process.exit(1);
  } else {
    console.log("HMAC verification passed! The game was fair.");
  }

  if (userRoll > computerRoll) console.log("You win!");
  else if (userRoll < computerRoll) console.log("Computer wins!");
  else console.log("It's a tie!");
}

startGame();
