-- CreateTable
CREATE TABLE "site_visits" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "crm_user_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_crm_user_id_fkey" FOREIGN KEY ("crm_user_id") REFERENCES "crm_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
