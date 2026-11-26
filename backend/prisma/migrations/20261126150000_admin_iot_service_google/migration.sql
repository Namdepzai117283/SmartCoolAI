-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'ERROR');

-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RolloutStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('REPAIR', 'MAINTENANCE', 'WARRANTY', 'INSTALLATION');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'PROMOTION', 'WEATHER', 'DEVICE_ALERT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "NotificationTarget" AS ENUM ('ALL', 'ROLE', 'USER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'WAREHOUSE';
ALTER TYPE "UserRole" ADD VALUE 'SUPPORT';
ALTER TYPE "UserRole" ADD VALUE 'TECHNICIAN';

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "region" VARCHAR(100),
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "google_id" TEXT;

-- CreateTable
CREATE TABLE "error_codes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "brand" VARCHAR(100) NOT NULL DEFAULT '',
    "title" VARCHAR(255) NOT NULL,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'WARNING',
    "causes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "solution" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "serial" VARCHAR(50) NOT NULL,
    "mac_address" VARCHAR(20),
    "product_id" UUID NOT NULL,
    "owner_id" UUID,
    "name" VARCHAR(150),
    "region" VARCHAR(100) NOT NULL DEFAULT 'TP. Hồ Chí Minh',
    "address" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "firmware_version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "last_seen_at" TIMESTAMP(3),
    "power_on" BOOLEAN NOT NULL DEFAULT false,
    "mode" VARCHAR(30),
    "target_temp" DOUBLE PRECISION,
    "current_temp" DOUBLE PRECISION,
    "last_error_code" VARCHAR(20),
    "installed_at" TIMESTAMP(3),
    "warranty_until" TIMESTAMP(3),
    "last_service_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_telemetry" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "power_kw" DOUBLE PRECISION,
    "pressure" DOUBLE PRECISION,
    "error_code" VARCHAR(20),
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_events" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmwares" (
    "id" UUID NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "notes" TEXT,
    "file_url" TEXT,
    "is_stable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firmwares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmware_rollouts" (
    "id" UUID NOT NULL,
    "firmware_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "status" "RolloutStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "firmware_rollouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_tickets" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_id" UUID NOT NULL,
    "device_id" UUID,
    "technician_id" UUID,
    "type" "TicketType" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "error_code" VARCHAR(20),
    "address" TEXT,
    "region" VARCHAR(100),
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "parts_used" JSONB,
    "labor_cost" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "parts_cost" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(15,0) NOT NULL DEFAULT 0,
    "resolution" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_rules" (
    "id" UUID NOT NULL,
    "device_type" "DeviceType" NOT NULL,
    "interval_months" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "target" "NotificationTarget" NOT NULL DEFAULT 'ALL',
    "target_value" VARCHAR(50),
    "recipient_id" UUID,
    "sender_id" UUID,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100),
    "detail" JSONB,
    "ip" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_codes_severity_idx" ON "error_codes"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "error_codes_code_device_type_brand_key" ON "error_codes"("code", "device_type", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serial_key" ON "devices"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "devices_mac_address_key" ON "devices"("mac_address");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_region_idx" ON "devices"("region");

-- CreateIndex
CREATE INDEX "devices_owner_id_idx" ON "devices"("owner_id");

-- CreateIndex
CREATE INDEX "device_telemetry_device_id_recorded_at_idx" ON "device_telemetry"("device_id", "recorded_at");

-- CreateIndex
CREATE INDEX "device_telemetry_recorded_at_idx" ON "device_telemetry"("recorded_at");

-- CreateIndex
CREATE INDEX "device_events_device_id_created_at_idx" ON "device_events"("device_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "firmwares_version_device_type_key" ON "firmwares"("version", "device_type");

-- CreateIndex
CREATE INDEX "firmware_rollouts_firmware_id_status_idx" ON "firmware_rollouts"("firmware_id", "status");

-- CreateIndex
CREATE INDEX "firmware_rollouts_device_id_idx" ON "firmware_rollouts"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_tickets_code_key" ON "service_tickets"("code");

-- CreateIndex
CREATE INDEX "service_tickets_status_priority_idx" ON "service_tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "service_tickets_technician_id_status_idx" ON "service_tickets"("technician_id", "status");

-- CreateIndex
CREATE INDEX "service_tickets_customer_id_created_at_idx" ON "service_tickets"("customer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_rules_device_type_key" ON "maintenance_rules"("device_type");

-- CreateIndex
CREATE INDEX "notifications_target_sent_at_idx" ON "notifications"("target", "sent_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_created_at_idx" ON "audit_logs"("entity", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_telemetry" ADD CONSTRAINT "device_telemetry_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_events" ADD CONSTRAINT "device_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmware_rollouts" ADD CONSTRAINT "firmware_rollouts_firmware_id_fkey" FOREIGN KEY ("firmware_id") REFERENCES "firmwares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmware_rollouts" ADD CONSTRAINT "firmware_rollouts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

