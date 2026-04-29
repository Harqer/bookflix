import { generateImage } from "../_core/imageGeneration";
import * as db from "../db";
import { log } from "./base";
import { WorldBibleData } from "../types";

export async function runVideoProducer(
  jobId: string,
  chapterId: string,
  chapterNumber: number,
  scenes: Array<{ sceneNumber: number; visualPrompt: string; slugline: string }>,
  worldBible: WorldBibleData,
): Promise<string | null> {
  log(jobId, "Video Producer", "info", `Generating keyframe images for chapter ${chapterNumber}`);

  const keyframeUrls: string[] = [];

  for (const scene of scenes.slice(0, 3)) {
    try {
      log(jobId, "Video Producer", "info", `Generating keyframe for scene ${scene.sceneNumber}`);

      const { url } = await generateImage({
        prompt: `${scene.visualPrompt}. Cinematic still frame, ${worldBible.era} era, ${worldBible.tone} mood.`,
      });

      if (url) {
        keyframeUrls.push(url);
        await db.updateSceneKeyframe(chapterId, scene.sceneNumber, url);
        log(jobId, "Video Producer", "success", `Keyframe generated`);
      }
    } catch (err) {
      log(jobId, "Video Producer", "warning", `Keyframe generation failed`);
    }
  }

  await db.updateChapterStatus(chapterId, "complete");

  if (keyframeUrls.length > 0) {
    await db.updateChapterThumbnail(chapterId, keyframeUrls[0]);
  }

  return keyframeUrls[0] || null;
}
