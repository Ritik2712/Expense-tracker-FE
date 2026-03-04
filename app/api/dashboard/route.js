import { NextResponse } from "next/server";

const TX_PAGE_LIMIT = 100;
const MAX_PAGES = 50;

function getApiBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://127.0.0.1:8000/";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
}

async function fetchAllTransactions(baseUrl, token) {
  const all = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `${baseUrl}/transactions/user/all?page=${page}&limit=${TX_PAGE_LIMIT}`;
    const result = await fetchJson(url, token);

    if (!result.ok) {
      return result;
    }

    const batch = Array.isArray(result.data) ? result.data : [];
    all.push(...batch);

    if (batch.length < TX_PAGE_LIMIT) {
      break;
    }
  }

  return { ok: true, status: 200, data: all };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json(
      { detail: "Missing bearer token" },
      { status: 401 },
    );
  }

  const baseUrl = getApiBaseUrl();
  const accountsUrl = `${baseUrl}/accounts?page=1&limit=100`;

  const [accountsResult, transactionsResult] = await Promise.all([
    fetchJson(accountsUrl, token),
    fetchAllTransactions(baseUrl, token),
  ]);

  if (!accountsResult.ok) {
    return NextResponse.json(accountsResult.data || {}, {
      status: accountsResult.status,
    });
  }

  if (!transactionsResult.ok) {
    return NextResponse.json(transactionsResult.data || {}, {
      status: transactionsResult.status,
    });
  }

  return NextResponse.json({
    accounts: Array.isArray(accountsResult.data) ? accountsResult.data : [],
    transactions: Array.isArray(transactionsResult.data)
      ? transactionsResult.data
      : [],
  });
}
