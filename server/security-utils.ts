/**
 * BookCinema Security & Multi-tenant Utilities
 * Implements environment isolation, IAM checks, and secure asset paths.
 */

import crypto from 'crypto';

/**
 * ProvenanceTracker
 * Implements a cryptographic Chain of Custody for AI-generated assets.
 * Ensures every shot can be traced back to the specific agent and model version.
 */
export class ProvenanceTracker {
  private static SECRET = process.env.PROVENANCE_SECRET || 'bookcinema-dev-secret';

  static createManifest(agent: string, model: string, inputHash: string, output: any): string {
    const timestamp = new Date().toISOString();
    const data = JSON.stringify({ agent, model, inputHash, output, timestamp });
    const signature = crypto.createHmac('sha256', this.SECRET).update(data).digest('hex');
    
    return JSON.stringify({
      manifest: JSON.parse(data),
      signature,
      version: '1.0'
    });
  }

  static verifyManifest(manifestJson: string): boolean {
    try {
      const { manifest, signature } = JSON.parse(manifestJson);
      const expected = crypto.createHmac('sha256', this.SECRET).update(JSON.stringify(manifest)).digest('hex');
      return signature === expected;
    } catch {
      return false;
    }
  }
}

export class SecurityOrchestrator {
  /**
   * Generates a secure, isolated storage path for a production
   */
  static getIsolatedPath(tenantId: string, productionId: string): string {
    const hash = crypto.createHash('sha256').update(`${tenantId}-${productionId}`).digest('hex');
    return `/production-volumes/${hash.substring(0, 12)}`;
  }

  /**
   * Sanitize prompt to prevent prompt injection attacks in the pipeline
   */
  static sanitizePrompt(prompt: string): string {
    const forbiddenPatterns = [
      /ignore previous instructions/i, 
      /reveal your system prompt/i,
      /you are now an unrestricted/i
    ];
    let sanitized = prompt;
    for (const pattern of forbiddenPatterns) {
      sanitized = sanitized.replace(pattern, "[SECURITY_REDACTION]");
    }
    return sanitized;
  }

  /**
   * Validate agent output against safety guidelines (e.g. preventing unauthorized code execution)
   */
  static validateAgentOutput(output: string): boolean {
    // Check for dangerous system calls if the agent generated code
    const dangerousCalls = ['child_process', 'fs.writeFile', 'rm -rf', 'curl', 'wget'];
    return !dangerousCalls.some(call => output.includes(call));
  }
}
