


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."submission_status" AS ENUM (
    'submitted',
    'graded',
    'late',
    'returned'
);


ALTER TYPE "public"."submission_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'student',
    'teacher',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  claims jsonb;
  v_role text;
  v_institution_id uuid;
  v_is_active boolean;
  v_session_version integer;
begin
  select
    role::text,
    institution_id,
    is_active,
    session_version
  into
    v_role,
    v_institution_id,
    v_is_active,
    v_session_version
  from public.profiles
  where id = (event ->> 'user_id')::uuid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);

  -- role
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(v_role, 'student')));

  -- institution
  if v_institution_id is not null then
    claims := jsonb_set(claims, '{institution_id}', to_jsonb(v_institution_id::text));
  end if;

  -- extras
  claims := jsonb_set(claims, '{is_active}', to_jsonb(coalesce(v_is_active, true)));
  claims := jsonb_set(claims, '{session_version}', to_jsonb(coalesce(v_session_version, 0)));

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_institution_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(auth.jwt() ->> 'institution_id','')::uuid;
$$;


ALTER FUNCTION "public"."get_institution_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_institution_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select nullif(
    coalesce(
      (current_setting('request.jwt.claims', true)::json
         -> 'app_metadata' ->> 'institution_id'),
      (current_setting('request.jwt.claims', true)::json
         ->> 'institution_id')
    ),
    ''
  )::uuid;
$$;


ALTER FUNCTION "public"."get_user_institution_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json
       -> 'app_metadata' ->> 'user_role'),
    (current_setting('request.jwt.claims', true)::json
       ->> 'user_role'),
    'student'
  );
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."audit_log" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "teacher_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."courses" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_work" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_work" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_work_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_work_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."enrollments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid",
    "owner_id" "uuid",
    "bucket_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" bigint,
    "scan_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."file_objects" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."file_objects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."final_grades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "student_id" "uuid",
    "grade" numeric,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."final_grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "score" numeric(5,2) NOT NULL,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."grades" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."institutions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."institutions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "title" "text",
    "file_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "file_name" "text"
);


ALTER TABLE "public"."materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "institution_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "institution_id" "uuid",
    "role" "public"."user_role" DEFAULT 'student'::"public"."user_role",
    "email" "text" NOT NULL,
    "full_name" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "session_version" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid",
    "expires_at" timestamp without time zone,
    "used" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "institution_id" "uuid",
    "revoked" boolean DEFAULT false,
    "used_at" timestamp without time zone,
    "used_by" "uuid"
);


ALTER TABLE "public"."student_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid",
    "task_id" "uuid",
    "student_id" "uuid",
    "content" "text",
    "status" "public"."submission_status" DEFAULT 'submitted'::"public"."submission_status",
    "file_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."submissions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid",
    "course_id" "uuid",
    "title" "text",
    "max_score" integer DEFAULT 100,
    "description" "text",
    "due_date" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "file_name" "text",
    "file_url" "text",
    "file_size" integer
);

ALTER TABLE ONLY "public"."tasks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "institution_id" "uuid" NOT NULL,
    "email" "text",
    "token" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "expires_at" timestamp without time zone,
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "used" boolean DEFAULT false NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "revoked" boolean DEFAULT false NOT NULL,
    "email_hint" "text"
);


