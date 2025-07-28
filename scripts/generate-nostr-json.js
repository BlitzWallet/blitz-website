import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// default relays, same as before
const defaultRelays = [
  "wss://relay.damus.io",
  "wss://nostr.wine.",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://eden.nostr.land",
  "wss://relay.primal.net",
];

const url = "https://handlenip5verification-6krimtymjq-uc.a.run.app";
const savedData = "https://blitz-wallet.com/.well-known/nostr.json";
async function generate() {
  try {
    const [res, nostrJSONFile] = await Promise.all([
      fetch(url, {
        headers: {
          "github-actions": process.env.GITHUB_ACTIONS_KEY,
        },
      }),
      fetch(savedData),
    ]);

    if (!res.ok || !nostrJSONFile.ok) {
      throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
    }

    const accounts = await res.json();
    const savedAccounts = await nostrJSONFile.json();
    if (!accounts.length) return;
    if (!savedAccounts) return;

    const names = savedAccounts.names;
    const relays = savedAccounts.relays;

    accounts.forEach(({ name, pubkey }) => {
      if (name && pubkey) {
        Object.keys(names).forEach((existingName) => {
          if (names[existingName] === pubkey) {
            delete names[existingName];
          }
        });

        names[name] = pubkey;
        relays[pubkey] = defaultRelays;
      }
    });

    const filePath = resolve(__dirname, "../.well-known/nostr.json");

    const dirPath = dirname(filePath);

    // Create directory with error handling
    try {
      mkdirSync(dirPath, { recursive: true });
      console.log("Directory created/exists");
    } catch (dirError) {
      console.error("Failed to create directory:", dirError);
      throw dirError;
    }

    // Write file with error handling
    try {
      writeFileSync(filePath, JSON.stringify({ names, relays }, null, 2), {
        flag: "w",
        encoding: "utf-8",
      });
      console.log("nostr.json generated");
    } catch (writeError) {
      console.error("Failed to write file:", writeError);
      throw writeError;
    }
  } catch (err) {
    console.error("Error generating nostr.json:", err);
    process.exit(1);
  }
}

generate();
