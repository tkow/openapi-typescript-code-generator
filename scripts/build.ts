import "./clean";

import { cherryPick } from "./tools/cherry-pick";
import { copyPackageSet } from "./tools/copyPackageSet";
import { generateExportsField } from "./tools/dualPackageSupport";
import { shell } from "./tools/shell";

const main = async () => {
  await Promise.all([
    shell("yarn tsc -p tsconfig.esm.json -d --emitDeclarationOnly --outDir ./lib/\\$types"),
    shell("yarn tsc -p tsconfig.cjs.json"),
    shell("yarn tsc -p tsconfig.esm.json"),
  ]);

  await cherryPick({ inputDir: "../src", cwd: "./lib", typesDir: "./$types", cjsDir: "./$cjs", esmDir: "./$esm" });

  const exportsFiled = generateExportsField("./src", {
    directory: {
      import: "./$esm",
      // require: "./$cjs", // OFFにするとwebpack 5でesmを読んでくれる
      node: "./$cjs",
      browser: "./$esm",
      default: "./$cjs",
    },
  });

  await copyPackageSet(exportsFiled);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
