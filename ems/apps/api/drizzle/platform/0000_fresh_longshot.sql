CREATE TYPE "public"."institution_status" AS ENUM('Provisioning', 'Active', 'Suspended', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."platform_user_role" AS ENUM('Applicant', 'Student', 'Lecturer', 'Bursar', 'AcademicAdmin', 'Librarian', 'ICTManager');--> statement-breakpoint
CREATE TABLE "billing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"active_student_count" integer DEFAULT 0 NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'RWF' NOT NULL,
	"invoice_reference" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution_databases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"database_name" text NOT NULL,
	"connection_url" text NOT NULL,
	"region" text DEFAULT 'eu-central-1' NOT NULL,
	"schema_version" text,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"short_name" text NOT NULL,
	"status" "institution_status" DEFAULT 'Provisioning' NOT NULL,
	"contact_email" text NOT NULL,
	"timezone" text DEFAULT 'Africa/Kigali' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"institution_id" uuid,
	"succeeded" boolean NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid,
	"database_name" text NOT NULL,
	"migration_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_ms" integer,
	"succeeded" boolean DEFAULT true NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"institution_id" uuid,
	"metadata" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_directory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"institution_id" uuid NOT NULL,
	"institution_user_id" uuid NOT NULL,
	"alternate_identifier" text,
	"role" "platform_user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_databases" ADD CONSTRAINT "institution_databases_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "migration_history" ADD CONSTRAINT "migration_history_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_actor_id_platform_admins_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."platform_admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_directory" ADD CONSTRAINT "user_directory_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_records_institution_idx" ON "billing_records" USING btree ("institution_id","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "institution_databases_name_key" ON "institution_databases" USING btree ("database_name");--> statement-breakpoint
CREATE INDEX "institution_databases_institution_idx" ON "institution_databases" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "institutions_slug_key" ON "institutions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "login_attempts_email_idx" ON "login_attempts" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_idx" ON "login_attempts" USING btree ("ip_address","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "migration_history_db_tag_key" ON "migration_history" USING btree ("database_name","migration_tag");--> statement-breakpoint
CREATE INDEX "migration_history_institution_idx" ON "migration_history" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "platform_audit_logs_institution_idx" ON "platform_audit_logs" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "platform_audit_logs_action_idx" ON "platform_audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_directory_email_key" ON "user_directory" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "user_directory_alternate_key" ON "user_directory" USING btree ("alternate_identifier");--> statement-breakpoint
CREATE INDEX "user_directory_institution_idx" ON "user_directory" USING btree ("institution_id");