ALTER TABLE "public"."teacher_invites" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_sections"
    ADD CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_work"
    ADD CONSTRAINT "daily_work_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_work_submissions"
    ADD CONSTRAINT "daily_work_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_work_submissions"
    ADD CONSTRAINT "daily_work_submissions_work_id_student_id_key" UNIQUE ("work_id", "student_id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_unique_student_course" UNIQUE ("course_id", "student_id");



ALTER TABLE ONLY "public"."file_objects"
    ADD CONSTRAINT "file_objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."final_grades"
    ADD CONSTRAINT "final_grades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_submission_id_key" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_unique_submission" UNIQUE ("submission_id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."institutions"
    ADD CONSTRAINT "institutions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_invites"
    ADD CONSTRAINT "student_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_unique_task_student" UNIQUE ("task_id", "student_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_invites"
    ADD CONSTRAINT "teacher_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_invites"
    ADD CONSTRAINT "teacher_invites_token_key" UNIQUE ("token");



CREATE INDEX "audit_log_actor_idx" ON "public"."audit_log" USING "btree" ("actor_id");



CREATE INDEX "audit_log_institution_idx" ON "public"."audit_log" USING "btree" ("institution_id");



CREATE INDEX "courses_institution_idx" ON "public"."courses" USING "btree" ("institution_id");



CREATE INDEX "courses_teacher_idx" ON "public"."courses" USING "btree" ("teacher_id");



CREATE INDEX "daily_work_course_idx" ON "public"."daily_work" USING "btree" ("course_id", "created_at" DESC);



CREATE INDEX "daily_work_submissions_student_idx" ON "public"."daily_work_submissions" USING "btree" ("student_id");



CREATE INDEX "daily_work_submissions_work_idx" ON "public"."daily_work_submissions" USING "btree" ("work_id", "created_at" DESC);



CREATE INDEX "enrollments_course_idx" ON "public"."enrollments" USING "btree" ("course_id");



CREATE INDEX "enrollments_student_idx" ON "public"."enrollments" USING "btree" ("student_id");



CREATE UNIQUE INDEX "enrollments_unique" ON "public"."enrollments" USING "btree" ("course_id", "student_id");



CREATE INDEX "file_objects_owner_idx" ON "public"."file_objects" USING "btree" ("owner_id");



CREATE INDEX "grades_teacher_idx" ON "public"."grades" USING "btree" ("teacher_id");



CREATE INDEX "idx_messages_course_created" ON "public"."messages" USING "btree" ("course_id", "created_at" DESC);



CREATE INDEX "profiles_institution_idx" ON "public"."profiles" USING "btree" ("institution_id");



CREATE INDEX "submissions_student_idx" ON "public"."submissions" USING "btree" ("student_id");



CREATE INDEX "submissions_task_idx" ON "public"."submissions" USING "btree" ("task_id");



CREATE INDEX "tasks_course_idx" ON "public"."tasks" USING "btree" ("course_id");



ALTER TABLE ONLY "public"."course_sections"
    ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_institution_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_teacher_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."daily_work"
    ADD CONSTRAINT "daily_work_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_work"
    ADD CONSTRAINT "daily_work_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_work"
    ADD CONSTRAINT "daily_work_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_work_submissions"
    ADD CONSTRAINT "daily_work_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_work_submissions"
    ADD CONSTRAINT "daily_work_submissions_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "public"."daily_work"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_course_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_institution_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."final_grades"
    ADD CONSTRAINT "final_grades_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id");



ALTER TABLE ONLY "public"."final_grades"
    ADD CONSTRAINT "final_grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_institution_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_submission_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_teacher_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."materials"
    ADD CONSTRAINT "materials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_institution_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_institution_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_student_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_task_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_course_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_institution_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_invites"
    ADD CONSTRAINT "teacher_invites_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "courses_delete_admin" ON "public"."courses" FOR DELETE TO "authenticated" USING ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



CREATE POLICY "courses_insert_staff" ON "public"."courses" FOR INSERT TO "authenticated" WITH CHECK ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ("created_by" = "auth"."uid"()) AND (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'teacher'::"text"]))));



CREATE POLICY "courses_select" ON "public"."courses" FOR SELECT TO "authenticated" USING (((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("teacher_id" = "auth"."uid"()) OR ("id" IN ( SELECT "e"."course_id"
   FROM "public"."enrollments" "e"
  WHERE ("e"."student_id" = "auth"."uid"())))));



CREATE POLICY "courses_select_access" ON "public"."courses" FOR SELECT TO "authenticated" USING ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ("teacher_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."course_id" = "courses"."id") AND ("e"."student_id" = "auth"."uid"())))))));



CREATE POLICY "courses_update_staff" ON "public"."courses" FOR UPDATE TO "authenticated" USING ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = 'teacher'::"text") AND ("created_by" = "auth"."uid"()))))) WITH CHECK ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = 'teacher'::"text") AND ("created_by" = "auth"."uid"())))));



ALTER TABLE "public"."daily_work" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_work_delete" ON "public"."daily_work" FOR DELETE TO "authenticated" USING ((("institution_id" = COALESCE((((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"))::"uuid", ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text"))::"uuid")) AND (("created_by" = "auth"."uid"()) OR (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "daily_work"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))))));



CREATE POLICY "daily_work_insert" ON "public"."daily_work" FOR INSERT TO "authenticated" WITH CHECK ((("institution_id" = COALESCE((((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"))::"uuid", ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text"))::"uuid")) AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "daily_work"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))))));



CREATE POLICY "daily_work_select" ON "public"."daily_work" FOR SELECT TO "authenticated" USING ((("institution_id" = COALESCE((((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"))::"uuid", ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text"))::"uuid")) AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "daily_work"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."course_id" = "daily_work"."course_id") AND ("e"."student_id" = "auth"."uid"())))))));



