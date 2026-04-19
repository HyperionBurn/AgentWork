// ============================================================
// Merkle Proofs — Batch payment verification
// ============================================================
// Builds Merkle trees from transaction hashes and generates
// inclusion proofs. Verifies all payments in a single check.
// ============================================================

import * as crypto from "crypto";

// ── Types ────────────────────────────────────────────────────

export interface MerkleTree {
  leaves: string[];
  layers: string[][];
  root: string;
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  root: string;
  verified: boolean;
}

// ── Merkle Tree Operations ───────────────────────────────────

/**
 * Hash a leaf value using SHA-256.
 */
function hashPair(left: string, right: string): string {
  return crypto.createHash("sha256")
    .update(left + right)
    .digest("hex");
}

/**
 * Build a Merkle tree from an array of transaction hashes.
 * Returns the tree with all layers and the root hash.
 */
export function buildMerkleTree(txHashes: string[]): MerkleTree {
  if (txHashes.length === 0) {
    return { leaves: [], layers: [[]], root: "" };
  }

  // Normalize hashes
  const leaves = txHashes.map((h) => h.replace(/^MOCK_/, "").toLowerCase());

  // Pad to power of 2
  let paddedLeaves = [...leaves];
  while (paddedLeaves.length > 1 && (paddedLeaves.length & (paddedLeaves.length - 1)) !== 0) {
    paddedLeaves.push(paddedLeaves[paddedLeaves.length - 1]); // duplicate last
  }

  const layers: string[][] = [[...paddedLeaves]];
  let currentLayer = paddedLeaves;

  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = currentLayer[i + 1] || left;
      nextLayer.push(hashPair(left, right));
    }
    layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  return {
    leaves,
    layers,
    root: currentLayer[0],
  };
}

/**
 * Generate a Merkle proof for a specific leaf.
 */
export function generateProof(txHash: string, tree: MerkleTree): MerkleProof | null {
  const normalizedLeaf = txHash.replace(/^MOCK_/, "").toLowerCase();
  const leafIndex = tree.leaves.indexOf(normalizedLeaf);
  if (leafIndex === -1) return null;

  const proof: string[] = [];
  let index = leafIndex;

  for (let layerIdx = 0; layerIdx < tree.layers.length - 1; layerIdx++) {
    const layer = tree.layers[layerIdx];
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    if (siblingIndex < layer.length) {
      proof.push(layer[siblingIndex]);
    }
    index = Math.floor(index / 2);
  }

  return {
    leaf: normalizedLeaf,
    proof,
    root: tree.root,
    verified: false,
  };
}

/**
 * Verify a Merkle proof.
 */
export function verifyProof(leafProof: MerkleProof): boolean {
  let current = leafProof.leaf;

  for (const sibling of leafProof.proof) {
    // Determine order (smaller hash goes left)
    if (current < sibling) {
      current = hashPair(current, sibling);
    } else {
      current = hashPair(sibling, current);
    }
  }

  return current === leafProof.root;
}

/**
 * Verify all transactions against a Merkle root.
 */
export function verifyBatch(
  txHashes: string[],
  root: string,
): { verified: number; failed: number; total: number } {
  const tree = buildMerkleTree(txHashes);

  if (tree.root !== root) {
    return { verified: 0, failed: txHashes.length, total: txHashes.length };
  }

  let verified = 0;
  let failed = 0;

  for (const txHash of txHashes) {
    const proof = generateProof(txHash, tree);
    if (proof && verifyProof(proof)) {
      verified++;
    } else {
      failed++;
    }
  }

  return { verified, failed, total: txHashes.length };
}

/**
 * Submit a batch proof (mock on-chain submission).
 */
export function submitBatchProof(root: string): {
  txHash: string;
  root: string;
  mock: boolean;
} {
  const txHash = `MOCK_0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")}`;

  console.log(`   📝 Batch proof submitted: root=${root.slice(0, 16)}... tx=${txHash}`);

  return { txHash, root, mock: true };
}
