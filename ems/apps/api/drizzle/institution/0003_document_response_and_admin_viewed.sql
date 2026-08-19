ALTER TABLE "applications" ADD COLUMN "document_response_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "application_documents" ADD COLUMN "admin_viewed_at" timestamp with time zone;
