// Example: ?feat=[members,academy]. Missing or malformed lists enable nothing.
const enabledFeatures = (() => {
  const value = new URLSearchParams(window.location.search).get("feat") ?? "";
  if (!/^\[[\w,\s-]*\]$/.test(value)) {
    return new Set();
  }

  return new Set(value.slice(1, -1).split(",").map((name) => name.trim()).filter(Boolean));
})();

function hasFeature(name) {
  return enabledFeatures.has(name);
}
