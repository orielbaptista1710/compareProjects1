-- CRM Lead/Enquiry restructure.
-- The old leads/crm_users rows were fake test data and cannot be converted
-- (new required columns, role renamed, phone now unique), so they are cleared first.
-- DO NOT reuse this pattern once real leads exist: that needs a copy-into-Enquiry step.
DELETE FROM "site_visits";
DELETE FROM "lead_activities";
DELETE FROM "leads";
DELETE FROM "crm_users";

-- CreateEnum
CREATE TYPE "LeadCategory" AS ENUM ('buyer', 'developer_partner');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('web', 'app', 'meta', 'whatsapp');

-- CreateEnum
CREATE TYPE "ListerType" AS ENUM ('owner', 'agent', 'developer');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('call', 'note', 'stage_change', 'assignment', 'email', 'whatsapp', 'reveal');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- AlterEnum
BEGIN;
CREATE TYPE "LeadStage_new" AS ENUM ('new', 'contacted', 'qualified', 'site_visit', 'negotiation', 'handed_over', 'converted', 'lost');
ALTER TABLE "leads" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "stage" TYPE "LeadStage_new" USING ("stage"::text::"LeadStage_new");
ALTER TYPE "LeadStage" RENAME TO "LeadStage_old";
ALTER TYPE "LeadStage_new" RENAME TO "LeadStage";
DROP TYPE "LeadStage_old";
ALTER TABLE "leads" ALTER COLUMN "stage" SET DEFAULT 'new';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CrmRole_new" AS ENUM ('admin', 'crm_manager', 'zonal_manager', 'sales_rep');
ALTER TABLE "crm_users" ALTER COLUMN "role" TYPE "CrmRole_new" USING ("role"::text::"CrmRole_new");
ALTER TYPE "CrmRole" RENAME TO "CrmRole_old";
ALTER TYPE "CrmRole_new" RENAME TO "CrmRole";
DROP TYPE "CrmRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_lead_id_fkey";

-- DropIndex
DROP INDEX "leads_email_idx";

-- DropIndex
DROP INDEX "leads_phone_idx";

-- DropIndex
DROP INDEX "leads_source_idx";

-- AlterTable
ALTER TABLE "crm_users" ADD COLUMN     "failed_logins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "leads" DROP COLUMN "contact_consent",
DROP COLUMN "ip_address",
DROP COLUMN "lead_type",
DROP COLUMN "metadata",
DROP COLUMN "page_url",
DROP COLUMN "property_id",
DROP COLUMN "property_title",
DROP COLUMN "source",
DROP COLUMN "user_agent",
ADD COLUMN     "category" "LeadCategory" NOT NULL DEFAULT 'buyer',
ADD COLUMN     "first_contacted_at" TIMESTAMP(3),
ADD COLUMN     "last_activity_at" TIMESTAMP(3),
ADD COLUMN     "lost_reason" TEXT,
ADD COLUMN     "zone_id" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "lead_activities" DROP COLUMN "activity_type",
ADD COLUMN     "activity_type" "ActivityType" NOT NULL;

-- AlterTable
ALTER TABLE "site_visits" ADD COLUMN     "property_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "VisitStatus" NOT NULL DEFAULT 'scheduled';

-- DropEnum
DROP TYPE "LeadType";

-- CreateTable
CREATE TABLE "crm_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_areas" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,

    CONSTRAINT "zone_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_staff" (
    "zone_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_manager" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "zone_staff_pkey" PRIMARY KEY ("zone_id","user_id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "source" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "property_id" TEXT,
    "property_title" TEXT,
    "lister_type" "ListerType",
    "lister_id" TEXT,
    "city" TEXT,
    "locality" TEXT,
    "pincode" TEXT,
    "budget" TEXT,
    "property_type_interest" TEXT,
    "message" TEXT,
    "loan_interest" BOOLEAN,
    "consent_version" TEXT NOT NULL,
    "consent_at" TIMESTAMP(3) NOT NULL,
    "utm" JSONB,
    "raw_payload" JSONB NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "done_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_sessions_token_hash_key" ON "crm_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "crm_sessions_user_id_idx" ON "crm_sessions"("user_id");

-- CreateIndex
CREATE INDEX "crm_sessions_expires_at_idx" ON "crm_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "zones_city_name_key" ON "zones"("city", "name");

-- CreateIndex
CREATE UNIQUE INDEX "zone_areas_pincode_key" ON "zone_areas"("pincode");

-- CreateIndex
CREATE INDEX "zone_areas_zone_id_idx" ON "zone_areas"("zone_id");

-- CreateIndex
CREATE INDEX "zone_staff_user_id_idx" ON "zone_staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_idempotency_key_key" ON "enquiries"("idempotency_key");

-- CreateIndex
CREATE INDEX "enquiries_lead_id_created_at_idx" ON "enquiries"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_property_id_idx" ON "enquiries"("property_id");

-- CreateIndex
CREATE INDEX "enquiries_lister_type_lister_id_created_at_idx" ON "enquiries"("lister_type", "lister_id", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_created_at_idx" ON "enquiries"("created_at");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_due_at_idx" ON "tasks"("assignee_id", "due_at");

-- CreateIndex
CREATE INDEX "tasks_lead_id_idx" ON "tasks"("lead_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "leads_phone_key" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "leads_stage_assigned_to_idx" ON "leads"("stage", "assigned_to");

-- CreateIndex
CREATE INDEX "leads_zone_id_stage_idx" ON "leads"("zone_id", "stage");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_created_at_idx" ON "lead_activities"("lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_activities_crm_user_id_idx" ON "lead_activities"("crm_user_id");

-- CreateIndex
CREATE INDEX "site_visits_lead_id_idx" ON "site_visits"("lead_id");

-- CreateIndex
CREATE INDEX "site_visits_crm_user_id_scheduled_at_idx" ON "site_visits"("crm_user_id", "scheduled_at");

-- AddForeignKey
ALTER TABLE "crm_sessions" ADD CONSTRAINT "crm_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_areas" ADD CONSTRAINT "zone_areas_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_staff" ADD CONSTRAINT "zone_staff_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_staff" ADD CONSTRAINT "zone_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "crm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

