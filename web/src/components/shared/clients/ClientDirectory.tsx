import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/card";
import { Input } from "../../shared/input";
import { Badge } from "../../shared/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shared/tooltip";
import { AdminAPI } from "../../../utils/api-admin";
import { useAuth } from "../../../utils/api";
import { formatDate } from "../../../utils/shared/helpers";
import { getEntityDetailPath, getStageTabFromStage } from '../../../utils/companyTabs';

interface AdminClientRecord {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  client_companies_count?: number;
  client_company_names?: string[];
  created_at?: string;
  is_active?: boolean;
}

function getClientDisplayName(client: AdminClientRecord) {
  const candidate = (client.name || "").trim();
  if (candidate) return candidate;
  const fallbackName = `${client.first_name || ""} ${client.last_name || ""}`.trim();
  if (fallbackName) return fallbackName;
  if (client.email) return client.email;
  return "Client";
}

function getSearchableValues(client: AdminClientRecord) {
  return [
    client.id,
    client.email,
    client.name,
    client.first_name,
    client.last_name,
    client.phone,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
}

export function ClientDirectory({ basePath = '/admin' }: { basePath?: '/admin' | '/manager' | '/contractor' }) {
  const [clients, setClients] = useState<AdminClientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    AdminAPI.fetchUsers(accessToken, { includeInactive: true })
      .then((users) => {
        if (!active) return;
        const clientEntries = Array.isArray(users)
          ? users.filter((user) => user.role === "client")
          : [];
        setClients(clientEntries);
      })
      .catch((err) => {
        if (!active) return;
        console.error("ClientDirectory: failed to load clients", err);
        setError("Unable to load clients right now.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      getSearchableValues(client).some((value) => value.includes(term))
    );
  }, [clients, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="p-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg font-semibold">
            Clients ({clients.length})
          </CardTitle>
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by name, email, phone, or ID"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={clearSearch}
              disabled={!searchTerm.trim()}
            >
              Clear
            </Button>
          </div>
        </CardHeader>

        {error && (
          <div className="px-6 pb-3 text-sm text-red-600">{error}</div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center px-6 py-10 text-sm text-gray-500">
                Loading clients...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No clients found.
              </div>
            ) : (
              <Table className="min-w-full border-separate border-spacing-y-2 border-spacing-x-2">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Client
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Phone
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Companies
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Joined
                    </TableHead>
                    <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const name = getClientDisplayName(client);
                    const isActive = client.is_active !== false;
                    const companyCount = client.client_companies_count ?? 0;
                    const companyNames = (client.client_company_names || []).filter(Boolean);

                    return (
                      <TableRow key={client.id}>
                        <TableCell className="px-4 py-3">
                          <span
                            className="text-sm font-semibold text-gray-900 cursor-pointer hover:underline"
                            onClick={() => {
                              const stageTabKey = getStageTabFromStage((client as any)?.currentStage || (client as any)?.current_stage || (client as any)?.stage);
                              const detailPath = getEntityDetailPath(basePath, 'client', client.id, stageTabKey);
                              navigate(detailPath);
                            }}
                          >
                            {name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-sm text-gray-900">{client.email || "—"}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {client.phone || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold text-gray-900">
                          {companyCount > 0 && companyNames.length ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-pointer">{companyCount}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="max-w-xs text-left leading-snug">
                                  {companyNames.join(", ")}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            companyCount
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-sm text-gray-500">
                          {formatDate(client.created_at || "")}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={isActive ? "outline" : "destructive"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
