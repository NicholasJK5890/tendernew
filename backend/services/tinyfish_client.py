import os
import json
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("tinyfish_client")

class TinyFishClient:
    """
    TinyFish Web Verification Agent Client.
    Connects to TinyFish Web Automation API if TINYFISH_API_KEY is present.
    Gracefully falls back to pre-generated realistic cached portal evidence
    and explicitly marks results as 'cached demo evidence'.
    """

    def __init__(self):
        self.api_key = os.getenv("TINYFISH_API_KEY")
        self.base_url = os.getenv("TINYFISH_BASE_URL", "https://api.tinyfish.io/v1")
        self.timeout = float(os.getenv("TINYFISH_TIMEOUT", "10.0"))

    async def verify_bis_licence(self, licence_no: str, is_code: str, vendor_name: str) -> Dict[str, Any]:
        """
        Verify BIS Manakonline licence status, validity, and IS code compliance.
        """
        if self.api_key:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/agents/bis-lookup",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json={
                            "licence_number": licence_no,
                            "is_standard": is_code,
                            "vendor_name": vendor_name
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return {
                            "is_live": True,
                            "source_name": "BIS Manakonline Portal (Live Agent)",
                            "source_url": "https://www.manakonline.in/MANAK/searchLicence",
                            "passed": data.get("valid", False),
                            "verdict": "Pass" if data.get("valid", False) else "Fail",
                            "reason": data.get("reason", "Verified via live BIS portal automation."),
                            "screenshot_path": data.get("screenshot_url", "/static/evidence/bis_verified_sample.png"),
                            "raw_data": data
                        }
            except Exception as e:
                logger.warning(f"TinyFish live call failed ({e}). Falling back to cached demo evidence.")

        # Deterministic cached demo fallback based on licence_no / vendor
        # CM/L-4829103 is seeded as expired (Vendor A: Shree Ram Cement)
        if "4829103" in licence_no or "Shree Ram" in vendor_name:
            return {
                "is_live": False,
                "source_name": "BIS Manakonline Portal (Cached Demo Evidence)",
                "source_url": "https://www.manakonline.in/MANAK/searchLicence",
                "passed": False,
                "verdict": "Fail",
                "reason": f"BIS Licence {licence_no} expired on 31-Dec-2025. Status listed as 'EXPIRED / CANCELLED' on BIS Manakonline.",
                "screenshot_path": "/static/evidence/bis_expired_shree_ram.png",
                "raw_data": {
                    "licence_no": licence_no,
                    "standard": is_code,
                    "status": "EXPIRED",
                    "expiry_date": "2025-12-31",
                    "manufacturer": vendor_name,
                    "note": "Cached demo evidence"
                }
            }

        # Valid BIS licence (Ultracem / Ambuja)
        return {
            "is_live": False,
            "source_name": "BIS Manakonline Portal (Cached Demo Evidence)",
            "source_url": "https://www.manakonline.in/MANAK/searchLicence",
            "passed": True,
            "verdict": "Pass",
            "reason": f"Active BIS certification confirmed for {is_code}. Licence valid through 31-Mar-2028. Factory audit cleared.",
            "screenshot_path": "/static/evidence/bis_active_ultracem.png",
            "raw_data": {
                "licence_no": licence_no,
                "standard": is_code,
                "status": "OPERATIVE / ACTIVE",
                "valid_till": "2028-03-31",
                "manufacturer": vendor_name,
                "note": "Cached demo evidence"
            }
        }

    async def verify_gstin(self, gstin: str, legal_name: str) -> Dict[str, Any]:
        """
        Verify GSTIN validity, trade name alignment and active filing status.
        """
        if self.api_key:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/agents/gst-lookup",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json={"gstin": gstin, "legal_name": legal_name}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return {
                            "is_live": True,
                            "source_name": "GST Common Portal (Live Agent)",
                            "source_url": "https://services.gst.gov.in/services/searchtp",
                            "passed": data.get("active", False),
                            "verdict": "Pass" if data.get("active", False) else "Fail",
                            "reason": data.get("status_desc", "Live GST verification completed."),
                            "screenshot_path": data.get("screenshot_url", "/static/evidence/gst_verified.png"),
                            "raw_data": data
                        }
            except Exception as e:
                logger.warning(f"TinyFish GST lookup failed ({e}). Using cached demo evidence.")

        # Demo fallback
        return {
            "is_live": False,
            "source_name": "GST Common Portal (Cached Demo Evidence)",
            "source_url": "https://services.gst.gov.in/services/searchtp",
            "passed": True,
            "verdict": "Pass",
            "reason": f"GSTIN {gstin} is ACTIVE under Regular taxpayer category. GSTR-3B filings current up to last month.",
            "screenshot_path": "/static/evidence/gst_active_portal.png",
            "raw_data": {
                "gstin": gstin,
                "taxpayer_status": "Active",
                "legal_name": legal_name,
                "taxpayer_type": "Regular",
                "state": "Delhi / Haryana",
                "note": "Cached demo evidence"
            }
        }

    async def verify_mca_status(self, cin: str, company_name: str) -> Dict[str, Any]:
        """
        Verify Company Master Data on Ministry of Corporate Affairs (MCA21).
        """
        return {
            "is_live": False,
            "source_name": "MCA21 Corporate Affairs (Cached Demo Evidence)",
            "source_url": "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do",
            "passed": True,
            "verdict": "Pass",
            "reason": f"Company {company_name} is listed as ACTIVE in MCA Registrar of Companies (ROC). No default notices or active debars.",
            "screenshot_path": "/static/evidence/mca_master_data.png",
            "raw_data": {
                "cin": cin or "U26940DL2014PTC271920",
                "company_status": "Active",
                "roc": "ROC Delhi",
                "paid_up_capital": 50000000,
                "note": "Cached demo evidence"
            }
        }
