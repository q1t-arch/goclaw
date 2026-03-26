import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { useHttp } from "@/hooks/use-ws";

interface CLIAuthStatus {
  logged_in: boolean;
  email?: string;
  subscription_type?: string;
  error?: string;
  in_docker?: boolean;
}

export function CLISection({ open }: { open: boolean }) {
  const { t } = useTranslation("providers");
  const http = useHttp();
  const [cliAuth, setCliAuth] = useState<CLIAuthStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = useCallback(() => {
    setLoading(true);
    http
      .get<CLIAuthStatus>("/v1/providers/claude-cli/auth-status")
      .then(setCliAuth)
      .catch(() => setCliAuth({ logged_in: false, error: "Failed to check auth status" }))
      .finally(() => setLoading(false));
  }, [http]);

  useEffect(() => {
    if (open) {
      checkAuth();
    } else {
      setCliAuth(null);
    }
  }, [open, checkAuth]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("cli.description")} <code className="rounded bg-muted px-1 py-0.5">claude</code> {t("cli.descriptionSuffix")}
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("cli.checkingAuth")}
        </div>
      ) : cliAuth?.logged_in ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm text-success">
                {t("cli.authenticatedAs")} <strong>{cliAuth.email}</strong>
                {cliAuth.subscription_type && (
                  <span className="ml-1 text-xs opacity-75">({cliAuth.subscription_type})</span>
                )}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-success hover:text-success/80"
              onClick={checkAuth}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">{t("cli.switchAccount")}</summary>
            <div className="mt-1.5 space-y-1 rounded-md border bg-muted/50 px-3 py-2">
              <p>{t("cli.switchAccountInstructions")}</p>
              <code className="block rounded bg-muted px-2 py-1 font-mono">
                {cliAuth?.in_docker
                  ? "docker compose exec goclaw claude auth logout && docker compose exec goclaw claude auth login"
                  : "claude auth logout && claude auth login"}
              </code>
              <p>{t("cli.switchAccountRecheck")} <RefreshCw className="inline h-3 w-3" /> {t("cli.switchAccountRecheckSuffix")}</p>
            </div>
          </details>
        </div>
      ) : cliAuth ? (
        <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">{t("cli.notAuthenticated")}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-warning hover:text-warning/80"
              onClick={checkAuth}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">{t("cli.recheckButton")}</span>
            </Button>
          </div>
          <p className="mt-1 text-sm text-warning">
            {t("cli.runOnServer")}
          </p>
          <code className="mt-1 block rounded bg-warning/10 px-2 py-1 text-xs font-mono">
            {cliAuth.in_docker ? "docker compose exec goclaw claude auth login" : "claude auth login"}
          </code>
          {cliAuth.error && (
            <p className="mt-1 text-xs text-warning">{cliAuth.error}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
