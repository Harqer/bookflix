function readPackage(pkg, context) {
  // 🛡️ SECURITY HARDENING: Direct Forensic Graph Modification
  // Remove the deprecated @clerk/clerk-react peer dependency from convex
  // to definitively resolve the high-severity legacy SDK discrepancies.
  if (pkg.name === 'convex') {
    if (pkg.peerDependencies) {
      delete pkg.peerDependencies['@clerk/clerk-react'];
    }
    if (pkg.peerDependenciesMeta) {
      delete pkg.peerDependenciesMeta['@clerk/clerk-react'];
    }
    context.log('🛡️ Convex: Stripped deprecated @clerk/clerk-react peer dependency');
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
