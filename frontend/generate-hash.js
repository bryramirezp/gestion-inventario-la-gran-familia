const bcrypt = require("bcryptjs");

async function generate() {
  const passwords = ["admin123", "admin123", "admin123"];

  for (const pw of passwords) {
    const hash = await bcrypt.hash(pw, 12);
    console.log(hash);
  }
}

generate();
