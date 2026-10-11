-- Autenticación con Entra ID: los usuarios corporativos (is_external = true) no tienen contraseña local.
ALTER TABLE "public"."local_user"
    ALTER COLUMN "password_salt" DROP NOT NULL,
    ALTER COLUMN "password_hash" DROP NOT NULL;

-- El email es la llave de vínculo con Entra ID; se compara sin distinguir mayúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS "local_user_email_lower_idx" ON "public"."local_user" (lower("email"));
