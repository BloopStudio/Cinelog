const { withAndroidStyles } = require("@expo/config-plugins");

// Android 15+ deprecates android:statusBarColor / android:navigationBarColor
// (and the matching Window.setStatusBarColor/setNavigationBarColor APIs)
// now that edge-to-edge is enforced unconditionally — the attributes are
// no-ops on API 35+. Expo's own prebuild config still writes them (as
// transparent) into AppTheme regardless, which is exactly what trips Play
// Console's "uses deprecated APIs or parameters for edge-to-edge display"
// warning. Edge-to-edge already works without them (that's the whole point
// of it being enforced), so this just removes the two items after Expo
// adds them rather than fighting the plugin that adds them.
const DEPRECATED_THEME_ITEMS = ["android:statusBarColor", "android:navigationBarColor"];

const withoutDeprecatedSystemBarColors = (config) => {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? [];
    const appTheme = styles.find((style) => style.$.name === "AppTheme");
    if (appTheme?.item) {
      appTheme.item = appTheme.item.filter(
        (item) => !DEPRECATED_THEME_ITEMS.includes(item.$.name)
      );
    }
    return config;
  });
};

module.exports = withoutDeprecatedSystemBarColors;
