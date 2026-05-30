"""
reksa_fetcher.py — Auto-fetch NAB Reksa Dana dari Bibit.id
==========================================================
Strategi:
  1. Scrape halaman bibit.id/reksadana/<RD_CODE>/<slug>
     → extract JSON dari tag <script id="__NEXT_DATA__">
  2. Fallback: coba endpoint API internal Bibit (beberapa versi)
  3. Last resort: pakai NAB terakhir dari cache Firestore

Format URL Bibit: https://bibit.id/reksadana/RD424/bnp-paribas-pesona-syariah
                                              ^^^^^ kode RD (wajib)
                                                    ^^^^^^^^^^^^^^^^^^^^^^^^ slug (opsional)
"""

import re
import json
import time
import logging
import requests
from datetime import datetime, date

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 20
MAX_RETRIES = 2
RETRY_DELAY = 3

# Headers mirip browser biasa agar tidak kena bot-block
HEADERS_BROWSER = {
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 12; Redmi Note 10) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.6099.210 Mobile Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
}

HEADERS_API = {
    "User-Agent": (
        "Mozilla/5.0 (Linux; Android 12; Redmi Note 10) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.6099.210 Mobile Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9",
    "Origin": "https://bibit.id",
    "Referer": "https://bibit.id/reksadana",
    "x-version": "4",          # header yang dipakai Bibit app
}


# =============================================================================
# MAPPING REKSA DANA
# =============================================================================
# Format entry:
#   "KODE_INTERNAL": {
#       "rd_code": "RD424",          # dari URL bibit.id/reksadana/RD424/...
#       "slug": "bnp-paribas-pesona-syariah",  # dari URL, opsional tapi disarankan
#       "nama_display": "BNP Paribas Pesona Syariah",
#       "jenis": "saham_syariah",
#   }
#
# Cara dapat rd_code & slug:
#   Buka bibit.id → cari reksa dana → klik → lihat URL:
#   https://bibit.id/reksadana/RD424/bnp-paribas-pesona-syariah
#                              ^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^
#                              rd_code        slug
# -----------------------------------------------------------------------------

REKSA_MAPPING = {
    "BNP_PESONA_SYARIAH": {
        "rd_code": "RD424",
        "slug": "bnp-paribas-pesona-syariah",
        "nama_display": "BNP Paribas Pesona Syariah",
        "jenis": "saham_syariah",
    },
    "BRI_INDEKS_SYARIAH": {
        "rd_code": "RD562",
        "slug": "bri-indeks-syariah",
        "nama_display": "BRI Indeks Syariah",
        "jenis": "saham_syariah",
    },
    "BNI_AM_INDEX": {
        "rd_code": "RD337",
        "slug": "bni-am-indeks-idx30",
        "nama_display": "BNI-AM Indeks IDX30",
        "jenis": "saham",
    },
    "MANDIRI_INVESTA_SYARIAH": {
        "rd_code": "RD860",
        "slug": "mandiri-investa-dana-syariah-kelas-a",
        "nama_display": "Mandiri Investa Dana Syariah Kelas A",
        "jenis": "saham_syariah",
    },
    "TRIMEGAH_DANA_SYARIAH": {
        "rd_code": "RD3480",
        "slug": "trimegah-dana-tetap-syariah-kelas-a",
        "nama_display": "Trimegah Dana Tetap Syariah Kelas A",
        "jenis": "obligasi_syariah",
    },
    "BNI_AM_PENDAPATAN_TETAP_SYARIAH": {
        "rd_code": "RD332",
        "slug": "bni-am-dana-pendapatan-tetap-syariah-ardhani",
        "nama_display": "BNI-AM Dana Pendapatan Tetap Syariah Ardhani",
        "jenis": "obligasi_syariah",
    },
    "MAJORIS_SUKUK_NEGARA": {
        "rd_code": "RD838",
        "slug": "majoris-sukuk-negara-indonesia",
        "nama_display": "Majoris Sukuk Negara Indonesia",
        "jenis": "obligasi_syariah",
    },
    "BAHANA_MES_SYARIAH_G": {
        "rd_code": "RD1721",
        "slug": "bahana-mes-syariah-fund-kelas-g",
        "nama_display": "Bahana MES Syariah Fund Kelas G",
        "jenis": "obligasi_syariah",
    },
    "MANULIFE_OBLIGASI_ID_II_A": {
        "rd_code": "RD994",
        "slug": "manulife-obligasi-negara-indonesia-ii-kelas-a",
        "nama_display": "Manulife Obligasi Negara Indonesia II Kelas A",
        "jenis": "obligasi_syariah",
    },
    "BNP_PARIPAS_SUKUK_RK1": {
        "rd_code": "RD6524",
        "slug": "bnp-paribas-sukuk-negara-kelas-rk1",
        "nama_display": "BNP Paribas Sukuk Negara Kelas RK1",
        "jenis": "obligasi_syariah",
    },
    "MAJORIS_PASAR_UANG_SYARIAH_ID": {
        "rd_code": "RD832",
        "slug": "majoris-pasar-uang-syariah-indonesia",
        "nama_display": "Majoris Pasar Uang Syariah Indonesia",
        "jenis": "pasar_uang_syariah",
    },
    # ── Tambahkan reksa danamu di sini ─────────────────────────────────────
    # "KODE_INTERNAL": {
    #     "rd_code": "RDxxx",
    #     "slug": "nama-reksa-di-url-bibit",
    #     "nama_display": "Nama Tampil",
    #     "jenis": "pasar_uang|obligasi|campuran|saham|saham_syariah",
    # },
}


# =============================================================================
# HELPER HTTP
# =============================================================================

def _http_get(url: str, headers: dict, params: dict = None) -> requests.Response | None:
    """GET dengan retry. Return Response object atau None."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(
                url, headers=headers, params=params,
                timeout=REQUEST_TIMEOUT, allow_redirects=True
            )
            resp.raise_for_status()
            return resp
        except requests.exceptions.HTTPError as e:
            logger.warning(f"[reksa] HTTP {e.response.status_code} → {url}")
            return None
        except requests.exceptions.Timeout:
            logger.warning(f"[reksa] Timeout attempt {attempt}/{MAX_RETRIES} → {url}")
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"[reksa] ConnectionError attempt {attempt}/{MAX_RETRIES}: {e}")
        except Exception as e:
            logger.warning(f"[reksa] Error attempt {attempt}/{MAX_RETRIES}: {e}")
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
    return None


# =============================================================================
# SOURCE 1: SCRAPE HALAMAN BIBIT (NEXT.JS __NEXT_DATA__)
# =============================================================================

def _scrape_bibit_page(rd_code: str, slug: str = None) -> dict | None:
    """
    Scrape halaman detail reksa dana Bibit dan extract data dari __NEXT_DATA__.
    URL: https://bibit.id/reksadana/<rd_code>/<slug>
    
    Return dict berisi 'nab', 'nama', 'nav_date' atau None jika gagal.
    """
    # Gunakan slug jika ada agar URL lebih canonical
    if slug:
        url = f"https://bibit.id/reksadana/{rd_code}/{slug}"
    else:
        url = f"https://bibit.id/reksadana/{rd_code}"

    resp = _http_get(url, HEADERS_BROWSER)
    if not resp:
        return None

    html = resp.text

    # ── Pattern 1: <script id="__NEXT_DATA__"> (Next.js SSR) ─────────────
    match = re.search(
        r'<script\s+id=["\']__NEXT_DATA__["\'][^>]*>\s*(\{.*?\})\s*</script>',
        html, re.DOTALL
    )
    if match:
        try:
            data = json.loads(match.group(1))
            # Navigasi ke fund data — path bisa bervariasi antar versi Bibit
            fund = (
                data.get("props", {})
                    .get("pageProps", {})
                    .get("fund") or
                data.get("props", {})
                    .get("pageProps", {})
                    .get("initialData", {})
                    .get("fund") or
                data.get("props", {})
                    .get("pageProps", {})
                    .get("data", {})
                    .get("fund")
            )
            if fund:
                nab = (
                    fund.get("per_unit") or
                    fund.get("nav") or
                    fund.get("nab_per_unit") or
                    fund.get("current_price")
                )
                if nab:
                    return {
                        "nab": float(nab),
                        "nama": fund.get("name") or fund.get("fund_name"),
                        "nav_date": fund.get("nav_date") or fund.get("date"),
                        "source_detail": "bibit_nextdata",
                    }
        except (json.JSONDecodeError, ValueError) as e:
            logger.debug(f"[reksa] __NEXT_DATA__ parse error: {e}")

    # ── Pattern 2: JSON-LD atau embedded JSON lainnya ─────────────────────
    # Cari pola "per_unit": angka di mana saja dalam HTML
    match2 = re.search(r'"per_unit"\s*:\s*([0-9]+(?:\.[0-9]+)?)', html)
    if match2:
        nab = float(match2.group(1))
        if nab > 0:
            # Coba juga ambil nama dari title tag
            nama_match = re.search(r'<title>([^<]+)</title>', html)
            nama = nama_match.group(1).split(" - ")[0].strip() if nama_match else None
            return {
                "nab": nab,
                "nama": nama,
                "nav_date": None,
                "source_detail": "bibit_html_regex",
            }

    logger.warning(f"[reksa] Scrape halaman Bibit tidak menemukan NAB → {url}")
    return None


# =============================================================================
# SOURCE 2: BIBIT INTERNAL API
# =============================================================================

def _fetch_bibit_api(rd_code: str) -> dict | None:
    """
    Coba beberapa endpoint API internal Bibit.
    rd_code contoh: "RD424" → nomor: "424"
    """
    # Ekstrak angka dari kode RD
    rd_number = re.sub(r'[^0-9]', '', rd_code)
    if not rd_number:
        return None

    # Daftar endpoint yang diketahui dari reverse engineering komunitas
    endpoints = [
        f"https://api.bibit.id/rireksa/v2/product/{rd_number}",
        f"https://api.bibit.id/rireksa/product/{rd_number}",
        f"https://api.bibit.id/fund/v2/{rd_number}",
        f"https://api.bibit.id/rireksa/v1/product?fund_id={rd_number}",
    ]

    for endpoint in endpoints:
        resp = _http_get(endpoint, HEADERS_API)
        if not resp:
            continue
        try:
            data = resp.json()
            # Coba berbagai path response
            fund = (
                data.get("data", {}).get("fund") or
                data.get("data") or
                data.get("fund") or
                data
            )
            nab = (
                fund.get("per_unit") or
                fund.get("nav") or
                fund.get("nab") or
                fund.get("current_price")
            )
            if nab and float(nab) > 0:
                return {
                    "nab": float(nab),
                    "nama": fund.get("name") or fund.get("fund_name"),
                    "nav_date": fund.get("nav_date") or fund.get("date"),
                    "source_detail": f"bibit_api:{endpoint.split('/')[-1]}",
                }
        except Exception as e:
            logger.debug(f"[reksa] API endpoint {endpoint} parse error: {e}")

    return None


# =============================================================================
# MAIN FETCH LOGIC PER REKSA DANA
# =============================================================================

def fetch_single_reksa(kode: str, config: dict, last_nab: float = None) -> dict:
    """
    Fetch NAB satu reksa dana. Urutan:
    1. Scrape halaman Bibit (paling reliable, data SSR)
    2. Bibit internal API (beberapa endpoint)
    3. Cache terakhir (agar tidak null)
    """
    rd_code = config.get("rd_code", "")
    slug    = config.get("slug", "")
    nama    = config.get("nama_display", kode)
    nab     = None
    source  = None
    nav_date = None

    # ── 1. Scrape halaman Bibit ───────────────────────────────────────────
    result = _scrape_bibit_page(rd_code, slug)
    if result and result.get("nab"):
        nab      = result["nab"]
        nav_date = result.get("nav_date")
        source   = "bibit_scrape"
        logger.info(f"[reksa] ✅ {nama} = Rp {nab:,.2f} ({result['source_detail']})")

    # ── 2. Bibit API ──────────────────────────────────────────────────────
    if not nab:
        result2 = _fetch_bibit_api(rd_code)
        if result2 and result2.get("nab"):
            nab      = result2["nab"]
            nav_date = result2.get("nav_date")
            source   = "bibit_api"
            logger.info(f"[reksa] ✅ {nama} = Rp {nab:,.2f} ({result2['source_detail']})")

    # ── 3. Cache terakhir ─────────────────────────────────────────────────
    if not nab and last_nab:
        nab    = last_nab
        source = "cache"
        logger.warning(f"[reksa] ⚠️  {nama} — semua source gagal, pakai cache = Rp {nab:,.2f}")

    if not nab:
        logger.error(f"[reksa] ❌ {nama} ({rd_code}) — tidak dapat NAB dari manapun!")

    return {
        "kode": kode,
        "rd_code": rd_code,
        "nama": nama,
        "jenis": config.get("jenis", "unknown"),
        "current_nab": nab,
        "nav_date": nav_date or date.today().isoformat(),
        "source": source,
        "fetch_time": datetime.now().isoformat(),
        "ok": nab is not None,
    }


def fetch_all_reksa(watchlist: list = None, last_data: dict = None) -> dict:
    """
    Fetch NAB semua reksa dana dalam REKSA_MAPPING (atau subset dari watchlist).

    Args:
        watchlist : list kode internal, None = ambil semua
        last_data : dict NAB terakhir dari Firestore untuk fallback
                    format: { "KODE_INTERNAL": {"current_nab": 1234.5, ...} }

    Returns:
        {
            "results": { "KODE": {result_dict}, ... },
            "summary": { "total": N, "ok": N, "failed": N, "cached": N },
            "fetch_time": "ISO string",
        }
    """
    last_data   = last_data or {}
    target_keys = watchlist if watchlist else list(REKSA_MAPPING.keys())

    results = {}
    stats   = {"total": 0, "ok": 0, "failed": 0, "cached": 0}

    for kode in target_keys:
        if kode not in REKSA_MAPPING:
            logger.warning(f"[reksa] Kode '{kode}' tidak ada di REKSA_MAPPING — skip")
            continue

        config   = REKSA_MAPPING[kode]
        last_nab = last_data.get(kode, {}).get("current_nab")

        result           = fetch_single_reksa(kode, config, last_nab)
        results[kode]    = result

        stats["total"] += 1
        if result["ok"]:
            stats["ok"] += 1
            if result["source"] == "cache":
                stats["cached"] += 1
        else:
            stats["failed"] += 1

        # Rate limiting — jangan terlalu agresif
        time.sleep(2)

    logger.info(
        f"[reksa] Selesai: {stats['ok']}/{stats['total']} berhasil, "
        f"{stats['cached']} dari cache, {stats['failed']} gagal"
    )

    return {
        "results": results,
        "summary": stats,
        "fetch_time": datetime.now().isoformat(),
    }


# =============================================================================
# FORMAT OUTPUT UNTUK RUNNER.PY
# =============================================================================

def format_for_firestore(fetch_result: dict) -> dict:
    """
    Convert output fetch_all_reksa() ke format yang siap disimpan ke Firestore
    dan dipakai oleh analyst/engine.py (field 'current_nab' per kode).
    """
    out = {}
    for kode, v in fetch_result["results"].items():
        if v["ok"]:
            out[kode] = {
                "current_nab": v["current_nab"],
                "nama":        v["nama"],
                "jenis":       v["jenis"],
                "nav_date":    v["nav_date"],
                "source":      v["source"],
                "fetch_time":  v["fetch_time"],
            }
    return out


# =============================================================================
# TEST STANDALONE
# =============================================================================

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )

    print("=" * 65)
    print("OMNI-INVEST — Reksa Dana Auto-Fetch Test (Bibit)")
    print("=" * 65)

    data = fetch_all_reksa()

    print(f"\n{'KODE':<25} {'NAB':>14}  {'SOURCE':<18} {'STATUS'}")
    print("-" * 65)
    for kode, r in data["results"].items():
        status  = "✅" if r["ok"] else "❌"
        nab_str = f"Rp {r['current_nab']:>12,.2f}" if r["current_nab"] else "N/A".rjust(15)
        src     = f"[{r['source']}]" if r["source"] else "[FAILED]"
        print(f"  {kode:<23} {nab_str}  {src:<18} {status}")

    print(f"\nSummary : {data['summary']}")
    print(f"Waktu   : {data['fetch_time']}")