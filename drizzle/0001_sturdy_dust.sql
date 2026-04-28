CREATE TABLE `books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`author` varchar(255) NOT NULL DEFAULT 'Unknown',
	`genre` varchar(100) DEFAULT 'Drama',
	`synopsis` text,
	`rawText` text NOT NULL,
	`wordCount` int DEFAULT 0,
	`chapterCount` int DEFAULT 0,
	`coverImageUrl` text,
	`posterImageUrl` text,
	`productionStyle` enum('cinematic','animated','documentary') DEFAULT 'cinematic',
	`tone` varchar(100) DEFAULT 'dramatic',
	`status` enum('pending','analyzing','scripting','directing','filming','assembling','complete','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`chapterNumber` int NOT NULL,
	`title` varchar(500) NOT NULL DEFAULT 'Chapter',
	`rawContent` text NOT NULL,
	`wordCount` int DEFAULT 0,
	`screenplay` text,
	`screenplaySummary` text,
	`sceneCount` int DEFAULT 0,
	`videoUrl` text,
	`videoDurationSeconds` int,
	`thumbnailUrl` text,
	`status` enum('pending','scripting','directing','filming','complete','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processingJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`userId` int NOT NULL,
	`currentStage` enum('book_analysis','world_bible_init','screenplay_generation','visual_direction','video_production','final_assembly') NOT NULL DEFAULT 'book_analysis',
	`overallProgress` int DEFAULT 0,
	`stageProgress` int DEFAULT 0,
	`logs` json NOT NULL DEFAULT ('[]'),
	`estimatedMinutesRemaining` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`isCancelled` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processingJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoScenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chapterId` int NOT NULL,
	`bookId` int NOT NULL,
	`sceneNumber` int NOT NULL,
	`slugline` varchar(500),
	`actionLines` text,
	`dialogue` text,
	`visualPrompt` text,
	`keyframeImageUrl` text,
	`videoUrl` text,
	`durationSeconds` int,
	`status` enum('pending','generating_keyframe','generating_video','complete','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoScenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `worldBibles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`characters` json NOT NULL DEFAULT ('{}'),
	`locations` json NOT NULL DEFAULT ('{}'),
	`timeline` json NOT NULL DEFAULT ('[]'),
	`themes` json NOT NULL DEFAULT ('[]'),
	`tone` varchar(255),
	`era` varchar(100),
	`lastUpdatedChapter` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `worldBibles_id` PRIMARY KEY(`id`),
	CONSTRAINT `worldBibles_bookId_unique` UNIQUE(`bookId`)
);
