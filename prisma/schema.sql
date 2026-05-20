-- Run this on your MySQL server to create the required tables.
-- Database: bshopafrica_cms

CREATE TABLE IF NOT EXISTS `BlogPost` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(255) NOT NULL,
  `slug`       VARCHAR(255) NOT NULL,
  `excerpt`    TEXT         NOT NULL,
  `content`    LONGTEXT     NOT NULL,
  `category`   VARCHAR(100) NOT NULL,
  `author`     VARCHAR(100) NOT NULL DEFAULT 'The B.Shop Team',
  `published`  TINYINT(1)   NOT NULL DEFAULT 0,
  `coverImage` VARCHAR(500)     NULL,
  `readTime`   VARCHAR(50)  NOT NULL DEFAULT '5 min read',
  `createdAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `BlogPost_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `SiteSettings` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `key`       VARCHAR(100) NOT NULL,
  `value`     TEXT         NOT NULL,
  `updatedAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SiteSettings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `NewsletterSubscriber` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `email`     VARCHAR(255) NOT NULL,
  `createdAt` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `NewsletterSubscriber_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
