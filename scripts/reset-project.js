#!/usr/bin/env node

/**
 * 🛠️ Project Reset Utility (2026 Edition)
 * Modernized to use ESM and Node.js native promises.
 */

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = process.cwd();
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];
const exampleDir = "app-example";
const newAppDir = "app";
const exampleDirPath = path.join(root, exampleDir);

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question(
      "Do you want to move existing files to /app-example instead of deleting them? (Y/n): "
    );
    const userInput = answer.trim().toLowerCase() || "y";

    if (userInput !== "y" && userInput !== "n") {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      return;
    }

    if (userInput === "y") {
      await fs.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      
      // Check if path exists
      try {
        await fs.access(oldDirPath);
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } catch {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /app directory created.");

    // Create index.tsx
    await fs.writeFile(path.join(newAppDirPath, "index.tsx"), indexContent);
    console.log("📄 app/index.tsx created.");

    // Create _layout.tsx
    await fs.writeFile(path.join(newAppDirPath, "_layout.tsx"), layoutContent);
    console.log("📄 app/_layout.tsx created.");

    console.log("\n✅ Project reset complete.");
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

main();