ALTER TABLE "public"."daily_work_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_work_subs_delete" ON "public"."daily_work_submissions" FOR DELETE TO "authenticated" USING ((("student_id" = "auth"."uid"()) OR (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



CREATE POLICY "daily_work_subs_insert" ON "public"."daily_work_submissions" FOR INSERT TO "authenticated" WITH CHECK ((("student_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."daily_work" "w"
     JOIN "public"."enrollments" "e" ON ((("e"."course_id" = "w"."course_id") AND ("e"."student_id" = "auth"."uid"()))))
  WHERE ("w"."id" = "daily_work_submissions"."work_id")))));



CREATE POLICY "daily_work_subs_select" ON "public"."daily_work_submissions" FOR SELECT TO "authenticated" USING ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."daily_work" "w"
     JOIN "public"."courses" "c" ON (("c"."id" = "w"."course_id")))
  WHERE (("w"."id" = "daily_work_submissions"."work_id") AND (("c"."teacher_id" = "auth"."uid"()) OR (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))))));



CREATE POLICY "daily_work_subs_update" ON "public"."daily_work_submissions" FOR UPDATE TO "authenticated" USING (("student_id" = "auth"."uid"()));



CREATE POLICY "daily_work_update" ON "public"."daily_work" FOR UPDATE TO "authenticated" USING ((("institution_id" = COALESCE((((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"))::"uuid", ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text"))::"uuid")) AND (("created_by" = "auth"."uid"()) OR (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "daily_work"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))))));



ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enrollments_select" ON "public"."enrollments" FOR SELECT TO "authenticated" USING ((("student_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "enrollments"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))) OR (COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text")) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



ALTER TABLE "public"."file_objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."institutions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invites insert" ON "public"."student_invites" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "invites select" ON "public"."student_invites" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages insert" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "messages select" ON "public"."messages" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles tenant" ON "public"."profiles" FOR SELECT USING (("institution_id" = "public"."get_institution_id"()));



ALTER TABLE "public"."student_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete_staff" ON "public"."tasks" FOR DELETE TO "authenticated" USING ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "tasks"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))))));



CREATE POLICY "tasks_insert_staff" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ("created_by" = "auth"."uid"()) AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "tasks"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))))));



CREATE POLICY "tasks_select_access" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "tasks"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."enrollments" "e"
  WHERE (("e"."course_id" = "tasks"."course_id") AND ("e"."student_id" = "auth"."uid"())))))));



CREATE POLICY "tasks_update_staff" ON "public"."tasks" FOR UPDATE TO "authenticated" USING ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "tasks"."course_id") AND ("c"."teacher_id" = "auth"."uid"()))))))) WITH CHECK ((("institution_id" = (NULLIF(COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'institution_id'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'institution_id'::"text")), ''::"text"))::"uuid") AND ((COALESCE(((("current_setting"('request.jwt.claims'::"text", true))::json -> 'app_metadata'::"text") ->> 'user_role'::"text"), (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'user_role'::"text"), 'student'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."courses" "c"
  WHERE (("c"."id" = "tasks"."course_id") AND ("c"."teacher_id" = "auth"."uid"())))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";






















































































































































REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."get_institution_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_institution_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_institution_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_institution_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_institution_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_institution_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";


















GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."course_sections" TO "anon";
GRANT ALL ON TABLE "public"."course_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."course_sections" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."daily_work" TO "anon";
GRANT ALL ON TABLE "public"."daily_work" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_work" TO "service_role";



GRANT ALL ON TABLE "public"."daily_work_submissions" TO "anon";
GRANT ALL ON TABLE "public"."daily_work_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_work_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."file_objects" TO "anon";
GRANT ALL ON TABLE "public"."file_objects" TO "authenticated";
GRANT ALL ON TABLE "public"."file_objects" TO "service_role";



GRANT ALL ON TABLE "public"."final_grades" TO "anon";
GRANT ALL ON TABLE "public"."final_grades" TO "authenticated";
GRANT ALL ON TABLE "public"."final_grades" TO "service_role";



GRANT ALL ON TABLE "public"."grades" TO "anon";
GRANT ALL ON TABLE "public"."grades" TO "authenticated";
GRANT ALL ON TABLE "public"."grades" TO "service_role";



GRANT ALL ON TABLE "public"."institutions" TO "anon";
GRANT ALL ON TABLE "public"."institutions" TO "authenticated";
GRANT ALL ON TABLE "public"."institutions" TO "service_role";



GRANT ALL ON TABLE "public"."materials" TO "anon";
GRANT ALL ON TABLE "public"."materials" TO "authenticated";
GRANT ALL ON TABLE "public"."materials" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."student_invites" TO "anon";
GRANT ALL ON TABLE "public"."student_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."student_invites" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_invites" TO "anon";
GRANT ALL ON TABLE "public"."teacher_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_invites" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
