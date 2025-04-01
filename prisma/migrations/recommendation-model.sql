-- CreateTable
CREATE TABLE `Recommendation` (
  `id` VARCHAR(191) NOT NULL,
  `parentId` VARCHAR(191) NOT NULL,
  `childminderId` VARCHAR(191) NOT NULL,
  `score` FLOAT NOT NULL,
  `reasons` JSON NULL,
  `isCollaborative` BOOLEAN NOT NULL DEFAULT false,
  `isViewed` BOOLEAN NOT NULL DEFAULT false,
  `isClicked` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Recommendation_parentId_idx` ON `Recommendation`(`parentId`);

-- CreateIndex
CREATE INDEX `Recommendation_childminderId_idx` ON `Recommendation`(`childminderId`);

-- CreateIndex
CREATE INDEX `Recommendation_score_idx` ON `Recommendation`(`score`);

-- CreateIndex
CREATE INDEX `Recommendation_createdAt_idx` ON `Recommendation`(`createdAt`);

-- AddForeignKey
ALTER TABLE `Recommendation` ADD CONSTRAINT `Recommendation_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recommendation` ADD CONSTRAINT `Recommendation_childminderId_fkey` FOREIGN KEY (`childminderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE; 