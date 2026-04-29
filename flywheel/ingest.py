import os
import cv2
import numpy as np
import json
from pathlib import Path

class QualityScraper:
    """
    Phase 1: Seed & Curated Ingestion
    Filters videos based on Spatiotemporal Continuity Score > 0.92.
    """
    def __init__(self, input_dir, output_dir, threshold=0.92):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.threshold = threshold
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def calculate_continuity_score(self, video_path):
        """
        Calculates a metric for spatial and temporal stability.
        Uses Optical Flow variance and PSNR-like consistency between frames.
        """
        cap = cv2.VideoCapture(str(video_path))
        ret, prev_frame = cap.read()
        if not ret: return 0.0
        
        prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
        scores = []
        
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Calculate Farneback Optical Flow
            flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            
            # Continuity Metric: Inverse of flow variance + SSIM-like structure check
            flow_mag = np.sqrt(flow[...,0]**2 + flow[...,1]**2)
            spatial_stability = 1.0 / (1.0 + np.std(flow_mag))
            
            # Temporal Consistency: Frame difference low-pass
            diff = cv2.absdiff(prev_gray, gray)
            temporal_stability = 1.0 - (np.mean(diff) / 255.0)
            
            # Combine into Spatiotemporal Score
            scores.append(0.6 * spatial_stability + 0.4 * temporal_stability)
            
            prev_gray = gray
            
        cap.release()
        return np.mean(scores) if scores else 0.0

    def process(self):
        manifest = []
        print(f"[*] Starting ingestion from {self.input_dir}...")
        
        for video_file in self.input_dir.glob("*.mp4"):
            score = self.calculate_continuity_score(video_file)
            print(f"    - {video_file.name}: Score = {score:.4f}")
            
            if score >= self.threshold:
                # Link to curated set
                dest = self.output_dir / video_file.name
                if not dest.exists():
                    os.link(video_file, dest)
                manifest.append({"file": video_file.name, "score": score})
        
        with open(self.output_dir / "ingest_manifest.json", "w") as f:
            json.dump(manifest, f, indent=4)
            
        print(f"[+] Ingestion complete. {len(manifest)} videos passed threshold.")

if __name__ == "__main__":
    scraper = QualityScraper("flywheel/data/raw", "flywheel/data/curated")
    scraper.process()
