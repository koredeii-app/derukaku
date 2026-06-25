// @capacitor/assets hardcodes a 16.7% inset on generated adaptive icon XML
// (the official "safe zone" for arbitrary launcher mask shapes), which makes
// the icon look much smaller than the source artwork. We render our logo
// with enough of its own margin to stay safe at a smaller inset, so shrink
// it here after every `npx capacitor-assets generate --android` run.
//
// The foreground inset is intentionally asymmetric (smaller on top, larger on
// bottom): the logo's top spikes are thin/sparse while the bottom (checkmark +
// bold text) is visually dense, so a uniform inset makes the masked icon look
// like it sits low in the circle. Nudging the artwork up compensates for that.
const fs = require("fs");
const path = require("path");

const TARGET_INSET = "9%";
const FOREGROUND_INSET = { left: "9%", right: "9%", top: "6%", bottom: "12%" };
const files = [
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
];

for (const relPath of files) {
  const filePath = path.join(__dirname, "..", relPath);
  const xml = fs.readFileSync(filePath, "utf8");
  const updated = xml
    .replace(
      /<inset\s+android:drawable="@mipmap\/ic_launcher_background"[^/]*\/>/,
      `<inset android:drawable="@mipmap/ic_launcher_background" android:inset="${TARGET_INSET}" />`,
    )
    .replace(
      /<inset\s+android:drawable="@mipmap\/ic_launcher_foreground"[^/]*\/>/,
      `<inset\n            android:drawable="@mipmap/ic_launcher_foreground"\n            android:insetLeft="${FOREGROUND_INSET.left}"\n            android:insetRight="${FOREGROUND_INSET.right}"\n            android:insetTop="${FOREGROUND_INSET.top}"\n            android:insetBottom="${FOREGROUND_INSET.bottom}" />`,
    );
  fs.writeFileSync(filePath, updated);
  console.log(`Updated insets in ${relPath}`);
}
