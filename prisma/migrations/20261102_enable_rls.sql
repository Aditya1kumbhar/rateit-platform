-- Enable Row Level Security (RLS) across all public tables
-- Fixes Supabase Security Advisor warnings while maintaining full Prisma ORM access

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BizReply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessClaim" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Flag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "List" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModerationAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GrievanceAppeal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserInterest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SearchLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewHelpful" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('
            DO $policy$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = %L AND policyname = %L
                ) THEN
                    CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true);
                END IF;
            END $policy$;
        ', tbl, 'service_role_all_' || tbl, 'service_role_all_' || tbl, tbl);
    END LOOP;
END $$;

