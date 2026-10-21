const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Explicitly includes AsyncStorage's SQLite database (where the local
// watchlist and the "Partager ma liste" link both live) in Android's
// backup and device-to-device transfer. Android's own defaults already
// cover this, but spelling it out means a user switching phones keeps
// everything automatically regardless of future AGP/Android default
// changes — nothing here is sensitive enough to need excluding.
const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <include domain="database" path="." />
    </cloud-backup>
    <device-transfer>
        <include domain="database" path="." />
    </device-transfer>
</data-extraction-rules>
`;

// Pre-Android 12 (API < 31) equivalent of the rules above.
const FULL_BACKUP_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <include domain="database" path="." />
</full-backup-content>
`;

function withBackupRuleFiles(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, "app/src/main/res/xml");
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, "data_extraction_rules.xml"), DATA_EXTRACTION_RULES);
      fs.writeFileSync(path.join(xmlDir, "backup_rules.xml"), FULL_BACKUP_CONTENT);
      return config;
    },
  ]);
}

function withBackupManifestAttrs(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$["android:allowBackup"] = "true";
      application.$["android:fullBackupContent"] = "@xml/backup_rules";
      application.$["android:dataExtractionRules"] = "@xml/data_extraction_rules";
    }
    return config;
  });
}

const withAndroidBackupRules = (config) => {
  config = withBackupRuleFiles(config);
  config = withBackupManifestAttrs(config);
  return config;
};

module.exports = withAndroidBackupRules;
