CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`driverName` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`forDate` varchar(16) NOT NULL,
	`status` enum('pending','paid','overdue','unpaid') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`paymentReference` varchar(128),
	`confirmedByAdminId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`email` varchar(320),
	`vehicleType` enum('car','suv','motorcycle','van') NOT NULL,
	`vehicleMake` varchar(100),
	`vehicleModel` varchar(100),
	`vehicleYear` int,
	`vehiclePlate` varchar(32),
	`vehicleColor` varchar(32),
	`rideCategories` json NOT NULL DEFAULT ('[]'),
	`hasHelmet` boolean DEFAULT false,
	`hasDeliveryBox` boolean DEFAULT false,
	`licenseUrl` varchar(512),
	`insuranceUrl` varchar(512),
	`roadworthyUrl` varchar(512),
	`licenseExpiry` timestamp,
	`insuranceExpiry` timestamp,
	`roadworthyExpiry` timestamp,
	`status` enum('pending_verification','active','offline','suspended') NOT NULL DEFAULT 'pending_verification',
	`isOnline` boolean NOT NULL DEFAULT false,
	`currentLat` decimal(10,7),
	`currentLng` decimal(10,7),
	`rating` decimal(3,2) DEFAULT '5.00',
	`totalTrips` int DEFAULT 0,
	`dailyCommissionAmount` decimal(10,2) NOT NULL DEFAULT '50.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`driverId` int NOT NULL,
	`riderUserId` int NOT NULL,
	`rating` int NOT NULL,
	`compliments` json DEFAULT ('[]'),
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`senderUserId` int NOT NULL,
	`senderRole` enum('driver','rider') NOT NULL,
	`body` text NOT NULL,
	`isQuickReply` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safetyAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userRole` enum('driver','rider') NOT NULL,
	`tripId` int,
	`lat` decimal(10,7),
	`lng` decimal(10,7),
	`message` text,
	`status` enum('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safetyAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userRole` enum('driver','rider') NOT NULL,
	`category` enum('trip_issue','payment','account','safety','other') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`tripId` int,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderId` int NOT NULL,
	`driverId` int,
	`rideCategory` enum('standard','comfort','kantanka','executive','okada','express_delivery') NOT NULL,
	`pickupAddress` text NOT NULL,
	`pickupLat` decimal(10,7),
	`pickupLng` decimal(10,7),
	`dropoffAddress` text NOT NULL,
	`dropoffLat` decimal(10,7),
	`dropoffLng` decimal(10,7),
	`stops` json DEFAULT ('[]'),
	`distanceKm` decimal(10,2),
	`fareEstimate` decimal(10,2) NOT NULL,
	`actualFare` decimal(10,2),
	`status` enum('pending','matched','en_route_pickup','arrived_pickup','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('cash','momo','wallet') NOT NULL DEFAULT 'cash',
	`safetyCheckins` json DEFAULT ('[]'),
	`riderName` varchar(255),
	`riderPhone` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
