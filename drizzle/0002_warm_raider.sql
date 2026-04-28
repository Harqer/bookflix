ALTER TABLE `processingJobs` MODIFY COLUMN `logs` json NOT NULL;--> statement-breakpoint
ALTER TABLE `worldBibles` MODIFY COLUMN `characters` json NOT NULL;--> statement-breakpoint
ALTER TABLE `worldBibles` MODIFY COLUMN `locations` json NOT NULL;--> statement-breakpoint
ALTER TABLE `worldBibles` MODIFY COLUMN `timeline` json NOT NULL;--> statement-breakpoint
ALTER TABLE `worldBibles` MODIFY COLUMN `themes` json NOT NULL;