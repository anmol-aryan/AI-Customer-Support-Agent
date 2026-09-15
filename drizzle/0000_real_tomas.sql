CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` text NOT NULL,
	`customer_name` text DEFAULT 'Guest customer' NOT NULL,
	`email` text DEFAULT 'Not provided' NOT NULL,
	`issue` text NOT NULL,
	`category` text NOT NULL,
	`priority` text DEFAULT 'Normal' NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_ticket_id_unique` ON `tickets` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_tickets_status_created` ON `tickets` (`status`,`created_at`);