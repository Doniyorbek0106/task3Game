const crypto = require("crypto");
const readline = require("readline");

function validateDice(diceList) {
  if (diceList.length < 3) {
    return "Error: You must provide at least three dice. Example: node game.js 4,5,6,7,8,9 10,11,12,13,14,15 16,17,18,19,20,4";
  }
  for (const dice of diceList) {
    const faces = dice.split(",").map((num) => num.trim());
    if (faces.length !== 6 || faces.some((face) => !face || isNaN(face))) {
      return `Error: Invalid dice format "${dice}". Each dice must have exactly 6 valid integers.`;
    }
  }
  return null;
}

function fairCoinFlip() {
  const seed = Math.floor(Math.random() * 1000000).toString();
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  console.log(`Coin flip hash: ${hash}`);
  return new Promise((resolve) => {
    readline
      .createInterface({ input: process.stdin, output: process.stdout })
      .question("Press Enter to reveal the result...", () => {
        console.log(`Seed: ${seed}`);
        resolve(parseInt(seed) % 2 === 0);
      });
  });
}

function rollDice(dice) {
  return dice[Math.floor(Math.random() * dice.length)];
}

function userChooseDice(diceList) {
  return new Promise((resolve) => {
    console.log("Select your dice:");
    diceList.forEach((dice, i) => console.log(`${i + 1}. ${dice}`));
    console.log("0. Exit");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("Your choice: ", (choice) => {
      rl.close();
      const index = parseInt(choice) - 1;
      if (choice === "0") process.exit(0);
      if (!isNaN(index) && index >= 0 && index < diceList.length) {
        resolve(diceList[index].split(",").map(Number));
      } else {
        console.log("Invalid choice. Try again.");
        resolve(userChooseDice(diceList));
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const error = validateDice(args);
  if (error) {
    console.log(error);
    process.exit(1);
  }

  console.log("Welcome to the Dice Game!");
  const userFirst = await fairCoinFlip();
  console.log(userFirst ? "You go first!" : "Computer goes first!");

  const userDice = await userChooseDice(args);
  const computerDice = args
    .filter((d) => d !== userDice.join(","))
    .map((d) => d.split(",").map(Number))[
    Math.floor(Math.random() * (args.length - 1))
  ];

  console.log(`Your dice: ${userDice}`);
  console.log(`Computer dice: ${computerDice}`);

  let userRoll, computerRoll;
  if (userFirst) {
    console.log("Press Enter to roll...");
    await new Promise((resolve) =>
      readline
        .createInterface({ input: process.stdin, output: process.stdout })
        .question("", () => resolve())
    );
    userRoll = rollDice(userDice);
    console.log(`You rolled: ${userRoll}`);
  }

  computerRoll = rollDice(computerDice);
  console.log(`Computer rolled: ${computerRoll}`);

  if (!userFirst) {
    console.log("Press Enter to roll...");
    await new Promise((resolve) =>
      readline
        .createInterface({ input: process.stdin, output: process.stdout })
        .question("", () => resolve())
    );
    userRoll = rollDice(userDice);
    console.log(`You rolled: ${userRoll}`);
  }

  if (userRoll > computerRoll) console.log("You win!");
  else if (userRoll < computerRoll) console.log("Computer wins!");
  else console.log("It's a tie!");
}

main();
