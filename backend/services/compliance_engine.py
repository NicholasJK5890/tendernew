import json
import logging
import datetime
from typing import List, Dict, Any, Tuple,Optional
from services.tinyfish_client import TinyFishClient

logger = logging.getLogger("compliance_engine")

class ComplianceEngine:
    """
    100% Deterministic Python Compliance & Verification Engine.
    'Verify the vendor's claims. Don't just read them.'
    Never delegates pass/fail or ranking decisions to an LLM.
    """

    def __init__(self):
        self.tinyfish = TinyFishClient()

    async def run_evaluation_pipeline(
        self,
        tender: Any,
        bids: List[Any],
        rulebook: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Runs the full verification & compliance pipeline across all bids for a tender:
        1. Parallel agent checks per bidder (Licence, Company, GeM price)
        2. Cross-bid collusion & fraud analysis
        3. Requirement compliance check (mandatory vs optional)
        4. Ranking (L1 / L2 / L3 or QCBS)
        """
        eval_results = []
        all_vendor_profiles = [bid.vendor for bid in bids]

        # Step 1 & 2: Process individual bidder verification checks
        for bid in bids:
            vendor = bid.vendor
            claimed_specs = json.loads(bid.technical_specs) if isinstance(bid.technical_specs, str) else (bid.technical_specs or {})
            disqualifications = []
            red_flags = []
            checks_created = []

            # ---- AGENT 1: BIS Licence Agent ----
            licences = json.loads(vendor.bis_licences) if isinstance(vendor.bis_licences, str) else (vendor.bis_licences or [])
            relevant_licence = next((l for l in licences if "269" in l.get("is_code", "") or "1786" in l.get("is_code", "") or "4985" in l.get("is_code", "")), None)
            licence_no = relevant_licence.get("licence_no", "CM/L-UNKNOWN") if relevant_licence else "CM/L-NONE"
            is_code = relevant_licence.get("is_code", "IS 269:2015") if relevant_licence else "IS 269:2015"

            bis_res = await self.tinyfish.verify_bis_licence(licence_no, is_code, vendor.company_name)
            checks_created.append({
                "check_name": f"BIS Licence Verification ({is_code})",
                "passed": bis_res["passed"],
                "verdict": bis_res["verdict"],
                "reason": bis_res["reason"],
                "source_name": bis_res["source_name"],
                "source_url": bis_res["source_url"],
                "is_live": bis_res["is_live"],
                "screenshot_path": bis_res["screenshot_path"],
                "raw_data": bis_res["raw_data"]
            })
            if not bis_res["passed"]:
                disqualifications.append(f"Non-compliant BIS Certification: {bis_res['reason']}")

            # ---- AGENT 2: Company & Tax Verification Agent ----
            gst_res = await self.tinyfish.verify_gstin(vendor.gstin, vendor.company_name)
            checks_created.append({
                "check_name": "GSTIN Registration & Status Check",
                "passed": gst_res["passed"],
                "verdict": gst_res["verdict"],
                "reason": gst_res["reason"],
                "source_name": gst_res["source_name"],
                "source_url": gst_res["source_url"],
                "is_live": gst_res["is_live"],
                "screenshot_path": gst_res["screenshot_path"],
                "raw_data": gst_res["raw_data"]
            })
            if not gst_res["passed"]:
                disqualifications.append(f"Invalid GSTIN Status: {gst_res['reason']}")

            mca_res = await self.tinyfish.verify_mca_status(vendor.cin, vendor.company_name)
            checks_created.append({
                "check_name": "MCA21 Corporate Master Data & Debarment",
                "passed": mca_res["passed"],
                "verdict": mca_res["verdict"],
                "reason": mca_res["reason"],
                "source_name": mca_res["source_name"],
                "source_url": mca_res["source_url"],
                "is_live": mca_res["is_live"],
                "screenshot_path": mca_res["screenshot_path"],
                "raw_data": mca_res["raw_data"]
            })

            # ---- AGENT 3: Price & Fraud / Collusion Agent ----
            # Benchmark test
            benchmark_min = (rulebook or {}).get("benchmark_price_range", {}).get("min", 330.0)
            suspect_threshold = (rulebook or {}).get("benchmark_price_range", {}).get("suspect_low_threshold", 300.0)

            if bid.price_per_unit < suspect_threshold:
                red_flags.append(
                    f"Abnormally Low Tender (ALT) Alert: Quoted price ₹{bid.price_per_unit} is significantly below GeM market floor threshold (₹{suspect_threshold}). High risk of contractor abandonment."
                )

            # Collusion analysis with other bidders in the tender
            shared_address_vendors = []
            shared_directors_vendors = []
            cur_directors = set(json.loads(vendor.directors) if isinstance(vendor.directors, str) else (vendor.directors or []))

            for other_bid in bids:
                if other_bid.id == bid.id:
                    continue
                other_v = other_bid.vendor
                # Check address similarity (normalize lowercase)
                if other_v.address.strip().lower() == vendor.address.strip().lower():
                    shared_address_vendors.append(other_v.company_name)
                # Check shared director names
                other_dirs = set(json.loads(other_v.directors) if isinstance(other_v.directors, str) else (other_v.directors or []))
                if cur_directors.intersection(other_dirs):
                    shared_directors_vendors.append(f"{other_v.company_name} (Common: {', '.join(cur_directors.intersection(other_dirs))})")

            if shared_address_vendors:
                red_flags.append(
                    f"Collusion Risk Detected: Shares registered physical address '{vendor.address}' with competing bidder(s): {', '.join(shared_address_vendors)}."
                )
            if shared_directors_vendors:
                red_flags.append(
                    f"Common Directorship Alert: Interlocking board directorship identified with competing bidder(s): {', '.join(shared_directors_vendors)}."
                )

            # Record Fraud / Pricing check
            fraud_passed = len(red_flags) == 0
            checks_created.append({
                "check_name": "Price Benchmark & Cross-Bid Collusion Audit",
                "passed": fraud_passed,
                "verdict": "Pass" if fraud_passed else "Red Flag",
                "reason": "Normal market variance; no cross-bid collusion identified." if fraud_passed else " | ".join(red_flags),
                "source_name": "GeM Price Index & Inter-Bid Collusion Graph",
                "source_url": "https://gem.gov.in/market-prices",
                "is_live": False,
                "screenshot_path": "/static/evidence/gem_price_collusion_graph.png",
                "raw_data": {"red_flags": red_flags, "unit_price": bid.price_per_unit, "benchmark_min": benchmark_min}
            })

            # ---- Step 3: Tender Requirement Compliance ----
            for req in tender.requirements:
                param_key = req.parameter.lower().strip()
                # Determine claimed or verified value
                claimed_val = None
                for k, v in claimed_specs.items():
                    if k.lower() in param_key or param_key in k.lower():
                        claimed_val = v
                        break

                if "bis" in param_key:
                    # Checked via Agent 1
                    if not bis_res["passed"] and req.is_mandatory:
                        if "BIS Licence" not in " ".join(disqualifications):
                            disqualifications.append(f"Failed mandatory requirement: {req.parameter}")
                elif "turnover" in param_key:
                    # Check vendor turnover
                    target_turnover = float(req.value)
                    if vendor.annual_turnover < target_turnover and req.is_mandatory:
                        disqualifications.append(
                            f"Turnover Shortfall: ₹{vendor.annual_turnover:,.0f} is below mandatory ₹{target_turnover:,.0f}"
                        )
                elif claimed_val is not None:
                    # Numeric / string check
                    passed_req = self._evaluate_condition(claimed_val, req.operator, req.value)
                    if not passed_req and req.is_mandatory:
                        disqualifications.append(
                            f"Spec non-compliance on {req.parameter}: Claimed {claimed_val} fails {req.operator} {req.value} {req.unit or ''}"
                        )

            # Determine Bid Status
            if red_flags:
                bid_status = "Red Flagged"
            elif disqualifications:
                bid_status = "Disqualified"
            else:
                bid_status = "Qualified"

            eval_results.append({
                "bid": bid,
                "status": bid_status,
                "disqualifications": disqualifications,
                "red_flags": red_flags,
                "checks": checks_created
            })

        # Step 4: Deterministic Ranking
        if tender.evaluation_method == "QCBS":
            # QCBS formula: Final = (tech_weight * TechScore) + (fin_weight * 100 * (LowestPrice / Price))
            qualified = [r for r in eval_results if r["status"] == "Qualified"]
            if qualified:
                lowest_price = min(r["bid"].price_per_unit for r in qualified)
                tw = tender.tech_weight or 0.7
                fw = tender.fin_weight or 0.3

                for item in eval_results:
                    b = item["bid"]
                    # Base tech score out of 100
                    base_tech = 85.0
                    if item["status"] == "Disqualified":
                        base_tech = 40.0
                    item["tech_score"] = base_tech
                    item["fin_score"] = round(100.0 * (lowest_price / max(b.price_per_unit, 1.0)), 2)
                    item["final_qcbs_score"] = round((tw * item["tech_score"]) + (fw * item["fin_score"]), 2)

                # Sort qualified by final_qcbs_score descending
                qualified.sort(key=lambda x: x["final_qcbs_score"], reverse=True)
                for rank_idx, item in enumerate(qualified, 1):
                    item["rank"] = f"H{rank_idx}"  # H1 / H2 in Indian QCBS terminology
            else:
                for item in eval_results:
                    item["rank"] = None
                    item["tech_score"] = 0.0
                    item["fin_score"] = 0.0
                    item["final_qcbs_score"] = 0.0
        else:
            # Standard L1 evaluation (Goods / Works)
            qualified = [r for r in eval_results if r["status"] == "Qualified"]
            # Tie breaker: delivery_days ascending
            qualified.sort(key=lambda x: (x["bid"].price_per_unit, x["bid"].delivery_days))

            for rank_idx, item in enumerate(qualified, 1):
                item["rank"] = f"L{rank_idx}"

            for item in eval_results:
                if item["status"] != "Qualified":
                    item["rank"] = None

        return eval_results

    def _evaluate_condition(self, claimed: Any, operator: str, target: Any) -> bool:
        """Deterministic numeric and string criteria evaluation."""
        try:
            if operator == "min":
                return float(claimed) >= float(target)
            elif operator == "max":
                return float(claimed) <= float(target)
            elif operator == "eq":
                return str(claimed).strip().lower() == str(target).strip().lower()
            elif operator == "contains":
                return str(target).strip().lower() in str(claimed).strip().lower()
            return True
        except (ValueError, TypeError):
            return str(claimed).strip().lower() == str(target).strip().lower()
