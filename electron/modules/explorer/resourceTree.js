class ResourceTree {
  buildTree(assets = []) {
    const root = { name: "Root", type: "directory", children: {} };

    for (const asset of assets) {
      let domain = asset.domain || "other";
      let pathname = "/";
      try {
        const u = new URL(asset.url);
        pathname = u.pathname;
      } catch {}

      if (!root.children[domain]) {
        root.children[domain] = {
          name: domain,
          type: "domain",
          children: {}
        };
      }

      const domainNode = root.children[domain];
      const segments = pathname.split("/").filter(Boolean);
      const filename = segments.pop() || (asset.type === "html" ? "index.html" : "resource");

      let currentDir = domainNode;
      for (const seg of segments) {
        if (!currentDir.children[seg]) {
          currentDir.children[seg] = {
            name: seg,
            type: "directory",
            children: {}
          };
        }
        currentDir = currentDir.children[seg];
      }

      currentDir.children[filename] = {
        name: filename,
        type: "file",
        asset
      };
    }

    return this.serializeNode(root);
  }

  serializeNode(node) {
    const childrenArray = [];
    if (node.children) {
      for (const [key, child] of Object.entries(node.children)) {
        childrenArray.push(this.serializeNode(child));
      }
    }
    return {
      name: node.name,
      type: node.type,
      asset: node.asset || null,
      children: childrenArray.length > 0 ? childrenArray : null
    };
  }
}

module.exports = new ResourceTree();
