// @capacitor/assets hardcodes a 16.7% inset on generated adaptive icon XML
// (the official "safe zone" for arbitrary launcher mask shapes), which makes
// the icon look much smaller than the source artwork. We render our logo
// with enough of its own margin to stay safe at a smaller inset, so shrink
// it here after every `npx capacitor-assets generate --android` run.
const fs = require("fs");
const path = require("path");

const TARGET_INSET = "9%";
const files = [
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
];

for (const relPath of files) {
  const filePath = path.join(__dirname, "..", relPath);
  const xml = fs.readFileSync(filePath, "utf8");
  const updated = xml.replace(/android:inset="[0-9.]+%"/g, `android:inset="${TARGET_INSET}"`);
  fs.writeFileSync(filePath, updated);
  console.log(`Updated inset to ${TARGET_INSET} in ${relPath}`);
}
