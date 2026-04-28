import { put, head, del } from '@vercel/blob';

/**
 * Enterprise Asset Storage (Vercel Blob)
 * Manages all cinematic media, research JSONs, and screenplay manifests.
 */
export class StudioAssets {
  /**
   * Uploads a file or JSON manifest to the production vault
   */
  static async uploadAsset(path: string, content: string | Buffer | object) {
    console.log(`[Studio Assets] Vaulting asset to: ${path}`);
    
    const body = typeof content === 'object' ? JSON.stringify(content) : content;
    
    const blob = await put(path, body, {
      access: 'public', // Can be toggled to 'private' for enterprise security
      addRandomSuffix: true,
      contentType: typeof content === 'object' ? 'application/json' : 'text/plain'
    });

    return blob.url;
  }

  /**
   * Checks if an asset exists in the vault
   */
  static async getAssetInfo(url: string) {
    try {
      return await head(url);
    } catch {
      return null;
    }
  }

  /**
   * Deletes an asset (e.g. cleanup after failed job)
   */
  static async deleteAsset(url: string) {
    await del(url);
  }
}
